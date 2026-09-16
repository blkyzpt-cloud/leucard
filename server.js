require('dotenv').config();
const path = require('path');
const { Readable } = require('stream');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

const REQUIRED_ENV = [
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy .env.example to .env locally, or set these in your Render dashboard. See README.md.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploaded files are held in memory just long enough to forward them to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let cardsCollection;

async function initDb() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('birthday_cards');
  cardsCollection = db.collection('cards');
  await cardsCollection.createIndex({ id: 1 }, { unique: true });
  console.log('Connected to MongoDB Atlas');
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

const MAX_IMAGES = 15;

// Create a new card
app.post(
  '/api/cards',
  upload.fields([
    { name: 'images', maxCount: MAX_IMAGES },
    { name: 'music', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = uuidv4().slice(0, 8);
      const folder = `birthday-cards/${id}`;

      const images = [];
      if (req.files.images) {
        for (const file of req.files.images) {
          // eslint-disable-next-line no-await-in-loop
          const result = await uploadBuffer(file.buffer, { folder, resource_type: 'image' });
          images.push(result.secure_url);
        }
      }

      let music = null;
      if (req.files.music && req.files.music[0]) {
        // Cloudinary stores audio under its "video" resource type.
        const result = await uploadBuffer(req.files.music[0].buffer, { folder, resource_type: 'video' });
        music = result.secure_url;
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
        message: (req.body.message || '').slice(0, 4000),
        theme: req.body.theme || 'bubblegum',
        images,
        music,
        flowers,
        numCandles: Math.min(Math.max(parseInt(req.body.numCandles, 10) || 5, 1), 12),
        createdAt: new Date().toISOString(),
      };

      await cardsCollection.insertOne(card);
      res.json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create card' });
    }
  }
);

// Fetch a card's data
app.get('/api/cards/:id', async (req, res) => {
  try {
    const safeId = req.params.id.replace(/[^a-zA-Z0-9]/g, '');
    const card = await cardsCollection.findOne({ id: safeId }, { projection: { _id: 0 } });
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load card' });
  }
});

// Shareable card view (client-side fetches the JSON above)
app.get('/card/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

// Catches upload errors (too many files, file too large, etc.) so the client
// gets a clear JSON error instead of a broken response.
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    let message = 'There was a problem with your upload.';
    if (err.code === 'LIMIT_FILE_SIZE') message = 'One of your files is too large (20MB max each).';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') message = `You can upload up to ${MAX_IMAGES} photos.`;
    return res.status(400).json({ error: message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Birthday card app running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas. Check MONGODB_URI.', err);
    process.exit(1);
  });
