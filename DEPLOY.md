# Deploy Lendify Live

Your app is ready to go live. Here’s how to deploy it for free.

## Option 1: Render (recommended, free)

1. **Push your code to GitHub**
   - Create a repo at https://github.com/new
   - Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Lendify app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to https://render.com and sign up (free).
   - Click **New** → **Web Service**.
   - Connect your GitHub repo and select the `tools` (or your repo) folder.
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Instance Type:** Free
   - Click **Create Web Service**.
   - Wait for the first deploy. You’ll get a URL like `https://lendify-xxxx.onrender.com`.

3. **Use your live app**
   - Open that URL in a browser. The app uses relative URLs, so it works on the live domain.
   - Data is stored in a JSON file; on the free tier it resets if the service sleeps or restarts.

---

## Option 2: Railway

1. Go to https://railway.app and sign up.
2. **New Project** → **Deploy from GitHub** → choose your repo.
3. Railway will detect Node and run `npm start`. It will assign a public URL.
4. Open the generated URL to use the app.

---

## Option 3: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. In your project folder:
   ```bash
   fly launch
   ```
   Accept defaults, then:
   ```bash
   fly deploy
   ```
3. Your app will be at `https://YOUR_APP_NAME.fly.dev`.

---

## What was changed for deployment

- **PORT:** Server uses `process.env.PORT || 3000` so hosts can set the port.
- **Binding:** Server listens on `0.0.0.0` so it’s reachable from the internet.
- **Health check:** `GET /api/health` returns `{ status: 'ok' }` for platform checks.
- **API calls:** The frontend uses relative paths (e.g. `/api/login`), so it works on any domain.

After deploying, share your live URL (e.g. `https://lendify-xxxx.onrender.com`) so others can use Lendify.
