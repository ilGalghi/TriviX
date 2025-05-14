const express = require("express"); // Importa il modulo express per creare l'applicazione web
const router = express.Router(); // Crea un router per gestire le rotte
const userModel = require("../models/userModel"); // Importa il modello utente

// Importa l'array degli utenti dalle rotte di autenticazione
const { users } = require("./auth"); // Importa l'array degli utenti per l'uso in questo file

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req, res, next) => {
  console.log("Checking authentication:", req.session); // Log della sessione per il debug
  if (req.session && req.session.userId) { // Controlla se la sessione esiste e se l'ID utente è presente
    return next(); // Passa al prossimo middleware o alla rotta
  }
  return res.status(401).json({ success: false, message: "Not authenticated" }); // Restituisce errore se non autenticato
}

// Route per ottenere il profilo utente
router.get("/:userId", (req, res) => {
  const { userId } = req.params; // Estrae l'ID utente dai parametri della richiesta

  // Trova l'utente
  const user = users.find((user) => user.id === userId); // Cerca l'utente nell'array
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }
  console.log("rispondo con user", user); // Log dell'utente trovato
  // Restituisce i dati dell'utente (escludendo la password)
  res.json({
    user: {
      id: user.id, // ID dell'utente
      username: user.username, // Nome utente
      email: user.email, // Email dell'utente
      stats: user.stats, // Statistiche dell'utente
      createdAt: user.createdAt, // Data di creazione dell'utente
    },
  });
});

// Rotta per aggiornare il profilo utente
router.put("/:userId", (req, res) => {
  const { userId } = req.params; // Estrae l'ID utente dai parametri della richiesta
  const { username, email, password } = req.body; // Estrae i dati dal corpo della richiesta

  // Trova l'utente
  const user = users.find((user) => user.id === userId); // Cerca l'utente nell'array
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }

  // Aggiorna i dati dell'utente
  if (username) user.username = username; // Aggiorna il nome utente se fornito
  if (email) user.email = email; // Aggiorna l'email se fornita
  if (password) user.password = password; // Aggiorna la password (dovrebbe essere hashata in un'applicazione reale)

  // Restituisce i dati aggiornati dell'utente (escludendo la password)
  res.json({
    user: {
      id: user.id, // ID dell'utente
      username: user.username, // Nome utente aggiornato
      email: user.email, // Email aggiornata
      stats: user.stats, // Statistiche dell'utente
      createdAt: user.createdAt, // Data di creazione dell'utente
    },
  });
});

// Rotta per aggiornare le statistiche dell'utente
router.put("/:userId/stats", (req, res) => {
  const { userId } = req.params; // Estrae l'ID utente dai parametri della richiesta
  const { gamesPlayed, gamesWon, correctAnswers, categoryStats } = req.body; // Estrae i dati dal corpo della richiesta

  // Trova l'utente
  const user = users.find((user) => user.id === userId); // Cerca l'utente nell'array
  if (!user) {
    return res.status(404).json({ error: "User not found" }); // Restituisce errore se l'utente non esiste
  }

  // Inizializza le statistiche se necessario
  if (!user.stats) {
    user.stats = {
      gamesPlayed: 0, // Inizializza il numero di partite giocate
      gamesWon: 0, // Inizializza il numero di partite vinte
      correctAnswers: 0, // Inizializza il numero di risposte corrette
      categoryStats: {}, // Inizializza le statistiche per categoria
    };
  }

  // Aggiorna le statistiche dell'utente
  if (gamesPlayed !== undefined) user.stats.gamesPlayed = gamesPlayed; // Aggiorna le partite giocate se fornito
  if (gamesWon !== undefined) user.stats.gamesWon = gamesWon; // Aggiorna le partite vinte se fornito
  if (correctAnswers !== undefined) user.stats.correctAnswers = correctAnswers; // Aggiorna le risposte corrette se fornito
  if (categoryStats) {
    user.stats.categoryStats = {
      ...user.stats.categoryStats, // Mantiene le statistiche esistenti
      ...categoryStats, // Aggiorna le statistiche per categoria
    };
  }

  // Restituisce i dati aggiornati dell'utente
  res.json({
    user: {
      id: user.id, // ID dell'utente
      username: user.username, // Nome utente
      email: user.email, // Email dell'utente
      stats: user.stats, // Statistiche aggiornate dell'utente
      createdAt: user.createdAt, // Data di creazione dell'utente
    },
  });
});

// Aggiorna le prestazioni dell'utente per una categoria specifica
router.post("/update-category-performance", async (req, res) => {
  try {
    const { userId, category, isCorrect } = req.body; // Estrae i dati dal corpo della richiesta

    console.log("Aggiornamento prestazioni per categoria:", { userId, category, isCorrect }); // Log per il debug

    if (!userId || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId e categoria sono richiesti" // Messaggio di errore se mancano dati
      });
    }

    // Aggiorna le prestazioni per la categoria
    const result = await userModel.updateCategoryPerformance(userId, category, isCorrect); // Chiama il metodo per aggiornare le prestazioni

    if (result.success) {
      return res.status(200).json(result); // Restituisce successo se l'aggiornamento ha avuto successo
    } else {
      return res.status(400).json(result); // Restituisce errore se l'aggiornamento fallisce
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento delle prestazioni per categoria:", error); // Log degli errori
    return res.status(500).json({ 
      success: false, 
      message: "Errore del server" // Restituisce errore interno del server
    });
  }
});

// Rotta per ottenere tutti gli utenti (solo informazioni pubbliche)
router.get("/all/public", async (req, res) => {
  try {
    const users = await userModel.readUsers(); // Legge gli utenti dal modello
    
    // Filtra solo le informazioni pubbliche (rimuovendo password e dati sensibili)
    const publicUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user; // Esclude la password
      return userWithoutPassword; // Restituisce l'utente senza password
    });
    
    res.json(publicUsers); // Restituisce gli utenti pubblici
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error); // Log degli errori
    res.status(500).json({ success: false, message: "Errore del server" }); // Restituisce errore interno del server
  }
});

module.exports = router; // Esporta il router per l'uso nell'applicazione

