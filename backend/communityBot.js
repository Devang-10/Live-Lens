const { GoogleGenAI } = require('@google/genai');

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generates a helpful and polite fact-checking reply for a community post.
 * 
 * @param {string} postText - The text of the user's community post
 * @returns {Promise<string|null>} The bot's conversational reply or null if an error occurs.
 */
async function generateFactBotReply(postText) {
  if (!postText) return null;

  const prompt = `You are the LiveLens Community Bot, a helpful and polite automated fact-checker. Read the following user post. If it contains a verifiable factual claim, reply with a short, friendly comment (2-3 sentences max) confirming or correcting the claim. If it is purely an opinion or a question, reply that you are unable to verify opinions. Do not use JSON, just return plain conversational text.

User Post:
"${postText}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error('Error in generateFactBotReply:', error);
    return null;
  }
}

module.exports = { generateFactBotReply };
