// user.js - User routes

const express = require("express")
const router = express.Router()

// Import users array from auth routes
const { users } = require("./auth")

// Get user profile route
router.get("/:userId", (req, res) => {
  const { userId } = req.params

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

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
  if (password) user.password = password // In a real app, you would hash the password

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

module.exports = router

