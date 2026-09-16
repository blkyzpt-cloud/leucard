const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
[DATA_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Files are held in memory briefly, then written to disk once we know the card id.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Create a new card
app.post(
  '/api/cards',
  upload.fields([
    { name: 'images', maxCount: 6 },
    { name: 'music', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const id = uuidv4().slice(0, 8);
      const cardDir = path.join(UPLOADS_DIR, id);
      fs.mkdirSync(cardDir, { recursive: true });

      const images = [];
      if (req.files.images) {
        req.files.images.forEach((file, i) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `image_${i}${ext}`;
          fs.writeFileSync(path.join(cardDir, filename), file.buffer);
          images.push(`/uploads/${id}/${filename}`);
        });
      }

      let music = null;
      if (req.files.music && req.files.music[0]) {
        const file = req.files.music[0];
        const ext = path.extname(file.originalname) || '.mp3';
        const filename = `music${ext}`;
        fs.writeFileSync(path.join(cardDir, filename), file.buffer);
        music = `/uploads/${id}/${filename}`;
      }

      let flowers = [];
      try {
        flowers = JSON.parse(req.body.flowers || '[]');
      } catch (e) {
        flowers = [];
      }

      const card = {
        id,
        recipientName: (req.body.recipientName || 'Friend').slice(0, 60),
        senderName: (req.body.senderName || '').slice(0, 60),
        message: (req.body.message || '').slice(0, 1000),
        theme: req.body.theme || 'bubblegum',
        images,
        music,
        flowers,
        numCandles: Math.min(Math.max(parseInt(req.body.numCandles, 10) || 5, 1), 12),
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(card, null, 2));
      res.json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create card' });
    }
  }
);

// Fetch a card's data
app.get('/api/cards/:id', (req, res) => {
  const safeId = req.params.id.replace(/[^a-zA-Z0-9]/g, '');
  const filePath = path.join(DATA_DIR, `${safeId}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Card not found' });
  const card = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(card);
});

// Shareable card view (client-side fetches the JSON above)
app.get('/card/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

app.listen(PORT, () => console.log(`Birthday card app running on port ${PORT}`));
