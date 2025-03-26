const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const userModel = require("../models/userModel");

// In-memory user storage reference
// In a real app, you would import this from a shared module
const users = [];

const matchesFilePath = path.join(__dirname, '../public/data/matches.json');

// Funzione per leggere i dati delle partite dal file JSON
const readMatches = () => {
  try {
    console.log("tento di leggere matches in " + matchesFilePath);
    const data = fs.readFileSync(matchesFilePath);
    return JSON.parse(data);
  } catch (error) {
    console.log("errore in lettura file : " + error);
    return [];
  }
};

// Funzione per scrivere i dati delle partite nel file JSON
const writeMatches = (matches) => {
  fs.writeFileSync(matchesFilePath, JSON.stringify(matches, null, 2));
  console.log("salvo "  + JSON.stringify(matches, null, 2));
};




// Crea un nuovo gioco
router.post("/create", (req, res) => {
  const { userId, gameCode } = req.body;
  console.log("api trovata. body :" + req.body);

  
  // Validazione input
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }else{
    console.log("user id preso");
  }

  

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
    status: "waiting", // stati possibili: "waiting", "active", "completed"
    players: [
    ],
    currentRound: 0,
    maxRounds: 25,
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

  switch (action) {
    case "answer":
      // Aggiornamento del punteggio del giocatore
      const player = game.players.find((player) => player.id === userId);
      if (player) {
        if (data.isCorrect) {
          player.score += 1;
        }
      }

      game.currentRound += 1;

      const opponent = game.players.find((player) => player.id !== userId);
      if (opponent) {
        game.currentTurn = opponent.id;
      }

      game.updatedAt = new Date();
      
      if (game.currentRound >= game.maxRounds) {
        game.status = "completed";
        // Update user stats logic
      }
      break;

    case "forfeit":
      game.status = "completed";
      game.updatedAt = new Date();
      // Update user stats logic
      break;

    default:
      return res.status(400).json({ error: "Invalid action" });
  }

  writeMatches(matches);
  res.json({ game });
});

// Nuova route PUT per aggiornare un match specifico, ad esempio per assegnare giocatori
router.put("/update/:matchCode", (req, res) => {
  const { matchCode } = req.params;
  const { currentUser } = req.body; // supponiamo che tu stia passando i dettagli del giocatore

  const matches = readMatches();
  const game = matches.find((game) => game.matchCode === matchCode);

  if (!game) {
    return res.status(404).json({ error: "Match not found" });
  }

  // Controlla se Player 1 o Player 2 sono già assegnati
  let playerAssigned = false;
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

  if (!playerAssigned) {
    return res.status(400).json({ error: "Both players are already assigned." });
  }

  game.updatedAt = new Date();
  writeMatches(matches);

  res.json({ game });
});


// Update user stats based on game results
function updateUserStats(game) {
  if (game.status !== "completed") return;

  // Determine winner
  let winner = null;
  if (game.players.length === 2) {
    const player1 = game.players[0];
    const player2 = game.players[1];

    if (player1.score > player2.score) {
      winner = player1;
    } else if (player2.score > player1.score) {
      winner = player2;
    }
  }

  // Update stats for each player
  game.players.forEach((player) => {
    const user = users.find((u) => u.id === player.id);
    if (user) {
      // Initialize stats if needed
      if (!user.stats) {
        user.stats = {
          gamesPlayed: 0,
          gamesWon: 0,
          correctAnswers: 0,
          categoryStats: {},
        };
      }

      // Update stats
      user.stats.gamesPlayed += 1;

      if (winner && winner.id === player.id) {
        user.stats.gamesWon += 1;
      }

      user.stats.correctAnswers += player.score;
    }
  });
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

module.exports = router;