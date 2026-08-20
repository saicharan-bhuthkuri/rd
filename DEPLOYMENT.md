# Deployment Guide

This guide outlines the step-by-step instructions to deploy the R&D Cell platform to production.

## 1. Backend: Deploying to Render (API Server)

The backend API server requires a **Linux** environment with **Node.js** and **LibreOffice** (for converting PowerPoint templates to PDF certificates and offer letters). 

To make this seamless and failproof, we have pre-configured a **Docker-based deployment** for Render:

### Steps:
1. **Push your code to a Git repository** (GitHub or GitLab).
2. **Log into Render** (https://render.com) and click **New > Web Service**.
3. **Connect your Git repository** to Render.
4. **Configure the Web Service**:
   - **Name**: `rd-backend` (or a name of your choice)
   - **Environment**: Select **Docker** (Render will automatically detect the `Dockerfile` inside the `backend` folder).
   - **Root Directory**: `backend`
5. **Set Environment Variables** under the **Advanced** section:
   - `PORT`: `5000` (or leave blank; Render defaults to port 10000 or automatically assigns it)
   - `TURSO_URL`: `https://rd-saicharan-bhuthkuri.aws-ap-south-1.turso.io`
   - `TURSO_TOKEN`: `YOUR_TURSO_TOKEN_HERE`
   - `JWT_SECRET`: `YOUR_SECRET_JWT_KEY_HERE`
   - `SENDER_EMAIL`: `tcekrd@gmail.com`
   - `SENDER_PASSWORD`: `tewheruxhrdwzqmu`
6. Click **Create Web Service**. Render will build the Docker container (which installs node, LibreOffice, and system fonts) and deploy your API server securely with HTTPS.
7. Note down the deployed service URL (e.g. `https://rd-backend.onrender.com`).

---

## 2. Frontend: Deploying to Firebase Hosting

The React frontend compiles into optimized static assets that are served via Firebase Hosting.

### Steps:
1. **Update the Production API URL**:
   - Open [frontend/.env.production](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/frontend/.env.production)
   - Replace the `VITE_API_URL` value with your deployed Render service URL (e.g., `https://rd-backend.onrender.com`).
2. **Build the Production Assets**:
   - Open a terminal inside the `frontend` directory and run:
     ```bash
     npm run build
     ```
   - This creates the production bundle inside `frontend/dist`.
3. **Initialize Firebase in Your Workspace**:
   - Install the Firebase CLI globally if you haven't already:
     ```bash
     npm install -g firebase-tools
     ```
   - Login to your Firebase account:
     ```bash
     firebase login
     ```
4. **Set Your Project ID**:
   - Open [.firebaserc](file:///c:/Users/bhuth/OneDrive/Desktop/New%20folder/.firebaserc)
   - Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Firebase project ID.
5. **Deploy**:
   - Run the deploy command from the workspace root directory:
     ```bash
     firebase deploy --only hosting
     ```
6. Firebase will deploy your static files and serve them securely via custom SSL/HTTPS.

---

## Security Verification (CORS & HTTPS)
- Render web services run on secure HTTPS endpoints automatically.
- Firebase Hosting enforces HTTPS out of the box.
- The backend has CORS headers enabled globally (`app.use(cors())`), allowing the Firebase domain to interact with the API endpoints smoothly.
