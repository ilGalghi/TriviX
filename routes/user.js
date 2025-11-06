const express = require("express"); // Importa il modulo express per creare l'applicazione web
const router = express.Router(); // Crea un router per gestire le rotte
const User = require("../models/User"); // Importa il modello utente Mongoose
const validator = require("validator"); // Importa validator per sanitizzazione
const mongoose = require("mongoose");

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req, res, next) => {
  console.log("Checking authentication:", req.session); // Log della sessione per il debug
  if (req.session && req.session.userId) { // Controlla se la sessione esiste e se l'ID utente è presente
    return next(); // Passa al prossimo middleware o alla rotta
  }
  return res.status(401).json({ success: false, message: "Non autenticato" }); // Restituisce errore se non autenticato
}

// Route per ottenere il profilo utente
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params; // Estrae l'ID utente dai parametri della richiesta

    // Valida formato ObjectId MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }

    // Trova l'utente usando il modello
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" }); // Restituisce errore se l'utente non esiste
    }
    
    console.log("rispondo con user", user); // Log dell'utente trovato
    
    // Restituisce i dati dell'utente (escludendo la password)
    res.json({
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Rotta per aggiornare il profilo utente (DEPRECATA - usare /api/auth/profile)
router.put("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password } = req.body;

    // Valida formato ObjectId MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }

    // Verifica che l'utente possa modificare solo il proprio profilo
    if (req.session.userId !== userId) {
      return res.status(403).json({ error: "Non autorizzato a modificare questo profilo" });
    }

    // Validazione input
    const updates = {};
    
    if (username) {
      if (!validator.isLength(username, { min: 3, max: 20 }) || !validator.isAlphanumeric(username, 'en-US', { ignore: '_-' })) {
        return res.status(400).json({ error: "Username deve essere alfanumerico e lungo tra 3 e 20 caratteri" });
      }
      updates.username = validator.escape(validator.trim(username));
    }
    
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "Formato email non valido" });
      }
      updates.email = validator.normalizeEmail(email);
    }
    
    if (password) {
      if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
        return res.status(400).json({ error: "Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero" });
      }
      updates.password = password;
    }

    // Aggiorna il profilo
    const result = await User.updateProfile(userId, updates);

    if (result.success) {
      res.json({ user: result.user });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Rotta per aggiornare le statistiche dell'utente (DEPRECATA - usare /api/auth/stats)
router.put("/:userId/stats", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { gamesPlayed, gamesWon, correctAnswers, categoryStats } = req.body;

    // Valida formato ObjectId MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }

    // Verifica che l'utente possa modificare solo le proprie statistiche
    if (req.session.userId !== userId) {
      return res.status(403).json({ error: "Non autorizzato a modificare queste statistiche" });
    }

    // Validazione dei valori numerici
    if (gamesPlayed !== undefined && (!Number.isInteger(gamesPlayed) || gamesPlayed < 0)) {
      return res.status(400).json({ error: "Valore gamesPlayed non valido" });
    }
    if (gamesWon !== undefined && (!Number.isInteger(gamesWon) || gamesWon < 0)) {
      return res.status(400).json({ error: "Valore gamesWon non valido" });
    }
    if (correctAnswers !== undefined && (!Number.isInteger(correctAnswers) || correctAnswers < 0)) {
      return res.status(400).json({ error: "Valore correctAnswers non valido" });
    }

    // Aggiorna le statistiche
    const result = await User.updateGameStats(userId, {
      gamesPlayed,
      gamesWon,
      correctAnswers,
      categoryPerformance: categoryStats
    });

    if (result.success) {
      res.json({ user: result.user });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Error updating stats:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Aggiorna le prestazioni dell'utente per una categoria specifica
router.post("/update-category-performance", isAuthenticated, async (req, res) => {
  try {
    const { userId, category, isCorrect } = req.body;

    console.log("Aggiornamento prestazioni per categoria:", { userId, category, isCorrect });

    if (!userId || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId e categoria sono richiesti"
      });
    }

    // Valida formato ObjectId MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "ID utente non valido" });
    }

    // Verifica che l'utente possa modificare solo le proprie statistiche
    if (req.session.userId !== userId) {
      return res.status(403).json({ success: false, message: "Non autorizzato" });
    }

    // Valida categoria
    const allowedCategories = ['science', 'entertainment', 'sports', 'art', 'geography', 'history'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ success: false, message: "Categoria non valida" });
    }

    // Valida isCorrect
    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ success: false, message: "Il valore isCorrect deve essere booleano" });
    }

    // Aggiorna le prestazioni per la categoria
    const result = await User.updateCategoryPerformance(userId, category, isCorrect);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento delle prestazioni per categoria:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Errore del server"
    });
  }
});

// Rotta per ottenere tutti gli utenti (solo informazioni pubbliche)
router.get("/all/public", async (req, res) => {
  try {
    const users = await User.find().select('-password -__v'); // Trova tutti gli utenti escludendo password e versione
    
    // Converti in oggetti sicuri
    const publicUsers = users.map(user => user.toSafeObject());
    
    res.json(publicUsers); // Restituisce gli utenti pubblici
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error); // Log degli errori
    res.status(500).json({ success: false, message: "Errore del server" }); // Restituisce errore interno del server
  }
});

module.exports = router; // Esporta il router per l'uso nell'applicazione

