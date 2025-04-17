const express = require("express");
const router = express.Router();
const axios = require("axios");

// Configura l'API di Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

/**
 * @route   POST /api/ai/hint
 * @desc    Ottieni un suggerimento dall'AI per una domanda di trivia
 * @access  Public
 */
router.post("/hint", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    
    // Costruisci il prompt per Gemini
    const prompt = `Give a helpful hint (but NOT the exact answer) to the following trivia question: "${question}". 
                   The hint should guide the user towards the correct answer without revealing it directly.
                   The hint should be brief (maximum 2 sentences) and in English.`;
    
    // Chiama l'API di Google Gemini
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100
        }
      }
    );
    
    // Estrai il suggerimento dalla risposta
    const hint = response.data.candidates[0].content.parts[0].text;
    
    // Invia il suggerimento al client
    res.json({ hint });
  } catch (error) {
    console.error("Error during AI request hint:", error.response?.data || error.message);
    res.status(500).json({
      error: "Error during AI request hint",
      details: error.message
    });
  }
});

module.exports = router; 