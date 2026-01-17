# Quick Setup Guide

## Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 2: Install Frontend Dependencies

```bash
cd ../my-app
npm install
```

## Step 3: Configure Environment Variables

### Backend (.env file in server/ directory)
Create `server/.env`:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id-here
```

### Frontend (.env file in my-app/ directory)
Create `my-app/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Step 4: Start the Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

## Step 5: Start the Frontend

In a new terminal:
```bash
cd my-app
npm run dev
```

The frontend will run on `http://localhost:5173`

## Google OAuth Setup (Optional but Recommended)

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized JavaScript origins: `http://localhost:5173`
7. Authorized redirect URIs: `http://localhost:5173`
8. Copy the Client ID and add it to both `.env` files

## That's it!

Open your browser and navigate to `http://localhost:5173` to start using the application.














