require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'live_lens_super_secret_key_2026';

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ----------------------------------------------------
// Database Schemas
// ----------------------------------------------------

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  annotations: [{
    claim: String,
    correction: String,
    confidence: Number
  }]
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);

// ----------------------------------------------------
// Authentication Middleware
// ----------------------------------------------------

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// ----------------------------------------------------
// Routes
// ----------------------------------------------------

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// User Login
app.post('/api/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error during signin' });
  }
});

// Existing Workplace Scan (No Auth Required)
app.post('/analyze', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content field is required' });
    }

    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim() !== '');
    let allAnnotations = [];

    for (const paragraph of paragraphs) {
      const prompt = `System Instructions: You are a strict factual claim extraction and correction assistant.
Extract factual claims from the following text and return a JSON array of objects.
Each object MUST have exactly these keys: "claim" (the false or misleading statement found), "correction" (the factual truth), and "confidence" (a number between 0 and 1).
If there are no false claims, return an empty array [].

Text:
"${paragraph}"`;

      try {
         const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: prompt,
           config: { responseMimeType: "application/json" }
         });
         
         const parsed = JSON.parse(response.text);
         if (Array.isArray(parsed)) allAnnotations.push(...parsed);
      } catch (err) {
         console.error('Error analyzing paragraph:', err);
      }
    }

    const newDocument = new Document({ title: title || 'Untitled Document', content, annotations: allAnnotations });
    await newDocument.save();

    try {
      await fetch('http://127.0.0.1:3000/v1/database/live-lens-db/call/broadcast_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          article_text: content, 
          annotations_json: JSON.stringify(allAnnotations) 
        })
      });
    } catch (dbErr) {
      console.error('Error calling SpacetimeDB:', dbErr);
    }

    res.json(newDocument);
  } catch (error) {
    console.error('Server error during analysis:', error);
    res.status(500).json({ error: 'Internal server error while analyzing text' });
  }
});

// Community Post Submission (Auth Required)
app.post('/api/community/post', authenticateToken, async (req, res) => {
  try {
    const { article_text } = req.body;
    const author_username = req.user.username;

    if (!article_text) return res.status(400).json({ error: 'article_text is required' });

    const paragraphs = article_text.split(/\n\s*\n/).filter(p => p.trim() !== '');
    let allAnnotations = [];

    // Analyze text with AI
    for (const paragraph of paragraphs) {
      const prompt = `System Instructions: You are a strict factual claim extraction and correction assistant.
Extract factual claims from the following text and return a JSON array of objects.
Each object MUST have exactly these keys: "claim" (the false or misleading statement found), "correction" (the factual truth), and "confidence" (a number between 0 and 1).
If there are no false claims, return an empty array [].

Text:
"${paragraph}"`;

      try {
         const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: prompt,
           config: { responseMimeType: "application/json" }
         });
         
         const parsed = JSON.parse(response.text);
         if (Array.isArray(parsed)) allAnnotations.push(...parsed);
      } catch (err) {
         console.error('Error analyzing paragraph:', err);
      }
    }

    res.status(200).json({ annotations: allAnnotations });
  } catch (error) {
    console.error('Server error during post submission:', error);
    res.status(500).json({ error: 'Internal server error while submitting post' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started running on port ${PORT}`);
});
