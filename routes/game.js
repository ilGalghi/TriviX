const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const userModel = require("../models/userModel");

// In-memory user storage reference
const users = [];

const matchesFilePath = path.join(__dirname, '../data/matches.json');

// Funzione per leggere i dati delle partite dal file JSON
const readMatches = () => {
  try {
    const data = fs.readFileSync(matchesFilePath);
    return JSON.parse(data);
  } catch (error) {
    console.log("errore in lettura file : " + error);
    return [];
  }
};

// Funzione per scrivere i dati delle partite nel file JSON
const writeMatches = (matches) => {
  try {
    fs.writeFileSync(matchesFilePath, JSON.stringify(matches, null, 2));
    console.log("salvo " + JSON.stringify(matches, null, 2));
    return true;
  } catch (error) {
    console.error("Errore durante il salvataggio delle partite:", error);
    return false;
  }
};




// Crea un nuovo gioco
router.post("/create", (req, res) => {
  const { userId, gameCode, maxRounds } = req.body;
  console.log("api trovata. body :" + req.body);

  
  // Validazione input
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }else{
    console.log("user id preso");
  }

  // Imposta il numero di round predefinito se non specificato
  const rounds = maxRounds || 5;

  console.log("codice generato");
  // Trova l'utente
  const user = userModel.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  // Crea una nuova partita
  const newGame = {
    id: uuidv4(),
    matchCode: gameCode,
    status: "waiting",      // stati possibili: "waiting", "active", "completed"
    players: [
    ],
    currentRound: 0,
    maxRounds: rounds,          // Usa il numero di round specificato
    currentTurn: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Leggi le partite esistenti
  const matches = readMatches();
  
  // Aggiungi la nuova partita all'elenco
  matches.push(newGame);

  // Scrivi le partite aggiornate nel file
  writeMatches(matches);

  // Restituisci i dati della nuova partita
  res.status(201).json({
    game: newGame,
  });
  
});

// Join game route
router.post("/join", (req, res) => {
  const { userId, gameCode } = req.body;

  // Validate input
  if (!userId || !gameCode) {
    return res.status(400).json({ error: "User ID and game code are required" });
  }

  // Leggi le partite esistenti
  const matches = readMatches();

  // Find game
  const game = matches.find((game) => game.matchCode === gameCode);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  // Check if game is already full
  if (game.players.length >= 2) {
    return res.status(400).json({ error: "Game is already full" });
  }

  // Check if user is already in the game
  const existingPlayer = game.players.find((player) => player.id === userId);
  if (existingPlayer) {
    return res.status(400).json({ error: "You are already in this game" });
  }

  // Trova l'utente
  const user = users.find((user) => user.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Add player to game
  game.players.push({
    id: userId,
    username: user.username,
    score: 0,
    characters: [],
  });

  // Update game status
  game.status = "active";
  game.updatedAt = new Date();

  // Scrivi le partite aggiornate nel file
  writeMatches(matches);

  // Return game data
  res.json({
    game,
  });
});


// Get game route (già esistente)
router.get("/:gameCode", (req, res) => {
  const { gameCode } = req.params;
  const matches = readMatches();
  const game = matches.find((game) => game.matchCode === gameCode);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }
  res.json({ game });
});

// Update game route (già esistente per l'azione di risposta e rinuncia)
router.put("/:gameCode", (req, res) => {
  const { gameCode } = req.params;
  const { action, userId, data } = req.body;
  const matches = readMatches();
  const game = matches.find((game) => game.matchCode === gameCode);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }


  writeMatches(matches);
  res.json({ game });
});

// Nuova route PUT per aggiornare un match specifico, ad esempio per assegnare giocatori
router.put("/update/:matchCode", (req, res) => {
  const { matchCode } = req.params;
  const { currentUser } = req.body;

  const matches = readMatches();
  const game = matches.find((game) => game.matchCode === matchCode);

  if (!game) {
    return res.status(404).json({ error: "Match not found" });
  }


 const isUserAlreadyInMatch = game.players.some(player => player && player.id === currentUser.id);
console.log("isUserAlreadyInMatch:", isUserAlreadyInMatch);

  // Controlla se Player 1 o Player 2 sono già assegnati
  let playerAssigned = false;
  if(!isUserAlreadyInMatch){
    if (game.players.length == 0) {
      game.players[0] = {
        id: currentUser.id,
        username: currentUser.username,
        score: 0,
        characters: [],
      };
      playerAssigned = true;
    } else if (game.players.length == 1) {
      game.players[1] = {
        id: currentUser.id,
        username: currentUser.username,
        score: 0,
        characters: [],
      };
      playerAssigned = true;
    }
  }

  if (!playerAssigned) {
    return res.status(400).json({ error: "Both players are already assigned." });
  }

  game.updatedAt = new Date();
  writeMatches(matches);

  res.json({ game });
});

// Update score
router.post('/update-score', (req, res) => {
  const { userId, gameCode, isCorrect } = req.body;
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  // Read matches
  const matches = readMatches();
  
  // Find match by game code
  const matchIndex = matches.findIndex(match => match.matchCode === gameCode);
  
  if (matchIndex === -1) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }
  
  const match = matches[matchIndex];
  
  // Find player in match
  const playerIndex = match.players.findIndex(player => player.id === userId);
  
  if (playerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Player not found in match' });
  }
  
  // Update player score if answer was correct
  if (isCorrect) {
    match.players[playerIndex].score += 1;
  }
  
  // Update match
  match.updatedAt = new Date().toISOString();
  matches[matchIndex] = match;
  
  // Write updated matches
  if (writeMatches(matches)) {
    return res.json({ success: true, match });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to update match' });
  }
});

// Switch turn
router.post('/switch-turn', (req, res) => {
  const { userId, gameCode } = req.body;
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing user ID or game code' });
  }
  
  // Read matches
  const matches = readMatches();
  
  // Find match by game code
  const matchIndex = matches.findIndex(match => match.matchCode === gameCode);
  
  if (matchIndex === -1) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }
  
  const match = matches[matchIndex];
  
  // Verify user is in match
  const currentPlayerIndex = match.players.findIndex(player => player.id === userId);
  if (currentPlayerIndex === -1) {
    return res.status(403).json({ success: false, message: 'User not in match' });
  }
  
  // Find opponent
  const opponentIndex = match.players.findIndex(player => player.id !== userId);
  if (opponentIndex === -1) {
    return res.status(400).json({ success: false, message: 'No opponent found' });
  }
  
  const opponent = match.players[opponentIndex];
  
  // Switch turn
  match.currentTurn = opponent.id;
  
  // Increment round if needed (when both players have played)
  
    if (match.currentRound === 0 || (match.players.length === 2 && match.currentTurn === match.players[0].id)) {
      if(match.currentRound + 1 <= match.maxRounds){

        match.currentRound += 1;
      }else{
        match.status = "completed";
        // Ora che la partita è completata, aggiorniamo le statistiche degli utenti
        updateUserStats(match);
       
        // Marca la partita come aggiornata
        match.statsUpdated = true;
      }
    }
  
  
  // Update match
  match.updatedAt = new Date().toISOString();
  matches[matchIndex] = match;
  
  // Write updated matches
  if (writeMatches(matches)) {
    return res.json({ success: true, match });
  } else {
    return res.status(500).json({ success: false, message: 'Failed to update match' });
  }
});


// Get match by code
router.get('/match/:code', (req, res) => {
  const gameCode = req.params.code;
  
  if (!gameCode) {
    return res.status(400).json({ success: false, message: 'Missing game code' });
  }
  
  // Read matches
  const matches = readMatches();
  
  // Find match by game code
  const match = matches.find(match => match.matchCode === gameCode);
  
  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }
  
  // Verifica se la partita è completata ma le statistiche non sono state aggiornate
  if (match.status === "completed" && !match.statsUpdated) {
    // Aggiorna le statistiche
    updateUserStats(match);
    
    // Marca la partita come aggiornata
    match.statsUpdated = true;
    
    // Salva le modifiche
    const matchIndex = matches.findIndex(m => m.matchCode === gameCode);
    matches[matchIndex] = match;
    writeMatches(matches);
  }
  
  return res.json({ success: true, match });
});

// Route per gestire la resa di un giocatore
router.post('/surrender', (req, res) => {
  try {
    const { userId, gameCode } = req.body;
    
    if (!userId || !gameCode) {
      return res.status(400).json({ success: false, message: 'Dati mancanti.' });
    }
    
    // Leggi i match esistenti
    const matchesData = readMatches();
    
    // Trova la partita corrispondente
    const matchIndex = matchesData.findIndex(match => match.matchCode === gameCode);
    
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Partita non trovata.' });
    }
    
    const match = matchesData[matchIndex];
    
    // Trova i giocatori
    const surrenderingPlayer = match.players.find(player => player.id === userId);
    const opponentPlayer = match.players.find(player => player.id !== userId);
    
    if (!surrenderingPlayer || !opponentPlayer) {
      return res.status(404).json({ success: false, message: 'Giocatore non trovato nella partita.' });
    }
    
    // Aggiorna lo stato della partita
    match.status = "completed";
    match.winner = opponentPlayer.id;
    match.surrenderedBy = userId; // Aggiungi un campo per tenere traccia di chi si è arreso
    
    // Aggiorna le statistiche di gioco
    updateUserStats(match);
    match.statsUpdated = true;
    
    // Salva il file aggiornato
    matchesData[matchIndex] = match;
    writeMatches(matchesData);
    
    return res.json({
      success: true,
      message: 'Partita terminata per resa.',
      match: match
    });
  } catch (error) {
    console.error('Errore durante la gestione della resa:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server.' });
  }
});

// Update user stats based on game results
async function updateUserStats(game) {
  if (game.status !== "completed") return;

  const userModel = require('../models/userModel');

  // Determine winner
  let winner = null;
  let isDraw = false;
  
  if (game.players.length === 2) {
    const player1 = game.players[0];
    const player2 = game.players[1];

    if (player1.score > player2.score) {
      winner = player1;
    } else if (player2.score > player1.score) {
      winner = player2;
    } else {
      isDraw = true;
    }
  }

  // Aggiorna le statistiche per ogni giocatore
  for(const player of game.players) {
    try {
      // Recupera le statistiche attuali dell'utente
      const currentUser = await userModel.findUserById(player.id);
      if (!currentUser || !currentUser.profile || !currentUser.profile.stats) {
        console.error(`Statistiche non trovate per l'utente ${player.id}`);
        continue;
      }

      const currentStats = currentUser.profile.stats;
      
      // Prepara i dati per l'aggiornamento
      let pointsToAdd = 0;
      
      // Assegna punti in base all'esito della partita
      if (game.surrenderedBy) {
        // Caso di resa: chi si è arreso prende 0 punti, l'avversario ne prende 30
        if (player.id === game.surrenderedBy) {
          pointsToAdd = 0; // Chi si è arreso prende 0 punti
        } else {
          pointsToAdd = 30; // Chi ha vinto per resa prende 30 punti
        }
      } else {
        // Caso normale senza resa
        if (isDraw) {
          pointsToAdd = 15; // Pareggio
        } else if (winner && winner.id === player.id) {
          pointsToAdd = 30; // Vittoria
        } else {
          pointsToAdd = 0; // Sconfitta
        }
      }
      
      const statsData = {
        gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
        gamesWon: (currentStats.gamesWon || 0) + ((winner && winner.id === player.id) ? 1 : 0),
        correctAnswers: currentStats.correctAnswers || 0,
        points: (currentStats.points || 0) + pointsToAdd
      };
      console.log("aggiorno statistiche per ", player.id, "con dati", statsData);

      // Aggiorna le statistiche dell'utente
      await userModel.updateGameStats(player.id, statsData);
      
      console.log(`Statistiche aggiornate per giocatore ${player.id}:`, statsData);
    } catch (error) {
      console.error(`Errore nell'aggiornamento delle statistiche per il giocatore ${player.id}:`, error);
    }
  }
}

// Generate a random game code
function generateGameCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}


// Route per il cleanup della partita
router.post('/cleanup/:gameCode', async (req, res) => {
  try {
    const { gameCode } = req.params;
    
    // Leggi le partite esistenti
    const matches = readMatches();
    
    // Trova la partita corrispondente
    const matchIndex = matches.findIndex(match => match.matchCode === gameCode);
    
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Partita non trovata' });
    }
    
    const match = matches[matchIndex];
    
    // Se la partita è completata e le statistiche non sono state ancora aggiornate
    if (match.status === "completed" && !match.statsUpdated) {
      // Aggiorna le statistiche degli utenti
      await updateUserStats(match);
      
      // Marca la partita come aggiornata
      match.statsUpdated = true;
      
      // Salva le modifiche
      matches[matchIndex] = match;
      writeMatches(matches);
    }
    
    // Rimuovi la partita dal file
    matches.splice(matchIndex, 1);
    writeMatches(matches);
    
    return res.json({ success: true, message: 'Dati della partita puliti con successo' });
  } catch (error) {
    console.error('Errore durante il cleanup dei dati della partita:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
});

// Route per aggiornare le statistiche dell'utente
router.post('/update-stats', async (req, res) => {
  try {
    const { userId, gameCode } = req.body;

    if (!userId || !gameCode) {
      return res.status(400).json({ success: false, message: 'Dati mancanti' });
    }

    // Leggi le partite esistenti
    const matches = readMatches();
    
    // Trova la partita corrispondente
    const match = matches.find(match => match.matchCode === gameCode);
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Partita non trovata' });
    }

    // Verifica se la partita è completata
    if (match.status !== "completed") {
      return res.status(400).json({ success: false, message: 'La partita non è ancora completata' });
    }

    // Verifica se le statistiche sono già state aggiornate
    if (match.statsUpdated) {
      return res.status(400).json({ success: false, message: 'Le statistiche sono già state aggiornate' });
    }

    // Aggiorna le statistiche degli utenti
    await updateUserStats(match);
    
    // Marca la partita come aggiornata
    match.statsUpdated = true;
    
    // Salva le modifiche
    const matchIndex = matches.findIndex(m => m.matchCode === gameCode);
    matches[matchIndex] = match;
    writeMatches(matches);

    // Recupera l'utente aggiornato per restituirlo al client
    const updatedUser = await userModel.findUserById(userId);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    return res.json({ 
      success: true, 
      message: 'Statistiche aggiornate con successo',
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento delle statistiche:', error);
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
});

// Get matches for a specific user
router.get("/user/:userId", (req, res) => {
  const { userId } = req.params;
  const matches = readMatches();
  const userMatches = matches.filter(match => match.players.some(player => player.id === userId)).map(match => {
    const player = match.players.find(p => p.id === userId);
    const opponent = match.players.find(p => p.id !== userId);
    return {
      status: match.status,
      id: match.id,
      players: match.players,
      currentRound: match.currentRound,
      maxRounds: match.maxRounds,
      updatedAt: match.updatedAt,
      result: player.score > (opponent ? opponent.score : 0) ? "Vinto" : player.score < (opponent ? opponent.score : 0) ? "Perso" : "Pareggio",
      opponent: opponent ? opponent.username : "N/A",
      round: `${match.currentRound}/${match.maxRounds}`,
      correctAnswers: player.score,
      date: new Date(match.updatedAt).toLocaleDateString()
    };
  });

  if (userMatches.length === 0) {
    return res.status(404).json({ success: false, message: "No matches found for this user" });
  }

  res.json({ success: true, games: userMatches });
});

module.exports = router;