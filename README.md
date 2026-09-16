# Birthday Card Studio 🎂

Create a cutesy, interactive digital birthday card and share it as a link — no HTML file, no leaked file metadata. The card editor lives at `/`, and every finished card gets its own shareable page at `/card/<id>`.

**What's on the card:**
- 4 themes (Bubblegum Pop, Golden Sunset, Midnight Galaxy, Garden Party)
- A sealed envelope — tapping it plays the uploaded song and opens the card
- A photo gallery (up to 6 images)
- A bouquet of flowers that each reveal a motivational message when tapped
- A cake with candles that blow out one tap at a time, ending in a confetti "wish granted" moment
- A soft floating-particle background matching the chosen theme

---

## 1. Run it locally (optional, to test first)

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm start
```

Then open **http://localhost:3000** — build a card there, and open the share link it gives you in a new tab to see the recipient's view.

---

## 2. Put it on GitHub

```bash
git init
git add .
git commit -m "Birthday card studio"
```

Create a new empty repository on GitHub (no README/license, you already have one), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy on Render

1. Go to [render.com](https://render.com) and sign in (you can sign in with GitHub).
2. Click **New +** → **Web Service**.
3. Connect the GitHub repo you just pushed.
4. Fill in:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine to start
5. Click **Create Web Service**. Render will build and deploy it, and give you a URL like `https://your-app.onrender.com`.
6. Open that URL — that's your editor. Every card you create there is shareable at `https://your-app.onrender.com/card/<id>`.

That's it — no personal computer details ever appear in the link or the page, since everything is served from Render's servers, not your laptop.

---

## A note on storage (read before sending cards to someone important)

Render's **free** web services use a temporary filesystem: uploaded photos, songs, and card data are stored on disk and will be **wiped whenever the service restarts or redeploys** (this can happen after periods of inactivity on the free tier). This is fine for testing, but if you want a card link that reliably lasts:

- **Easiest fix:** add a small persistent disk to the Render service (Render dashboard → your service → **Disks** → add a disk mounted at `/opt/render/project/src/data` and another at `.../uploads`). This is available on paid instance types.
- **More robust fix (optional upgrade):** swap local file storage for a free-tier cloud database + storage bucket (e.g. MongoDB Atlas for card data, Cloudinary for images/audio). Ask me and I can wire that up if you'd like the link to be permanent without paying for a disk.

---

## Project structure

```
birthday-card-app/
  server.js          Express server (API + static file serving)
  package.json
  public/
    index.html        Editor page
    editor.js
    card.html          Recipient-facing card page
    card.js
    style.css          Shared styles + editor styling
    themes.css         Per-theme color variables for the card view
    card.css           Card view layout (envelope, bouquet, cake, particles)
  data/                Created at runtime: one JSON file per card
  uploads/             Created at runtime: one folder per card (photos + song)
```
