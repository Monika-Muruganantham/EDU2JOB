# Job Prediction Platform

A full-stack web application that predicts job opportunities based on education and academic information. Features JWT-based authentication, Google OAuth integration, user profile management, and prediction history.

## Features

- 🔐 **JWT-based Authentication**: Secure user registration and login
- 🔑 **Google OAuth**: One-click login with Google account
- 👤 **Profile Management**: Editable user profiles with academic information
- 📊 **Job Prediction**: ML-based job prediction from education data
- 📈 **Prediction History**: Dashboard showing all previous predictions
- 🎨 **Modern UI**: Beautiful and responsive user interface

## Tech Stack

### Frontend
- React 19 with TypeScript
- React Router for navigation
- Google OAuth integration
- Modern CSS with responsive design

### Backend
- Node.js with Express
- JWT authentication
- bcryptjs for password hashing
- Google Auth Library for OAuth
- JSON file-based storage (can be replaced with database)

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id-here
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (or your frontend URL)
6. Add authorized redirect URIs:
   - `http://localhost:5173` (or your frontend URL)
7. Copy the Client ID and add it to both `.env` files

## Project Structure

```
MyProject/
├── server/                 # Backend server
│   ├── server.js          # Express server with API routes
│   ├── package.json       # Backend dependencies
│   └── data.json          # Data storage (auto-created)
├── my-app/                # Frontend React app
│   ├── src/
│   │   ├── auth/         # Authentication context and protected routes
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript type definitions
│   │   ├── api.tsx       # API client
│   │   └── App.tsx       # Main app component
│   └── package.json      # Frontend dependencies
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user (protected)

### Profile
- `PUT /api/auth/profile` - Update user profile (protected)

### Predictions
- `POST /api/predict` - Generate job prediction (protected)
- `GET /api/predictions` - Get prediction history (protected)

## Usage

1. **Register/Login**: Create an account or login with Google
2. **Complete Profile**: Add your academic information (degree, field, GPA, experience, skills)
3. **Get Predictions**: Use the dashboard to predict jobs based on your education
4. **View History**: Check your prediction history in the dashboard

## Notes

- The backend uses JSON file storage for simplicity. For production, consider using a database (MongoDB, PostgreSQL, etc.)
- The job prediction algorithm is rule-based. For production, consider implementing a proper ML model
- JWT tokens expire after 7 days
- Passwords are hashed using bcryptjs

## License

MIT














