const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Path to matches.json
const MATCHES_FILE = path.join(__dirname, '../data/matches.json');

// Funzione per leggere il file matches.json
function readMatchesFile() {
  try {
    const data = fs.readFileSync(MATCHES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading matches.json:', error);
    return { matches: [] };
  }
}

// Funzione per scrivere nel file matches.json
function writeMatchesFile(data) {
  try {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing matches.json:', error);
    return false;
  }
}

// Route per gestire la resa di un giocatore
router.post('/surrender', (req, res) => {
  try {
    const { userId, gameCode } = req.body;
    
    if (!userId || !gameCode) {
      return res.status(400).json({ success: false, message: 'Missing data.' });
    }
    
    // Leggi il file matches.json
    const matchesData = readMatchesFile();
    
    // Trova la partita corrispondente
    const matchIndex = matchesData.matches.findIndex(match => match.matchCode === gameCode);
    
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }
    
    const match = matchesData.matches[matchIndex];
    
    // Trova i giocatori
    const surrenderingPlayer = match.players.find(player => player.id === userId);
    const opponentPlayer = match.players.find(player => player.id !== userId);
    
    if (!surrenderingPlayer || !opponentPlayer) {
      return res.status(404).json({ success: false, message: 'Player not found in the match.' });
    }
    
    // Aggiorna lo stato della partita
    match.status = "completed";
    match.winner = opponentPlayer.id;
    match.surrenderedBy = userId; // Aggiungi un campo per tenere traccia di chi si è arreso
    
    // Salva il file aggiornato
    writeMatchesFile(matchesData);
    
    return res.json({
      success: true,
      message: 'Match ended by surrender.',
      match: match
    });
  } catch (error) {
    console.error('Error during surrender handling:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router; 