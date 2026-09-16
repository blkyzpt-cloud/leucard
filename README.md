# Birthday Card Studio 🎂

Create a cutesy, interactive digital birthday card and share it as a link that lasts. Card data lives in MongoDB Atlas and photos/music live in Cloudinary — both have permanent free tiers, so nothing gets wiped when the app restarts or redeploys.

**What's on the card:**
- 4 themes (Bubblegum Pop, Golden Sunset, Midnight Galaxy, Garden Party)
- A sealed envelope — tapping it plays the uploaded song and opens the card
- A photo gallery (up to 6 images)
- A bouquet of flowers that each reveal a motivational message when tapped
- A cake with candles that blow out one tap at a time, ending in a confetti "wish granted" moment
- A soft floating-particle background matching the chosen theme

---

## 1. Create your two free accounts (5 minutes, do this first)

### MongoDB Atlas (stores card text/settings)
1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up.
2. Create a free **M0** cluster (any provider/region is fine).
3. Under **Database Access**, add a database user with a username and password (save these).
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) — this is needed since Render's IPs aren't fixed on the free tier.
5. Click **Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `<user>` and `<password>` with the ones you made in step 3.

### Cloudinary (stores photos and the song)
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for the free tier.
2. On your dashboard home page, copy your **Cloud name**, **API Key**, and **API Secret**.

Keep both sets of credentials handy for step 3.

---

## 2. Run it locally (optional, to test first)

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
cp .env.example .env
```

Open `.env` and fill in the four values from step 1. Then:

```bash
npm start
```

Open **http://localhost:3000**, build a card, and open the share link it gives you.

---

## 3. Put it on GitHub

```bash
git init
git add .
git commit -m "Birthday card studio"
```

Create a new empty repository on GitHub, then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Your `.env` file is already in `.gitignore`, so your credentials never get pushed.

---

## 4. Deploy on Render

1. Go to [render.com](https://render.com) and sign in (GitHub sign-in is easiest).
2. Click **New +** → **Web Service** → connect the repo you just pushed.
3. Fill in:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free is fine
4. Before deploying, open the **Environment** tab and add these four variables (same values as your `.env`):
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. Click **Create Web Service**. Render builds and deploys it, giving you a URL like `https://your-app.onrender.com`.

That's your editor. Every card created there is shareable at `https://your-app.onrender.com/card/<id>` — permanently, since nothing is stored on Render's own disk.

**One free-tier quirk to know:** Render's free web services "sleep" after 15 minutes of no traffic and take 30–60 seconds to wake back up on the next visit. The link itself never breaks or expires — the first person to open it after a quiet period just waits a moment for the page to load. If that matters for a big reveal moment, Render's cheapest paid tier removes the sleep delay.

---

## Project structure

```
birthday-card-app/
  server.js          Express server: API routes, MongoDB + Cloudinary wiring
  package.json
  .env.example        Template for local environment variables
  public/
    index.html         Editor page
    editor.js
    card.html           Recipient-facing card page
    card.js
    style.css           Shared styles + editor styling
    themes.css          Per-theme color variables for the card view
    card.css            Card view layout (envelope, bouquet, cake, particles)
```

Card data is stored in a `birthday_cards.cards` collection in your Atlas cluster; photos and music are stored in your Cloudinary account under a `birthday-cards/<card-id>` folder.
