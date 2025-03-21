const express = require("express")
const router = express.Router()
const userModel = require("../models/userModel")

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req, res, next) => {
  console.log("Checking authentication:", req.session)
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

    // Valida l'input
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Fornisci tutti i campi richiesti" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Le password non corrispondono" })
    }

    // Aggiungi l'utente
    const result = await userModel.addUser({ username, email, password })

    if (result.success) {
      // Imposta la sessione
      req.session.userId = result.user.id
      console.log("User registered and session set:", req.session)

      return res.status(201).json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Errore di registrazione:", error)
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
      return res.status(400).json({ success: false, message: "Fornisci username e password" })
    }

    // Autentica l'utente
    const result = await userModel.authenticateUser(username, password)

    if (result.success) {
      // Imposta la sessione
      req.session.userId = result.user.id
      console.log("User logged in and session set:", req.session)

      return res.status(200).json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Errore di login:", error)
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
    console.error("Errore nel recupero dell'utente:", error)
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
      return res.status(200).json({ success: true, message: "Logout effettuato con successo" })
    })
  } catch (error) {
    console.error("Errore di logout:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Aggiorna il profilo utente
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body

    console.log("Updating profile for user:", req.session.userId)

    // Aggiorna il profilo
    const result = await userModel.updateUserProfile(req.session.userId, {
      username,
      email,
      password,
      avatar,
    })

    if (result.success) {
      return res.status(200).json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

// Aggiorna le statistiche di gioco
router.put("/stats", isAuthenticated, async (req, res) => {
  try {
    const { gamesPlayed, gamesWon, correctAnswers, categoryPerformance } = req.body

    console.log("Updating stats for user:", req.session.userId)

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
    console.error("Errore nell'aggiornamento delle statistiche:", error)
    return res.status(500).json({ success: false, message: "Errore del server" })
  }
})

module.exports = router

