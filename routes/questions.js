const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Route per ottenere una domanda in base alla categoria
router.post("/:category", (req, res) => {
  try {
    const category = req.params.category;
    const usedIndices = req.body.usedIndices || [];
    
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
      // Ottieni tutti gli indici disponibili per questa categoria
      const questions = qaData[category];
      const allIndices = Array.from(Array(questions.length).keys());
      
      // Filtra gli indici non ancora usati
      const availableIndices = allIndices.filter(index => !usedIndices.includes(index));
      
      // Se non ci sono più indici disponibili, resetta usando tutti gli indici
      if (availableIndices.length === 0) {
        console.log("Tutte le domande sono state usate, reset degli indici, categoria:", category);
        const randomIndex = Math.floor(Math.random() * questions.length);
        return res.json({
          question: questions[randomIndex],
          index: randomIndex
        });
      }
      
      // Seleziona un indice casuale tra quelli disponibili
      const randomAvailableIndex = Math.floor(Math.random() * availableIndices.length);
      const selectedIndex = availableIndices[randomAvailableIndex];
      
      res.json({
        question: questions[selectedIndex],
        index: selectedIndex
      });
    } else {
      // Restituisci la domanda (vecchio formato) con indice 0
      res.json({
        question: qaData[category],
        index: 0
      });
    }
  } catch (error) {
    console.error("Errore nel recupero della domanda:", error);
    res.status(500).json({ error: "Errore nel recupero della domanda" });
  }
});

module.exports = router; 