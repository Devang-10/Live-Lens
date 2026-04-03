require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Document Schema
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

app.post('/analyze', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content field is required' });
    }

    // Split content into distinct paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim() !== '');
    
    let allAnnotations = [];

    // Analyze each paragraph sequentially to avoid rate limits
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
           config: {
             responseMimeType: "application/json"
           }
         });
         
         const analysisResult = response.text;
         const parsed = JSON.parse(analysisResult);
         
         if (Array.isArray(parsed)) {
           allAnnotations.push(...parsed);
         }
      } catch (err) {
         console.error('Error analyzing paragraph:', err);
      }
    }

    // Save the complete analysis to the database
    const newDocument = new Document({
      title: title || 'Untitled Document',
      content,
      annotations: allAnnotations
    });
    
    await newDocument.save();

    // Return the complete document object as the response
    res.json(newDocument);

  } catch (error) {
    console.error('Server error during analysis:', error);
    res.status(500).json({ error: 'Internal server error while analyzing text' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started running on port ${PORT}`);
});
