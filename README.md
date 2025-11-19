# GeoAttend - Smart Attendance System

A MERN stack application for Wi-Fi based attendance verification.

## Setup & Deployment

### 1. MongoDB Connection
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new Cluster (Free Tier).
3. In "Database Access", create a database user (e.g., `admin`/`password123`).
4. In "Network Access", allow IP `0.0.0.0/0` (for cloud hosting).
5. Get connection string: `mongodb+srv://admin:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority`.

### 2. Deploy to Render (Recommended for MERN)
Render can host both the Node.js API and the React frontend in a single service.

1. Create a new **Web Service** on Render.
2. Connect your repository.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string.

### 3. Deploy to Vercel (Frontend Only)
If you prefer Vercel for the frontend:
1. Deploy the Backend to Render first.
2. In Vercel, import the project.
3. Set Environment Variable `VITE_API_URL` to your Render Backend URL (e.g., `https://geoattend.onrender.com/api`).
4. The API Service must be updated to allow CORS from your Vercel domain.

## Local Development
1. `npm install`
2. Create `.env` file with `MONGODB_URI`.
3. `npm run dev` (Frontend) & `node server.js` (Backend).