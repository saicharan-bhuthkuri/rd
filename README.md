# Trinity College R&D Cell Bulk Dispatch System

A high-performance bulk email dispatch system for event participation certificates and coordinator offer letters.

## Features
* **Google Apps Script HTTP Proxy**: Redirects email payloads over HTTPS (port 443) to completely bypass SMTP port blocks on Render Free Tier.
* **Batch PDF Generation**: Uses headless LibreOffice to batch-convert custom PPTX files to PDF in a single command, reducing processing times from 15 seconds to ~2 seconds.
* **Dynamic Font Spacing**: Automatically maps custom fonts like `Cardo Bold` and `Bebas Neue Bold` to container fonts, disabling word-wrap on header shapes to prevent layouts from overlapping.
* **Auto Font Resizing**: Automatically scales down event description text for long event titles to ensure paragraph text fits on exactly two lines.

---

## 🚀 Local Development

### 1. Backend setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `backend/.env`:
   ```ini
   TURSO_URL=your_turso_db_url
   TURSO_TOKEN=your_turso_auth_token
   JWT_SECRET=your_secret_key
   SENDER_EMAIL=your_email@gmail.com
   SENDER_PASSWORD=your_gmail_app_password
   GMAIL_HTTP_PROXY_URL=your_google_apps_script_url
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📦 Deployment Commands

### 1. Deploy Frontend (Firebase Hosting)
To deploy the frontend to [https://tcek-rd.web.app/](https://tcek-rd.web.app/):
```bash
cd frontend
npm run build
npx firebase deploy --only hosting
```

### 2. Deploy Backend (Render)
Pushes to the `master` branch automatically trigger a rebuild and redeployment of the backend Docker service on Render:
```bash
git add .
git commit -m "Deploy latest backend changes"
git push origin master
```

#### Render Service Configurations:
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm start`
* **Environment Variables**: Make sure `GMAIL_HTTP_PROXY_URL` is set in Render Dashboard > Environment.
