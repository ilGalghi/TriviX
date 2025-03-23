// game.js - Game routes

const express = require("express")
const router = express.Router()
const { v4: uuidv4 } = require("uuid")

// In-memory game storage (for demo purposes)
// In a real app, you would use a database
const games = []

// In-memory user storage reference
// In a real app, you would import this from a shared module
const users = []

// Create game route
router.post("/create", (req, res) => {
  const { userId } = req.body

  // Validate input
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" })
  }

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // Generate game code
  const gameCode = generateGameCode()

  // Create new game
  const newGame = {
    id: uuidv4(),
    code: gameCode,
    status: "waiting", // waiting, active, completed
    players: [
      {
        id: userId,
        username: user.username,
        score: 0,
        characters: [],
      },
    ],
    currentRound: 0,
    maxRounds: 25,
    currentTurn: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Add game to storage
  games.push(newGame)

  // Return game data
  res.status(201).json({
    game: newGame,
  })
})

// Join game route
router.post("/join", (req, res) => {
  const { userId, gameCode } = req.body

  // Validate input
  if (!userId || !gameCode) {
    return res.status(400).json({ error: "User ID and game code are required" })
  }

  // Find game
  const game = games.find((game) => game.code === gameCode)
  if (!game) {
    return res.status(404).json({ error: "Game not found" })
  }

  // Check if game is already full
  if (game.players.length >= 2) {
    return res.status(400).json({ error: "Game is already full" })
  }

  // Check if user is already in the game
  const existingPlayer = game.players.find((player) => player.id === userId)
  if (existingPlayer) {
    return res.status(400).json({ error: "You are already in this game" })
  }

  // Find user
  const user = users.find((user) => user.id === userId)
  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // Add player to game
  game.players.push({
    id: userId,
    username: user.username,
    score: 0,
    characters: [],
  })

  // Update game status
  game.status = "active"
  game.updatedAt = new Date()

  // Return game data
  res.json({
    game,
  })
})

// Get game route
router.get("/:gameCode", (req, res) => {
  const { gameCode } = req.params

  // Find game
  const game = games.find((game) => game.code === gameCode)
  if (!game) {
    return res.status(404).json({ error: "Game not found" })
  }

  // Return game data
  res.json({
    game,
  })
})

// Get user games route
router.get("/user/:userId", (req, res) => {
  const { userId } = req.params

  // Find games for user
  const userGames = games.filter((game) => {
    return game.players.some((player) => player.id === userId)
  })

  // Return games data
  res.json({
    games: userGames,
  })
})

// Update game route
router.put("/:gameCode", (req, res) => {
  const { gameCode } = req.params
  const { action, userId, data } = req.body

  // Find game
  const game = games.find((game) => game.code === gameCode)
  if (!game) {
    return res.status(404).json({ error: "Game not found" })
  }

  // Handle different actions
  switch (action) {
    case "answer":
      // Update player score
      const player = game.players.find((player) => player.id === userId)
      if (player) {
        if (data.isCorrect) {
          player.score += 1
        }
      }

      // Update game
      game.currentRound += 1

      // Find opponent
      const opponent = game.players.find((player) => player.id !== userId)
      if (opponent) {
        game.currentTurn = opponent.id
      }

      game.updatedAt = new Date()

      // Check if game is completed
      if (game.currentRound >= game.maxRounds) {
        game.status = "completed"

        // Update user stats
        updateUserStats(game)
      }
      break

    case "forfeit":
      // Update game status
      game.status = "completed"
      game.updatedAt = new Date()

      // Update user stats
      updateUserStats(game)
      break

    default:
      return res.status(400).json({ error: "Invalid action" })
  }

  // Return updated game data
  res.json({
    game,
  })
})

// Update user stats based on game results
function updateUserStats(game) {
  if (game.status !== "completed") return

  // Determine winner
  let winner = null
  if (game.players.length === 2) {
    const player1 = game.players[0]
    const player2 = game.players[1]

    if (player1.score > player2.score) {
      winner = player1
    } else if (player2.score > player1.score) {
      winner = player2
    }
  }

  // Update stats for each player
  game.players.forEach((player) => {
    const user = users.find((u) => u.id === player.id)
    if (user) {
      // Initialize stats if needed
      if (!user.stats) {
        user.stats = {
          gamesPlayed: 0,
          gamesWon: 0,
          correctAnswers: 0,
          categoryStats: {},
        }
      }

      // Update stats
      user.stats.gamesPlayed += 1

      if (winner && winner.id === player.id) {
        user.stats.gamesWon += 1
      }

      user.stats.correctAnswers += player.score
    }
  })
}

// Generate a random game code
function generateGameCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

module.exports = router

