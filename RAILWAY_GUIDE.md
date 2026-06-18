# 🚀 Railway Deployment Guide

This guide explains how to fix the crashes you encountered and deploy the system successfully to Railway.

## 1. Fix the "JWT_SECRET" Error
The crash occurred because the backend needs a secret key to sign login tokens.

**What to do:**
1. Go to your **Backend Service** in Railway.
2. Go to the **Variables** tab.
3. Add a new variable:
   - **Key:** `JWT_SECRET`
   - **Value:** `(any random long string, e.g., yourname-12345-secret)`
4. Railway will automatically restart the app, and the error will be gone.

---

## 2. Setting Up the Database
Railway provides a MySQL service that we can link to the backend.

1. In your Railway project, click **New** -> **Database** -> **MySQL**.
2. Once created, go to the **Variables** tab of the MySQL service.
3. Copy the **`MYSQL_URL`** (or `DATABASE_URL`).
4. Go back to your **Backend Service** Variables.
5. Add a new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** `(paste the MySQL URL here)`

---

## 3. Connecting Frontend and Backend
The Frontend needs to know where the Backend is living.

1. Go to your **Backend Service** in Railway.
2. Go to **Settings** -> **Public Networking**.
3. Create a Domain (e.g., `leave-api.railway.app`). Copy this URL.
4. Go to your **Frontend Service** Variables.
5. Add a new variable:
   - **Key:** `BACKEND_URL`
   - **Value:** `https://leave-api.railway.app` (The URL you just copied)

---

## 4. Railway Service Settings
Ensure each service looks at the correct folder in your GitHub repo:

### For the Backend Service:
- **Root Directory:** `/backend`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### For the Frontend Service:
- **Root Directory:** `/frontend`
- **Build Command:** `npm run build`
- **Start Command:** `(automatic from Dockerfile)`

---

## Summary of Changes
I have already updated your code to:
- ✅ **Prevent `index.js` missing error**: Fixed the root `package.json`.
- ✅ **Support `DATABASE_URL`**: The backend now automatically detects Railway's MySQL.
- ✅ **Support `BACKEND_URL`**: The frontend now dynamically connects to your backend URL.
- ✅ **Default `JWT_SECRET`**: Added a fallback so it doesn't crash if you forget to set it (though you should still set it for security!).

### Next Step:
**Commit and Push these changes to GitHub now.**
