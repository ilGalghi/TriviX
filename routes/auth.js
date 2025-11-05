const express = require("express")
const router = express.Router()
const userModel = require("../models/userModel")
const validator = require("validator")

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req, res, next) => {
  console.log("Checking authentication:", req.session)
  // req.session è un oggetto che memorizza i dati della sessione dell'utente
  // Può contenere informazioni come l'ID dell'utente per gestire l'autenticazione
  if (req.session && req.session.userId) {
    return next()
  }
  return res.status(401).json({ success: false, message: "Non autenticato" })
}

// Registra un nuovo utente
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body

    console.log("Register attempt:", { username, email })

    // Validazione avanzata degli input
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Fornire tutti i campi obbligatori" })
    }

    // Valida formato email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Formato email non valido" })
    }

    // Valida username (alfanumerico, 3-20 caratteri)
    if (!validator.isLength(username, { min: 3, max: 20 }) || !validator.isAlphanumeric(username, 'en-US', { ignore: '_-' })) {
      return res.status(400).json({ success: false, message: "Username deve essere alfanumerico e lungo tra 3 e 20 caratteri" })
    }

    // Valida password (minimo 8 caratteri, almeno 1 maiuscola, 1 minuscola, 1 numero)
    if (!validator.isStrongPassword(password, { 
      minLength: 8, 
      minLowercase: 1, 
      minUppercase: 1, 
      minNumbers: 1, 
      minSymbols: 0 
    })) {
      return res.status(400).json({ 
        success: false, 
        message: "Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero" 
      })
    }

    // Sanitizza input
    const sanitizedUsername = validator.escape(validator.trim(username))
    const sanitizedEmail = validator.normalizeEmail(email)

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Le password non corrispondono" })
    }

    // Aggiungi l'utente
    const result = await userModel.addUser({ 
      username: sanitizedUsername, 
      email: sanitizedEmail, 
      password 
    })

    if (result.success) {
      // Rigenera l'ID di sessione per prevenire session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err)
          return res.status(500).json({ success: false, message: "Errore durante la registrazione" })
        }
        
        // Imposta la sessione
        req.session.userId = result.user.id
        console.log("User registered and session regenerated:", req.session)

        return res.status(201).json(result)
      })
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Login utente
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    console.log("Login attempt:", { username })

    // Valida l'input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Fornire username e password" })
    }

    // Sanitizza username
    const sanitizedUsername = validator.escape(validator.trim(username))

    // Autentica l'utente
    const result = await userModel.authenticateUser(sanitizedUsername, password)

    if (result.success) {
      // Rigenera l'ID di sessione per prevenire session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err)
          return res.status(500).json({ success: false, message: "Errore durante il login" })
        }
        
        // Imposta la sessione
        req.session.userId = result.user.id
        console.log("User logged in and session regenerated:", req.session)

        return res.status(200).json(result)
      })
    } else {
      // Messaggio generico per non rivelare se l'utente esiste
      return res.status(401).json({ 
        success: false, 
        message: "Credenziali non valide" 
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Ottieni l'utente corrente
router.get("/me", async (req, res) => {
  try {
    console.log("Checking current user. Session:", req.session)

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Non autenticato" })
    }

    const user = await userModel.findUserById(req.session.userId)

    if (!user) {
      // Utente non trovato, cancella la sessione
      req.session.destroy()
      return res.status(404).json({ success: false, message: "Utente non trovato" })
    }

    // Restituisci i dati dell'utente senza la password
    const { password, ...userWithoutPassword } = user
    return res.status(200).json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error("Error retrieving user:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Logout utente
router.post("/logout", (req, res) => {
  try {
    console.log("Logging out user. Session before:", req.session)

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err)
        return res.status(500).json({ success: false, message: "Errore durante il logout" })
      }

      console.log("Session destroyed successfully")
      // Pulisci anche il cookie lato client
      res.clearCookie('trivix_session')
      return res.status(200).json({ success: true, message: "Logout effettuato con successo" })
    })
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Aggiorna il profilo utente
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body

    console.log("Updating profile for user:", req.session.userId)

    // Validazione degli input se presenti
    const updates = {}
    
    if (username) {
      if (!validator.isLength(username, { min: 3, max: 20 }) || !validator.isAlphanumeric(username, 'en-US', { ignore: '_-' })) {
        return res.status(400).json({ success: false, message: "Username deve essere alfanumerico e lungo tra 3 e 20 caratteri" })
      }
      updates.username = validator.escape(validator.trim(username))
    }
    
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Formato email non valido" })
      }
      updates.email = validator.normalizeEmail(email)
    }
    
    if (password) {
      if (!validator.isStrongPassword(password, { 
        minLength: 8, 
        minLowercase: 1, 
        minUppercase: 1, 
        minNumbers: 1, 
        minSymbols: 0 
      })) {
        return res.status(400).json({ 
          success: false, 
          message: "Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero" 
        })
      }
      updates.password = password
    }
    
    if (avatar) {
      console.log("Avatar received:", avatar)
      
      // Estrai il percorso dall'URL se è un URL completo
      let avatarPath = avatar;
      
      // Se è un URL assoluto (http:// o https://), estrai solo il path
      const urlMatch = avatar.match(/^https?:\/\/[^\/]+(\/img\/.*)$/i);
      if (urlMatch) {
        avatarPath = urlMatch[1]; // Estrae /img/avatars/avatar1.png
        console.log("Avatar converted from absolute URL to path:", avatarPath)
      }
      
      // Sanitizza il percorso avatar per prevenire path traversal
      const sanitizedAvatar = avatarPath.replace(/\.\./g, '');
      console.log("Avatar sanitized:", sanitizedAvatar)
      
      if (!sanitizedAvatar.startsWith('/img/')) {
        console.log("Avatar path validation failed - doesn't start with /img/")
        return res.status(400).json({ success: false, message: "Percorso avatar non valido" })
      }
      
      updates.profile = { avatar: sanitizedAvatar }
      console.log("Updates object with avatar:", updates)
    }

    console.log("Final updates object:", updates)

    // Aggiorna il profilo
    const result = await userModel.updateUserProfile(req.session.userId, updates)

    console.log("Update result:", result)

    if (result.success) {
      return res.status(200).json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Aggiorna le statistiche di gioco
router.put("/stats", isAuthenticated, async (req, res) => {
  try {
    const { gamesPlayed, gamesWon, correctAnswers, categoryPerformance } = req.body

    console.log("Updating stats for user:", req.session.userId)

    // Validazione dei dati numerici
    if (gamesPlayed !== undefined && (!Number.isInteger(gamesPlayed) || gamesPlayed < 0)) {
      return res.status(400).json({ success: false, message: "Valore gamesPlayed non valido" })
    }
    if (gamesWon !== undefined && (!Number.isInteger(gamesWon) || gamesWon < 0)) {
      return res.status(400).json({ success: false, message: "Valore gamesWon non valido" })
    }
    if (correctAnswers !== undefined && (!Number.isInteger(correctAnswers) || correctAnswers < 0)) {
      return res.status(400).json({ success: false, message: "Valore correctAnswers non valido" })
    }

    // Aggiorna le statistiche
    const result = await userModel.updateGameStats(req.session.userId, {
      gamesPlayed,
      gamesWon,
      correctAnswers,
      categoryPerformance,
    })

    if (result.success) {
      return res.status(200).json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Error updating stats:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Elimina il profilo dell'utente
router.delete("/profile/delete", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    console.log("Delete profile attempt for user ID:", userId);
    
    // Elimina l'utente
    const result = await userModel.deleteUser(userId);
    
    if (result.success) {
      // Distruggi la sessione
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        console.log("User profile deleted and session destroyed");
        // Pulisci anche il cookie lato client
        res.clearCookie('trivix_session')
      });
      
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Delete profile error:", error);
    return res.status(500).json({ success: false, message: "Errore del server" });
  }
});

module.exports = router