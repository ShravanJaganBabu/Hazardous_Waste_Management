# HAZTRACK — Free Cloud Deployment Guide

This comprehensive guide walks you through deploying **HAZTRACK (Hazardous Waste Management & Tracking System)** to free cloud hosting platforms with zero upfront cost.

---

## 1. System Architecture Overview

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client.
* **Backend:** Node.js (ES Modules), Express.js, Socket.IO Server, JWT Authentication, Monitoring Engine.
* **Database:** MongoDB Atlas (Free M0 Shared Cluster) or Self-Hosted MongoDB.

You can deploy HazTrack using either of two free deployment models:
1. **Option A (Recommended for Simplicity): Single-Service Monolith on Render / Railway**  
   The backend builds the frontend and serves static assets alongside the API and WebSocket server on a single free Web Service.
2. **Option B (Decoupled Best-Practice): Frontend on Vercel/Netlify + Backend on Render/Railway**  
   Frontend static assets are served worldwide via edge CDN, and the backend operates as a dedicated API/WebSocket web service.

---

## 2. Database Setup: MongoDB Atlas (100% Free)

HazTrack uses MongoDB to store manifests, shipments, users, audit logs, and compliance records. Follow these steps to obtain a free cloud database:

1. Sign up or log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new organization and project, then click **Create a Database**.
3. Select the **M0 Shared (Free forever)** cluster tier and choose your nearest cloud provider/region (e.g. AWS Mumbai `ap-south-1`).
4. **Database Access (User Credentials):**
   * Under **Security** → **Database Access**, click **Add New Database User**.
   * Authentication Method: **Password**.
   * Example Username: `haztrack_admin`.
   * Create a strong password (e.g. `HazTrackSecure2026!`) and note it down.
   * Database User Privileges: **Read and write to any database** (`Atlas admin` or `readWriteAnyDatabase`).
5. **Network Access (CRITICAL FOR CLOUD HOSTING):**
   * Under **Security** → **Network Access**, click **Add IP Address**.
   * Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   * *Why this is necessary:* Cloud platforms like Render, Railway, and Vercel use dynamic outbound IP addresses. Without `0.0.0.0/0`, the cloud server will not be able to connect to the database.
6. **Obtain Connection String:**
   * Go to **Database** → click **Connect** on your cluster.
   * Select **Drivers** → Node.js.
   * Copy the connection string. It will look like:
     ```
     mongodb+srv://haztrack_admin:<password>@cluster0.abcde.mongodb.net/haztrack?retryWrites=true&w=majority
     ```
   * Replace `<password>` with your database user password, and ensure the database name is `haztrack`.

---

## 3. Option A: Monolithic Deployment on Render (Recommended)

In this configuration, Render runs a single free Web Service that hosts both the frontend UI and the backend API/WebSocket engine.

### Step 1: Create a Render Web Service
1. Push your repository to GitHub or GitLab.
2. Log into [Render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your repository.
4. Configure the service settings:
   * **Name:** `haztrack-system` (or your preferred name)
   * **Region:** Closest to your users (e.g. Singapore or Frankfurt)
   * **Branch:** `main` (or your current branch)
   * **Root Directory:** *(leave blank — repository root)*
   * **Environment:** `Node`
   * **Build Command:**
     ```bash
     npm install && npm run build
     ```
   * **Start Command:**
     ```bash
     npm start
     ```
   * **Instance Type:** `Free`

### Step 2: Configure Environment Variables on Render
Under the **Environment** tab on Render, add the following key-value pairs:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `HOST` | `0.0.0.0` | Binds to all interfaces (required by Render proxy) |
| `MONGODB_URI` | `mongodb+srv://haztrack_admin:<pwd>@cluster0.abcde.mongodb.net/haztrack?retryWrites=true&w=majority` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | `generate-a-strong-secret-key-at-least-64-characters-long` | Cryptographic JWT signing secret |
| `SERVE_FRONTEND` | `true` | Directs backend to serve built frontend static files |
| `ALLOW_EMBEDDED_DB_FALLBACK` | `true` | Allows memory engine fallback if Atlas temporarily disconnects |

Click **Save Changes** and deploy! Once the build finishes, open the Render URL (e.g. `https://haztrack-system.onrender.com`).

---

## 4. Option B: Decoupled Deployment (Vercel + Render)

In this setup, the frontend is deployed to Vercel/Netlify for fast edge loading, and the backend is deployed to Render/Railway.

### Part 1: Deploy Backend to Render
1. Create a Web Service on [Render.com](https://render.com).
2. Connect your repo and configure:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
   * **Environment Variables:**
     * `NODE_ENV`: `production`
     * `HOST`: `0.0.0.0`
     * `MONGODB_URI`: `your-mongodb-atlas-uri`
     * `JWT_SECRET`: `your-strong-jwt-secret`
     * `CORS_ORIGIN`: `https://your-frontend.vercel.app` *(update after creating frontend)*
     * `CLIENT_URL`: `https://your-frontend.vercel.app`
3. Note your backend URL (e.g. `https://haztrack-api.onrender.com`).

### Part 2: Deploy Frontend to Vercel
1. Log into [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Select your repository.
3. Configure the project:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. **Environment Variables:**
   * `VITE_API_URL`: `https://haztrack-api.onrender.com`
   * `VITE_SOCKET_URL`: `https://haztrack-api.onrender.com`
5. Click **Deploy**.
6. Copy the Vercel production URL and update `CORS_ORIGIN` and `CLIENT_URL` in your Render backend settings.

---

## 5. Pre-Seeded Default Accounts & Credentials

When the backend boots for the first time against a fresh MongoDB database, it automatically executes `seedDatabase()` to generate 7 official role-based accounts with hashed passwords:

**Default Password for All Accounts:** `HazTrack@2026!`

| User ID | Role | Full Name | Username / Identifier | Organization |
| :--- | :--- | :--- | :--- | :--- |
| **HZU-001** | `ADMIN` | Harinitha | `harinitha.admin@haztrack.eec.edu` | HazTrack Central Control & Compliance (EEC) |
| **HZU-002** | `LABORATORY` | Rinitha | `rinitha@apexresearch.org` | Apex Chemical R&D Labs |
| **HZU-003** | `INDUSTRY` | Harini | `harini@titanpetro.com` | Titan Petrochemicals Ltd. |
| **HZU-004** | `TRANSPORTER` | Rini | `rini@ecohaul.in` | EcoHaul Hazmat Transport Logistics |
| **HZU-005** | `TRANSPORTER` | Shravan | `shravan@vanguardlogistics.in` | Vanguard Hazmat Fleet Express |
| **HZU-006** | `TREATMENT_FACILITY` | Ravan | `ravan@greensafe.in` | GreenSafe Neutralization & Recovery Plant |
| **HZU-007** | `TREATMENT_FACILITY` | Avan | `avan@bioclean.in` | BioClean High-Temp Incineration Facility |

> **Note:** The login screen provides a 1-click test selector allowing instant pre-filling and testing of each role profile.

---

## 6. Verification & Health Monitoring

After deployment, verify that all services are operational:

1. **Backend Health Check:**
   Visit `https://<YOUR_BACKEND_URL>/api/health`. Expected response:
   ```json
   {
     "status": "OPERATIONAL",
     "system": "HAZTRACK // ENTERPRISE SECURE CHAIN",
     "version": "2.0.0-PROD",
     "department": "Hazardous Waste Management & Tracking System"
   }
   ```
2. **Socket.IO Connection:**
   Open the browser Developer Tools → Console. Check for:
   `[SOCKET] Connected to real-time events engine.`
3. **QR Scanner & Lookups:**
   Log into the Facility Dashboard and open the QR Scanner modal. Test the seeded manifest `SHP-2026-000103` to verify database lookups and role-permitted actions.
4. **Render Free Tier Spin-Down Notice:**
   Render's free tier spins down web services after 15 minutes of inactivity. The first request after sleep may take ~30–50 seconds to wake up the service. Subsequent requests respond instantly.
