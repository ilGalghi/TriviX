const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Route per ottenere una domanda in base alla categoria
router.get("/:category", (req, res) => {
  try {
    const category = req.params.category;
    
    // Percorso al file QA.json (fuori dalla cartella public)
    const qaFilePath = path.join(__dirname, "..", "QA.json");
    
    // Leggi il file JSON
    const qaData = JSON.parse(fs.readFileSync(qaFilePath, "utf8"));
    
    // Verifica se la categoria esiste
    if (!qaData[category]) {
      return res.status(404).json({ error: "Categoria non trovata" });
    }
    
    // Controlla se la categoria è un array (nuova struttura) o un oggetto (singola domanda)
    if (Array.isArray(qaData[category])) {
      // Seleziona una domanda casuale dall'array
      const questions = qaData[category];
      const randomIndex = Math.floor(Math.random() * questions.length);
      const question = questions[randomIndex];
      
      res.json(question);
    } else {
      // Restituisci la domanda (vecchio formato)
      res.json(qaData[category]);
    }
  } catch (error) {
    console.error("Errore nel recupero della domanda:", error);
    res.status(500).json({ error: "Errore nel recupero della domanda" });
  }
});

module.exports = router; 