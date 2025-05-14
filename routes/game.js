const express = require("express"); // Importa il modulo express per creare l'applicazione web
const router = express.Router(); // Crea un router per gestire le rotte
const { v4: uuidv4 } = require("uuid"); // Importa la funzione per generare UUID
const fs = require("fs"); // Importa il modulo fs per gestire il file system
const path = require("path"); // Importa il modulo path per gestire i percorsi dei file
const userModel = require("../models/userModel"); // Importa il modello utente

// Riferimento per la memorizzazione degli utenti in memoria
const users = [];

// Percorso del file JSON per le partite
const matchesFilePath = path.join(__dirname, '../data/matches.json');

// Funzione per leggere i dati delle partite dal file JSON
const readMatches = () => {
  try {
    const data = fs.readFileSync(matchesFilePath); // Legge il file delle partite
    return JSON.parse(data); // Restituisce i dati come oggetto JavaScript
  } catch (error) {
    console.log("errore in lettura file : " + error); // Gestisce eventuali errori di lettura
    return []; // Restituisce un array vuoto in caso di errore
  }
};

// Funzione per scrivere i dati delle partite nel file JSON
const writeMatches = (matches) => {
  try {
    fs.writeFileSync(matchesFilePath, JSON.stringify(matches, null, 2)); // Scrive i dati nel file
    console.log("salvo " + JSON.stringify(matches, null, 2)); // Log dei dati salvati
    return true; // Restituisce true se il salvataggio ha successo
  } catch (error) {
    console.error("Errore durante il salvataggio delle partite:", error); // Gestisce eventuali errori di scrittura
    return false; // Restituisce false in caso di errore
  }
};

// Crea un nuovo gioco
router.post("/create", (req, res) => {
  const { userId, gameCode, maxRounds } = req.body; // Estrae i dati dal corpo della richiesta
  console.log("api trovata. body :" + req.body); // Log dei dati ricevuti

  // Validazione input
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" }); // Restituisce errore se manca l'ID utente
  } else {
    console.log("user id preso"); // Log dell'ID utente ricevuto
  }

  // Imposta il numero di round predefinito se non specificato
  const rounds = maxRounds || 5; // Usa il numero di round specificato o 5 come default

  console.log("codice generato"); // Log per indicare che il codice è stato generato
  // Trova l'utente
  const user = userModel.findUserById(userId); // Cerca l'utente nel modello
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }
  // Crea una nuova partita
  const newGame = {
    id: uuidv4(), // Genera un ID unico per la partita
    matchCode: gameCode, // Codice della partita
    status: "waiting", // Stato iniziale della partita
    players: [], // Array per i giocatori
    currentRound: 0, // Round attuale
    maxRounds: rounds, // Numero massimo di round
    currentTurn: userId, // ID dell'utente il cui turno è attuale
    createdAt: new Date(), // Data di creazione della partita
    updatedAt: new Date(), // Data di aggiornamento della partita
  };

  // Leggi le partite esistenti
  const matches = readMatches(); // Legge le partite dal file

  // Aggiungi la nuova partita all'elenco
  matches.push(newGame); // Aggiunge la nuova partita all'array delle partite

  // Scrivi le partite aggiornate nel file
  writeMatches(matches); // Salva le partite aggiornate nel file

  // Restituisci i dati della nuova partita
  res.status(201).json({
    game: newGame, // Restituisce la nuova partita creata
  });
});

// Join game route
router.post("/join", (req, res) => {
  const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta

  // Validazione input
  if (!userId || !gameCode) {
    return res.status(400).json({ error: "User ID and game code are required" }); // Restituisce errore se mancano dati
  }

  // Verifica che l'utente sia autenticato
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "Unauthorized",
      redirect: true,
      message: "Per favore effettua il login per unirti alla partita" // Messaggio di errore per accesso non autorizzato
    });
  }

  // Leggi le partite esistenti
  const matches = readMatches(); // Legge le partite dal file

  // Trova la partita
  const game = matches.find((game) => game.matchCode === gameCode); // Cerca la partita per codice
  if (!game) {
    return res.status(404).json({ error: "Game not found" }); // Restituisce errore se la partita non esiste
  }

  // Controlla se la partita è già piena
  if (game.players.length >= 2) {
    return res.status(400).json({ error: "Game is already full" }); // Restituisce errore se la partita è piena
  }

  // Controlla se l'utente è già nella partita
  const existingPlayer = game.players.find((player) => player.id === userId); // Cerca l'utente tra i giocatori
  if (existingPlayer) {
    return res.status(400).json({ error: "You are already in this game" }); // Restituisce errore se l'utente è già presente
  }

  // Trova l'utente
  const user = users.find((user) => user.id === userId); // Cerca l'utente in memoria
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }

  // Aggiungi il giocatore alla partita
  game.players.push({
    id: userId, // ID del giocatore
    username: user.username, // Nome utente del giocatore
    score: 0, // Punteggio iniziale
    characters: [], // Array per i personaggi del giocatore
  });

  // Aggiorna lo stato della partita
  game.status = "active"; // Imposta lo stato della partita come attivo
  game.updatedAt = new Date(); // Aggiorna la data di modifica

  // Scrivi le partite aggiornate nel file
  writeMatches(matches); // Salva le partite aggiornate nel file

  // Restituisci i dati della partita
  res.json({
    game, // Restituisce la partita aggiornata
  });
});

// Get game route
router.get("/:gameCode", (req, res) => {
  const { gameCode } = req.params; // Estrae il codice della partita dai parametri
  const matches = readMatches(); // Legge le partite dal file
  const game = matches.find((game) => game.matchCode === gameCode); // Cerca la partita per codice
  
  if (!game) {
    return res.status(404).json({ error: "Game not found" }); // Restituisce errore se la partita non esiste
  }

  // Se l'utente non è autenticato, restituisci un errore specifico
  if (!req.session.user) {
    return res.status(401).json({ 
      error: "Unauthorized",
      redirect: true,
      message: "Per favore effettua il login per accedere alla partita" // Messaggio di errore per accesso non autorizzato
    });
  }

  res.json({ game }); // Restituisce i dati della partita
});

// Update game route (già esistente per l'azione di risposta e rinuncia)
router.put("/:gameCode", (req, res) => {
  const { gameCode } = req.params; // Estrae il codice della partita dai parametri
  const { action, userId, data } = req.body; // Estrae i dati dal corpo della richiesta
  const matches = readMatches(); // Legge le partite dal file
  const game = matches.find((game) => game.matchCode === gameCode); // Cerca la partita per codice
  if (!game) {
    return res.status(404).json({ error: "Game not found" }); // Restituisce errore se la partita non esiste
  }

  writeMatches(matches); // Salva le partite aggiornate nel file
  res.json({ game }); // Restituisce i dati della partita
});

// Nuova route PUT per aggiornare un match specifico, ad esempio per assegnare giocatori
router.put("/update/:matchCode", (req, res) => {
  const { matchCode } = req.params; // Estrae il codice della partita dai parametri
  const { currentUser } = req.body; // Estrae l'utente corrente dal corpo della richiesta

  const matches = readMatches(); // Legge le partite dal file
  const game = matches.find((game) => game.matchCode === matchCode); // Cerca la partita per codice

  if (!game) {
    return res.status(404).json({ error: "Match not found" }); // Restituisce errore se la partita non esiste
  }

  const isUserAlreadyInMatch = game.players.some(player => player && player.id === currentUser.id); // Controlla se l'utente è già nella partita
  console.log("isUserAlreadyInMatch:", isUserAlreadyInMatch); // Log per il controllo

  // Controlla se Player 1 o Player 2 sono già assegnati
  let playerAssigned = false; // Flag per verificare se un giocatore è stato assegnato
  if (!isUserAlreadyInMatch) {
    if (game.players.length == 0) {
      game.players[0] = { // Assegna il primo giocatore
        id: currentUser.id,
        username: currentUser.username,
        score: 0,
        characters: [],
      };
      playerAssigned = true; // Imposta il flag a true
    } else if (game.players.length == 1) {
      game.players[1] = { // Assegna il secondo giocatore
        id: currentUser.id,
        username: currentUser.username,
        score: 0,
        characters: [],
      };
      playerAssigned = true; // Imposta il flag a true
    }
  }

  if (!playerAssigned) {
    return res.status(400).json({ error: "Both players are already assigned." }); // Restituisce errore se entrambi i giocatori sono già assegnati
  }

  game.updatedAt = new Date(); // Aggiorna la data di modifica
  writeMatches(matches); // Salva le partite aggiornate nel file

  res.json({ game }); // Restituisce i dati della partita
});

// Update score
router.post('/update-score', (req, res) => {
  const { userId, gameCode, isCorrect } = req.body; // Estrae i dati dal corpo della richiesta
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' }); // Restituisce errore se mancano dati
  }
  
  // Leggi le partite
  const matches = readMatches(); // Legge le partite dal file
  
  // Trova la partita per codice
  const matchIndex = matches.findIndex(match => match.matchCode === gameCode); // Cerca la partita per codice
  
  if (matchIndex === -1) {
    return res.status(404).json({ success: false, message: 'Match not found' }); // Restituisce errore se la partita non esiste
  }
  
  const match = matches[matchIndex]; // Ottiene la partita trovata
  
  // Trova il giocatore nella partita
  const playerIndex = match.players.findIndex(player => player.id === userId); // Cerca il giocatore per ID
  
  if (playerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Player not found in match' }); // Restituisce errore se il giocatore non esiste
  }
  
  // Aggiorna il punteggio del giocatore se la risposta è corretta
  if (isCorrect) {
    match.players[playerIndex].score += 1; // Incrementa il punteggio del giocatore
  }
  
  // Aggiorna la partita
  match.updatedAt = new Date().toISOString(); // Aggiorna la data di modifica
  matches[matchIndex] = match; // Aggiorna la partita nell'array
  
  // Scrivi le partite aggiornate
  if (writeMatches(matches)) {
    return res.json({ success: true, match }); // Restituisce successo e i dati della partita
  } else {
    return res.status(500).json({ success: false, message: 'Failed to update match' }); // Restituisce errore se il salvataggio fallisce
  }
});

// Switch turn
router.post('/switch-turn', (req, res) => {
  const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing user ID or game code' }); // Restituisce errore se mancano dati
  }
  
  // Leggi le partite
  const matches = readMatches(); // Legge le partite dal file
  
  // Trova la partita per codice
  const matchIndex = matches.findIndex(match => match.matchCode === gameCode); // Cerca la partita per codice
  
  if (matchIndex === -1) {
    return res.status(404).json({ success: false, message: 'Match not found' }); // Restituisce errore se la partita non esiste
  }
  
  const match = matches[matchIndex]; // Ottiene la partita trovata
  
  // Verifica che l'utente sia nella partita
  const currentPlayerIndex = match.players.findIndex(player => player.id === userId); // Cerca il giocatore per ID
  if (currentPlayerIndex === -1) {
    return res.status(403).json({ success: false, message: 'User not in match' }); // Restituisce errore se l'utente non è nella partita
  }
  
  // Trova l'avversario
  const opponentIndex = match.players.findIndex(player => player.id !== userId); // Cerca l'avversario
  if (opponentIndex === -1) {
    return res.status(400).json({ success: false, message: 'No opponent found' }); // Restituisce errore se non c'è avversario
  }
  
  const opponent = match.players[opponentIndex]; // Ottiene l'avversario
  
  // Cambia turno
  match.currentTurn = opponent.id; // Imposta il turno dell'avversario
  
  // Incrementa il round se necessario (quando entrambi i giocatori hanno giocato)
  if (match.currentRound === 0 || (match.players.length === 2 && match.currentTurn === match.players[0].id)) {
    if (match.currentRound + 1 <= match.maxRounds) {
      match.currentRound += 1; // Incrementa il round
    } else {
      match.status = "completed"; // Imposta lo stato della partita come completata
      // Ora che la partita è completata, aggiorniamo le statistiche degli utenti
      updateUserStats(match); // Aggiorna le statistiche degli utenti
      
      // Marca la partita come aggiornata
      match.statsUpdated = true; // Imposta il flag per le statistiche aggiornate
    }
  }
  
  // Aggiorna la partita
  match.updatedAt = new Date().toISOString(); // Aggiorna la data di modifica
  matches[matchIndex] = match; // Aggiorna la partita nell'array
  
  // Scrivi le partite aggiornate
  if (writeMatches(matches)) {
    return res.json({ success: true, match }); // Restituisce successo e i dati della partita
  } else {
    return res.status(500).json({ success: false, message: 'Failed to update match' }); // Restituisce errore se il salvataggio fallisce
  }
});

// Get match by code
router.get('/match/:code', (req, res) => {
  const gameCode = req.params.code; // Estrae il codice della partita dai parametri
  
  if (!gameCode) {
    return res.status(400).json({ success: false, message: 'Missing game code' }); // Restituisce errore se manca il codice
  }
  
  // Leggi le partite
  const matches = readMatches(); // Legge le partite dal file
  
  // Trova la partita per codice
  const match = matches.find(match => match.matchCode === gameCode); // Cerca la partita per codice
  
  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found' }); // Restituisce errore se la partita non esiste
  }
  
  // Verifica se la partita è completata ma le statistiche non sono state aggiornate
  if (match.status === "completed" && !match.statsUpdated) {
    // Aggiorna le statistiche
    updateUserStats(match); // Aggiorna le statistiche degli utenti
    
    // Marca la partita come aggiornata
    match.statsUpdated = true; // Imposta il flag per le statistiche aggiornate
    
    // Salva le modifiche
    const matchIndex = matches.findIndex(m => m.matchCode === gameCode); // Trova l'indice della partita
    matches[matchIndex] = match; // Aggiorna la partita nell'array
    writeMatches(matches); // Salva le partite aggiornate nel file
  }
  
  return res.json({ success: true, match }); // Restituisce successo e i dati della partita
});

// Route per gestire la resa di un giocatore
router.post('/surrender', (req, res) => {
  try {
    const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta
    
    if (!userId || !gameCode) {
      return res.status(400).json({ success: false, message: 'Dati mancanti.' }); // Restituisce errore se mancano dati
    }
    
    // Leggi i match esistenti
    const matchesData = readMatches(); // Legge le partite dal file
    
    // Trova la partita corrispondente
    const matchIndex = matchesData.findIndex(match => match.matchCode === gameCode); // Cerca la partita per codice
    
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Match not found.' }); // Restituisce errore se la partita non esiste
    }
    
    const match = matchesData[matchIndex]; // Ottiene la partita trovata
    
    // Trova i giocatori
    const surrenderingPlayer = match.players.find(player => player.id === userId); // Cerca il giocatore che si arrende
    const opponentPlayer = match.players.find(player => player.id !== userId); // Cerca l'avversario
    
    if (!surrenderingPlayer || !opponentPlayer) {
      return res.status(404).json({ success: false, message: 'Player not found in the match.' }); // Restituisce errore se i giocatori non esistono
    }
    
    // Aggiorna lo stato della partita
    match.status = "completed"; // Imposta lo stato della partita come completata
    match.winner = opponentPlayer.id; // Imposta il vincitore
    match.surrenderedBy = userId; // Aggiungi un campo per tenere traccia di chi si è arreso
    match.players.forEach(player => {
      if (player.id == userId) {
        player.score = 0; // Imposta il punteggio a 0 per il giocatore che si è arreso
      } else {
        player.score = 3; // Imposta il punteggio a 3 per l'avversario
      }
    });
    // Aggiorna le statistiche di gioco
    updateUserStats(match); // Aggiorna le statistiche degli utenti
    match.statsUpdated = true; // Imposta il flag per le statistiche aggiornate
    
    // Salva il file aggiornato
    matchesData[matchIndex] = match; // Aggiorna la partita nell'array
    writeMatches(matchesData); // Salva le partite aggiornate nel file
    
    return res.json({
      success: true,
      message: 'Match ended by surrender.', // Messaggio di successo
      match: match // Restituisce i dati della partita
    });
  } catch (error) {
    console.error('Error during surrender handling:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Server error.' }); // Restituisce errore interno del server
  }
});

// Update user stats based on game results
async function updateUserStats(game) {
  if (game.status !== "completed") return; // Esce se la partita non è completata

  const userModel = require('../models/userModel'); // Importa il modello utente

  // Determina il vincitore
  let winner = null; // Variabile per il vincitore
  let isDraw = false; // Variabile per il pareggio
  
  if (game.players.length === 2) {
    const player1 = game.players[0]; // Primo giocatore
    const player2 = game.players[1]; // Secondo giocatore

    if (player1.score > player2.score) {
      winner = player1; // Imposta il vincitore
    } else if (player2.score > player1.score) {
      winner = player2; // Imposta il vincitore
    } else {
      isDraw = true; // Imposta il flag per il pareggio
    }
  }

  // Aggiorna le statistiche per ogni giocatore
  for (const player of game.players) {
    try {
      // Recupera le statistiche attuali dell'utente
      const currentUser = await userModel.findUserById(player.id); // Cerca l'utente nel modello
      if (!currentUser || !currentUser.profile || !currentUser.profile.stats) {
        console.error(`Statistiche non trovate per l'utente ${player.id}`); // Log se le statistiche non sono trovate
        continue; // Salta al prossimo giocatore
      }

      const currentStats = currentUser.profile.stats; // Ottiene le statistiche correnti
      
      // Prepara i dati per l'aggiornamento
      let pointsToAdd = 0; // Punti da aggiungere
      
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
        gamesPlayed: (currentStats.gamesPlayed || 0) + 1, // Incrementa il numero di partite giocate
        gamesWon: (currentStats.gamesWon || 0) + ((winner && winner.id === player.id) ? 1 : 0), // Incrementa le vittorie
        correctAnswers: currentStats.correctAnswers || 0, // Mantiene il numero di risposte corrette
        points: (currentStats.points || 0) + pointsToAdd // Aggiorna i punti
      };
      console.log("aggiorno statistiche per ", player.id, "con dati", statsData); // Log per l'aggiornamento delle statistiche

      // Aggiorna le statistiche dell'utente
      await userModel.updateGameStats(player.id, statsData); // Aggiorna le statistiche nel modello
      
      console.log(`Statistiche aggiornate per giocatore ${player.id}:`, statsData); // Log delle statistiche aggiornate
    } catch (error) {
      console.error(`Errore nell'aggiornamento delle statistiche per il giocatore ${player.id}:`, error); // Log degli errori
    }
  }
}

// Generate a random game code
function generateGameCode() {
  // Genera un codice partita alfanumerico di 6 caratteri
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // Restituisce un codice casuale
}

// Route per il cleanup della partita
router.post('/cleanup/:gameCode', async (req, res) => {
  try {
    const { gameCode } = req.params; // Estrae il codice della partita dai parametri
    
    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Trova la partita corrispondente
    const matchIndex = matches.findIndex(match => match.matchCode === gameCode); // Cerca la partita per codice
    
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Partita non trovata' }); // Restituisce errore se la partita non esiste
    }
    
    const match = matches[matchIndex]; // Ottiene la partita trovata
    
    // Se la partita è completata e le statistiche non sono state ancora aggiornate
    if (match.status === "completed" && !match.statsUpdated) {
      // Aggiorna le statistiche degli utenti
      await updateUserStats(match); // Aggiorna le statistiche degli utenti
      
      // Marca la partita come aggiornata
      match.statsUpdated = true; // Imposta il flag per le statistiche aggiornate
      
      // Salva le modifiche
      matches[matchIndex] = match; // Aggiorna la partita nell'array
      writeMatches(matches); // Salva le partite aggiornate nel file
    }
    
    // Rimuovi la partita dal file
    matches.splice(matchIndex, 1); // Rimuove la partita dall'array
    writeMatches(matches); // Salva le partite aggiornate nel file
    
    return res.json({ success: true, message: 'Dati della partita puliti con successo' }); // Restituisce successo
  } catch (error) {
    console.error('Errore durante il cleanup dei dati della partita:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Errore interno del server' }); // Restituisce errore interno del server
  }
});

// Route per aggiornare le statistiche dell'utente
router.post('/update-stats', async (req, res) => {
  try {
    const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta

    if (!userId || !gameCode) {
      return res.status(400).json({ success: false, message: 'Dati mancanti' }); // Restituisce errore se mancano dati
    }

    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Trova la partita corrispondente
    const match = matches.find(match => match.matchCode === gameCode); // Cerca la partita per codice
    
    if (!match) {
      return res.status(404).json({ success: false, message: 'Partita non trovata' }); // Restituisce errore se la partita non esiste
    }

    // Verifica se la partita è completata
    if (match.status !== "completed") {
      return res.status(400).json({ success: false, message: 'La partita non è ancora completata' }); // Restituisce errore se la partita non è completata
    }

    // Verifica se le statistiche sono già state aggiornate
    if (match.statsUpdated) {
      return res.status(400).json({ success: false, message: 'Le statistiche sono già state aggiornate' }); // Restituisce errore se le statistiche sono già aggiornate
    }

    // Aggiorna le statistiche degli utenti
    await updateUserStats(match); // Aggiorna le statistiche degli utenti
    
    // Marca la partita come aggiornata
    match.statsUpdated = true; // Imposta il flag per le statistiche aggiornate
    
    // Salva le modifiche
    const matchIndex = matches.findIndex(m => m.matchCode === gameCode); // Trova l'indice della partita
    matches[matchIndex] = match; // Aggiorna la partita nell'array
    writeMatches(matches); // Salva le partite aggiornate nel file

    // Recupera l'utente aggiornato per restituirlo al client
    const updatedUser = await userModel.findUserById(userId); // Cerca l'utente nel modello
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' }); // Restituisce errore se l'utente non esiste
    }

    return res.json({ 
      success: true, 
      message: 'Statistiche aggiornate con successo', // Messaggio di successo
      user: updatedUser // Restituisce l'utente aggiornato
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento delle statistiche:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Errore interno del server' }); // Restituisce errore interno del server
  }
});

// Get matches for a specific user
router.get("/user/:userId", (req, res) => {
  const { userId } = req.params; // Estrae l'ID dell'utente dai parametri
  const matches = readMatches(); // Legge le partite dal file
  const userMatches = matches.filter(match => match.players.some(player => player.id === userId)).map(match => { // Filtra le partite per l'utente
    const player = match.players.find(p => p.id === userId); // Trova il giocatore
    const opponent = match.players.find(p => p.id !== userId); // Trova l'avversario
    return {
      status: match.status, // Stato della partita
      id: match.id, // ID della partita
      players: match.players, // Giocatori della partita
      currentRound: match.currentRound, // Round attuale
      maxRounds: match.maxRounds, // Numero massimo di round
      updatedAt: match.updatedAt, // Data di aggiornamento
      result: player.score > (opponent ? opponent.score : 0) ? "Vinto" : player.score < (opponent ? opponent.score : 0) ? "Perso" : "Pareggio", // Risultato della partita
      opponent: opponent ? opponent.username : "N/A", // Nome dell'avversario
      round: `${match.currentRound}/${match.maxRounds}`, // Round attuale rispetto al massimo
      correctAnswers: player.score, // Risposte corrette del giocatore
      date: new Date(match.updatedAt).toLocaleDateString() // Data della partita
    };
  });

  if (userMatches.length === 0) {
    return res.status(404).json({ success: false, message: "No matches found for this user" }); // Restituisce errore se non ci sono partite
  }

  res.json({ success: true, games: userMatches }); // Restituisce successo e le partite dell'utente
});

// Crea una rivincita con gli stessi giocatori
router.post("/recreate", (req, res) => {
  const { userId, gameCode, maxRounds, players } = req.body; // Estrae i dati dal corpo della richiesta
  console.log("API recreate trovata. body:", req.body); // Log dei dati ricevuti

  // Validazione input
  if (!userId || !gameCode || !players) {
    return res.status(400).json({ error: "User ID, game code and players are required" }); // Restituisce errore se mancano dati
  }

  // Trova l'utente
  const user = userModel.findUserById(userId); // Cerca l'utente nel modello
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }

  // Crea una nuova partita
  const newGame = {
    id: uuidv4(), // Genera un ID unico per la partita
    matchCode: gameCode, // Codice della partita
    status: "active", // La partita è subito attiva perché abbiamo già entrambi i giocatori
    players: players.map(player => ({
      id: player.id, // ID del giocatore
      username: player.username, // Nome utente del giocatore
      score: 0, // Punteggio iniziale
      characters: [] // Array per i personaggi del giocatore
    })),
    currentRound: 0, // Round attuale
    maxRounds: maxRounds || 5, // Numero massimo di round
    currentTurn: userId, // ID dell'utente il cui turno è attuale
    createdAt: new Date(), // Data di creazione della partita
    updatedAt: new Date(), // Data di aggiornamento della partita
  };

  // Leggi le partite esistenti
  const matches = readMatches(); // Legge le partite dal file
  
  // Aggiungi la nuova partita all'elenco
  matches.push(newGame); // Aggiunge la nuova partita all'array delle partite

  // Scrivi le partite aggiornate nel file
  writeMatches(matches); // Salva le partite aggiornate nel file

  // Restituisci i dati della nuova partita
  res.status(201).json({
    success: true,
    game: newGame, // Restituisce la nuova partita creata
  });
});

// Richiedi una rivincita per una partita
router.post('/request-rematch', (req, res) => {
  const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' }); // Restituisce errore se mancano dati
  }
  
  try {
    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Trova la partita
    const game = matches.find(game => game.matchCode === gameCode); // Cerca la partita per codice
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' }); // Restituisce errore se la partita non esiste
    }
    
    // Verifica che l'utente sia un giocatore della partita
    const isPlayerInGame = game.players.some(player => player && player.id === userId); // Controlla se l'utente è un giocatore
    if (!isPlayerInGame) {
      return res.status(403).json({ success: false, message: 'User is not a player in this game' }); // Restituisce errore se l'utente non è un giocatore
    }
    
    // Inizializza l'array delle richieste di rivincita se non esiste
    if (!game.rematchRequests) {
      game.rematchRequests = []; // Crea un array per le richieste di rivincita
    }
    
    // Verifica se l'utente ha già richiesto una rivincita
    const hasAlreadyRequested = game.rematchRequests.includes(userId); // Controlla se l'utente ha già richiesto
    if (!hasAlreadyRequested) {
      // Aggiungi la richiesta di rivincita
      game.rematchRequests.push(userId); // Aggiunge l'ID dell'utente alle richieste
      game.updatedAt = new Date(); // Aggiorna la data di modifica
      
      // Se è il primo giocatore a richiedere la rivincita, genera un nuovo codice partita
      if (game.rematchRequests.length === 1 && !game.rematchNewGameCode) {
        // Genera un codice partita univoco
        const newGameCode = generateGameCode(); // Genera un nuovo codice
        game.rematchNewGameCode = newGameCode; // Imposta il nuovo codice
        console.log(`Nuovo codice partita per la rivincita generato: ${newGameCode}`); // Log del nuovo codice
      }
    }
    
    // Verifica se entrambi i giocatori hanno richiesto una rivincita
    const bothPlayersRequested = game.players.length === 2 && 
                              game.rematchRequests.length === 2 &&
                              game.players.every(player => player && game.rematchRequests.includes(player.id)); // Controlla se entrambi i giocatori hanno richiesto
    
    // Se entrambi hanno richiesto, aggiorna lo stato
    if (bothPlayersRequested) {
      game.rematchAccepted = true; // Imposta il flag per accettazione della rivincita
      
      // Se entrambi hanno accettato e siamo il secondo giocatore a richiedere la rivincita,
      // creiamo subito la nuova partita
      if (game.rematchRequests.length === 2 && game.rematchNewGameCode) {
        // Crea la nuova partita solo se non è già stata creata
        if (!game.rematchCreated) {
          // Crea una nuova partita con lo stesso codice
          const newGame = {
            id: uuidv4(), // Genera un ID unico per la nuova partita
            matchCode: game.rematchNewGameCode, // Codice della nuova partita
            status: "active", // La partita è subito attiva
            players: game.players.map(player => ({
              id: player.id, // ID del giocatore
              username: player.username, // Nome utente del giocatore
              score: 0, // Punteggio iniziale
              characters: [] // Array per i personaggi del giocatore
            })),
            currentRound: 0, // Round attuale
            maxRounds: game.maxRounds || 5, // Numero massimo di round
            currentTurn: game.players[0].id, // Il primo giocatore inizia
            createdAt: new Date(), // Data di creazione della partita
            updatedAt: new Date(), // Data di aggiornamento della partita
            isRematch: true, // Indica che è una rivincita
            originalGameCode: gameCode // Codice della partita originale
          };
          
          // Aggiungi la nuova partita all'elenco delle partite
          matches.push(newGame); // Aggiunge la nuova partita all'array delle partite
          
          // Segna che la partita di rivincita è stata creata
          game.rematchCreated = true; // Imposta il flag per la creazione della rivincita
          
          console.log(`Nuova partita di rivincita creata con codice: ${game.rematchNewGameCode}`); // Log della nuova partita
        }
      }
    }
    
    // Salva i cambiamenti
    writeMatches(matches); // Salva le partite aggiornate nel file
    
    // Restituisci lo stato della richiesta
    return res.json({
      success: true,
      hasAlreadyRequested, // Indica se l'utente ha già richiesto
      bothPlayersRequested, // Indica se entrambi i giocatori hanno richiesto
      newGameCode: game.rematchNewGameCode // Restituisce il nuovo codice della partita
    });
  } catch (error) {
    console.error('Errore nella richiesta di rivincita:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Server error' }); // Restituisce errore interno del server
  }
});

// Controlla lo stato delle richieste di rivincita per una partita
router.get('/check-rematch/:gameCode', (req, res) => {
  const { gameCode } = req.params; // Estrae il codice della partita dai parametri
  const { userId } = req.query; // Prende l'userId dalla query string
  
  if (!gameCode) {
    return res.status(400).json({ success: false, message: 'Game code is required' }); // Restituisce errore se manca il codice
  }
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' }); // Restituisce errore se manca l'ID utente
  }
  
  try {
    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Trova la partita
    const game = matches.find(game => game.matchCode === gameCode); // Cerca la partita per codice
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' }); // Restituisce errore se la partita non esiste
    }
    
    // Verifica che l'utente sia un giocatore della partita
    const isPlayerInGame = game.players.some(player => player && player.id === userId); // Controlla se l'utente è un giocatore
    if (!isPlayerInGame) {
      return res.status(403).json({ success: false, message: 'User is not a player in this game' }); // Restituisce errore se l'utente non è un giocatore
    }
    
    // Usa l'userId dalla query invece di req.session.user.id
    const currentUserId = userId; // Imposta l'ID utente corrente
    
    // Inizializza l'array delle richieste di rivincita se non esiste
    if (!game.rematchRequests) {
      game.rematchRequests = []; // Crea un array per le richieste di rivincita
    }
    
    // Verifica se l'utente corrente ha già richiesto una rivincita
    const currentUserRequested = game.rematchRequests.includes(currentUserId); // Controlla se l'utente ha già richiesto
    
    // Trova l'avversario
    const opponent = game.players.find(player => player && player.id !== currentUserId); // Cerca l'avversario
    
    // Verifica se l'avversario ha richiesto una rivincita
    const opponentRequested = opponent && game.rematchRequests.includes(opponent.id); // Controlla se l'avversario ha richiesto
    
    // Verifica se entrambi i giocatori hanno richiesto una rivincita
    const bothPlayersRequested = game.players.length === 2 && 
                              game.rematchRequests.length === 2 &&
                              game.players.every(player => player && game.rematchRequests.includes(player.id)); // Controlla se entrambi i giocatori hanno richiesto
    
    // Verifica se la rivincita è stata declinata e da chi
    const rematchDeclined = game.rematchDeclined || false; // Controlla se la rivincita è stata declinata
    const rematchDeclinedByOpponent = rematchDeclined && game.rematchDeclinedBy !== currentUserId; // Controlla se l'avversario ha declinato
    
    // Verifica se un giocatore che aveva richiesto la rivincita ha poi abbandonato
    const playerAbandoned = game.rematchPlayerAbandoned || false; // Controlla se un giocatore ha abbandonato
    
    // Restituisci lo stato delle richieste
    return res.json({
      success: true,
      currentUserRequested, // Indica se l'utente ha richiesto
      opponentRequested, // Indica se l'avversario ha richiesto
      bothPlayersRequested, // Indica se entrambi i giocatori hanno richiesto
      newGameCode: game.rematchNewGameCode, // Restituisce il nuovo codice della partita
      rematchDeclined, // Indica se la rivincita è stata declinata
      rematchDeclinedByOpponent, // Indica se l'avversario ha declinato
      playerAbandoned // Indica se un giocatore ha abbandonato
    });
  } catch (error) {
    console.error('Errore nel controllo delle richieste di rivincita:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Server error' }); // Restituisce errore interno del server
  }
});

// Route per creare nuovamente una partita (usata per le rivincite)
router.post('/recreate', (req, res) => {
  const { userId, gameCode, maxRounds, players, isRematch, originalGameCode } = req.body; // Estrae i dati dal corpo della richiesta
  
  if (!userId || !gameCode || !players) {
    return res.status(400).json({ success: false, message: 'Missing required fields' }); // Restituisce errore se mancano dati
  }
  
  try {
    // Costruisci la nuova partita
    const newGame = {
      id: uuidv4(), // Genera un ID unico per la nuova partita
      matchCode: gameCode, // Codice della nuova partita
      status: "waiting", // Stato iniziale della partita
      players: players.map(player => ({
        id: player.id, // ID del giocatore
        username: player.username, // Nome utente del giocatore
        score: 0, // Punteggio iniziale
        characters: [] // Array per i personaggi del giocatore
      })),
      currentRound: 0, // Round attuale
      maxRounds: maxRounds || 5, // Numero massimo di round
      currentTurn: players[0].id, // Il primo giocatore inizia
      createdAt: new Date(), // Data di creazione della partita
      updatedAt: new Date(), // Data di aggiornamento della partita
      isRematch: isRematch || false, // Indica se è una rivincita
      originalGameCode: originalGameCode || null // Codice della partita originale
    };
    
    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Se è una rivincita, aggiorna la partita originale
    if (isRematch && originalGameCode) {
      const originalGame = matches.find(game => game.matchCode === originalGameCode); // Cerca la partita originale
      if (originalGame) {
        originalGame.rematchNewGameCode = gameCode; // Imposta il nuovo codice per la rivincita
        originalGame.updatedAt = new Date(); // Aggiorna la data di modifica
      }
    }
    
    // Aggiungi la nuova partita
    matches.push(newGame); // Aggiunge la nuova partita all'array delle partite
    
    // Salva i cambiamenti
    writeMatches(matches); // Salva le partite aggiornate nel file
    
    // Restituisci la nuova partita
    return res.json({
      success: true,
      game: newGame // Restituisce la nuova partita creata
    });
  } catch (error) {
    console.error('Errore nella creazione della nuova partita:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Server error' }); // Restituisce errore interno del server
  }
});

// Route per declinare una richiesta di rivincita
router.post('/decline-rematch', (req, res) => {
  const { userId, gameCode } = req.body; // Estrae i dati dal corpo della richiesta
  
  if (!userId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' }); // Restituisce errore se mancano dati
  }
  
  try {
    // Leggi le partite esistenti
    const matches = readMatches(); // Legge le partite dal file
    
    // Trova la partita
    const game = matches.find(game => game.matchCode === gameCode); // Cerca la partita per codice
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' }); // Restituisce errore se la partita non esiste
    }
    
    // Verifica che l'utente sia un giocatore della partita
    const isPlayerInGame = game.players.some(player => player && player.id === userId); // Controlla se l'utente è un giocatore
    if (!isPlayerInGame) {
      return res.status(403).json({ success: false, message: 'User is not a player in this game' }); // Restituisce errore se l'utente non è un giocatore
    }
    
    // Controlla se l'utente aveva precedentemente richiesto una rivincita
    const hadPreviouslyRequested = game.rematchRequests && game.rematchRequests.includes(userId); // Controlla se l'utente ha già richiesto
    
    // Segna che questo giocatore ha declinato la rivincita
    game.rematchDeclined = true; // Imposta il flag per declinazione della rivincita
    game.rematchDeclinedBy = userId; // Imposta l'ID dell'utente che ha declinato
    game.rematchPlayerAbandoned = hadPreviouslyRequested; // Imposta il flag per abbandono
    game.updatedAt = new Date(); // Aggiorna la data di modifica
    
    // Salva i cambiamenti
    writeMatches(matches); // Salva le partite aggiornate nel file
    
    // Restituisci successo
    return res.json({
      success: true,
      message: 'Rematch declined successfully', // Messaggio di successo
      hadPreviouslyRequested // Indica se l'utente aveva già richiesto
    });
  } catch (error) {
    console.error('Errore nel declinare la rivincita:', error); // Log degli errori
    return res.status(500).json({ success: false, message: 'Server error' }); // Restituisce errore interno del server
  }
});

module.exports = router; // Esporta il router per l'uso nell'applicazione