const express = require("express")
const router = express.Router()
const userModel = require("../models/userModel")

// Import users array from auth routes
const { users } = require("./auth")

// Middleware per verificare se l'utente è autenticato
const isAuthenticated = (req, res, next) => {
  console.log("Checking authentication:", req.session)
  if (req.session && req.session.userId) {
    return next()
  }
  return res.status(401).json({ success: false, message: "Non autenticato" })
}

// Get user profile route
router.get("/:userId", (req, res) => {
  const { userId } = req.params

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }
  console.log("rispondo con user", user);
  // Return user data (excluding password)
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: user.stats,
      createdAt: user.createdAt,
    },
  })
})

// Update user profile route
router.put("/:userId", (req, res) => {
  const { userId } = req.params
  const { username, email, password } = req.body

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // Update user data
  if (username) user.username = username
  if (email) user.email = email
  if (password) user.password = password    // Hash password

  // Return updated user data (excluding password)
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: user.stats,
      createdAt: user.createdAt,
    },
  })
})

// Update user stats route
router.put("/:userId/stats", (req, res) => {
  const { userId } = req.params
  const { gamesPlayed, gamesWon, correctAnswers, categoryStats } = req.body

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // Initialize stats if needed
  if (!user.stats) {
    user.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      correctAnswers: 0,
      categoryStats: {},
    }
  }

  // Update user stats
  if (gamesPlayed !== undefined) user.stats.gamesPlayed = gamesPlayed
  if (gamesWon !== undefined) user.stats.gamesWon = gamesWon
  if (correctAnswers !== undefined) user.stats.correctAnswers = correctAnswers
  if (categoryStats) {
    user.stats.categoryStats = {
      ...user.stats.categoryStats,
      ...categoryStats,
    }
  }

  // Return updated user data
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: user.stats,
      createdAt: user.createdAt,
    },
  })
})

// Aggiorna le prestazioni dell'utente per una categoria specifica
router.post("/update-category-performance", async (req, res) => {
  try {
    const { userId, category, isCorrect } = req.body;

    console.log("Aggiornamento prestazioni per categoria:", { userId, category, isCorrect });

    if (!userId || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "UserId e categoria sono richiesti" 
      });
    }

    // Aggiorna le prestazioni per la categoria
    const result = await userModel.updateCategoryPerformance(userId, category, isCorrect);

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

// Get all users route for avatar and other public info
router.get("/all/public", async (req, res) => {
  try {
    const users = await userModel.readUsers();
    
    // Filter only public information (removing passwords and sensitive data)
    const publicUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(publicUsers);
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    res.status(500).json({ success: false, message: "Errore del server" });
  }
});



module.exports = router

