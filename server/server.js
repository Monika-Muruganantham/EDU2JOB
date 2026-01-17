import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

app.use(cors());
app.use(express.json());

const DATA_FILE = join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ users: [], predictions: [] }, null, 2));
}

function readData() {
  try {
    const data = readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], predictions: [] };
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Job prediction function (simplified ML model)
function predictJob(education) {
  const { degree, field, gpa, experience, skills } = education;
  
  // Simple rule-based prediction (can be replaced with actual ML model)
  const predictions = {
    'Software Engineer': 0,
    'Data Scientist': 0,
    'Product Manager': 0,
    'Business Analyst': 0,
    'Marketing Manager': 0,
    'Financial Analyst': 0,
    'Research Scientist': 0,
    'Consultant': 0
  };

  // Score based on field
  if (field?.toLowerCase().includes('computer') || field?.toLowerCase().includes('software')) {
    predictions['Software Engineer'] += 30;
    predictions['Data Scientist'] += 20;
  }
  if (field?.toLowerCase().includes('data') || field?.toLowerCase().includes('statistics')) {
    predictions['Data Scientist'] += 30;
    predictions['Business Analyst'] += 20;
  }
  if (field?.toLowerCase().includes('business') || field?.toLowerCase().includes('management')) {
    predictions['Product Manager'] += 30;
    predictions['Business Analyst'] += 20;
    predictions['Consultant'] += 20;
  }
  if (field?.toLowerCase().includes('marketing')) {
    predictions['Marketing Manager'] += 40;
  }
  if (field?.toLowerCase().includes('finance') || field?.toLowerCase().includes('economics')) {
    predictions['Financial Analyst'] += 40;
  }
  if (field?.toLowerCase().includes('science') || field?.toLowerCase().includes('research')) {
    predictions['Research Scientist'] += 30;
  }

  // Score based on degree level
  if (degree === 'PhD') {
    predictions['Research Scientist'] += 20;
    predictions['Data Scientist'] += 15;
  } else if (degree === 'Master') {
    Object.keys(predictions).forEach(job => predictions[job] += 10);
  }

  // Score based on GPA
  if (gpa >= 3.5) {
    Object.keys(predictions).forEach(job => predictions[job] += 15);
  } else if (gpa >= 3.0) {
    Object.keys(predictions).forEach(job => predictions[job] += 10);
  }

  // Score based on experience
  if (experience > 2) {
    Object.keys(predictions).forEach(job => predictions[job] += 10);
  }

  // Score based on skills
  if (skills) {
    const skillList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    skillList.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      if (lowerSkill.includes('programming') || lowerSkill.includes('coding')) {
        predictions['Software Engineer'] += 10;
        predictions['Data Scientist'] += 5;
      }
      if (lowerSkill.includes('data') || lowerSkill.includes('analytics')) {
        predictions['Data Scientist'] += 10;
        predictions['Business Analyst'] += 5;
      }
      if (lowerSkill.includes('leadership') || lowerSkill.includes('management')) {
        predictions['Product Manager'] += 10;
        predictions['Consultant'] += 5;
      }
    });
  }

  // Get top 3 predictions
  const sorted = Object.entries(predictions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([job, score]) => ({ job, confidence: Math.min(100, score) }));

  return {
    primary: sorted[0],
    alternatives: sorted.slice(1)
  };
}

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const data = readData();
    const existingUser = data.users.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(),
      email,
      name,
      password: hashedPassword,
      profile: {
        degree: '',
        field: '',
        gpa: 0,
        experience: 0,
        skills: []
      },
      createdAt: new Date().toISOString()
    };

    data.users.push(user);
    writeData(data);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = readData();
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    
    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    const data = readData();
    let user = data.users.find(u => u.email === email);

    if (!user) {
      user = {
        id: Date.now().toString(),
        email,
        name,
        picture,
        password: null, // OAuth users don't have passwords
        profile: {
          degree: '',
          field: '',
          gpa: 0,
          experience: 0,
          skills: []
        },
        createdAt: new Date().toISOString()
      };
      data.users.push(user);
      writeData(data);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    profile: user.profile
  });
});

// Update profile
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { profile } = req.body;
    const data = readData();
    const userIndex = data.users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    data.users[userIndex].profile = {
      ...data.users[userIndex].profile,
      ...profile
    };
    writeData(data);

    res.json({
      id: data.users[userIndex].id,
      email: data.users[userIndex].email,
      name: data.users[userIndex].name,
      profile: data.users[userIndex].profile
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Predict job
app.post('/api/predict', authenticateToken, (req, res) => {
  try {
    const education = req.body;
    const prediction = predictJob(education);
    
    const data = readData();
    const predictionRecord = {
      id: Date.now().toString(),
      userId: req.user.id,
      education,
      prediction,
      createdAt: new Date().toISOString()
    };
    
    data.predictions.push(predictionRecord);
    writeData(data);

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get prediction history
app.get('/api/predictions', authenticateToken, (req, res) => {
  const data = readData();
  const userPredictions = data.predictions
    .filter(p => p.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(userPredictions);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});














