// matches.js - Handles functionality for the matches page

// Import necessary functions (assuming they are in auth.js)
import { checkAuth, getCurrentUser, getAuthToken } from "./auth.js"

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const isLoggedIn = checkAuth()

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    window.location.href = "index.html"
    return
  }

  // Load matches
  await loadMatches()
})

// Load matches
async function loadMatches() {
  // Get current user
  const user = getCurrentUser()
  const token = getAuthToken()

  if (!user || !token) {
    alert("You must be logged in to view your matches")
    window.location.href = "index.html"
    return
  }

  try {
    // Fetch user's games from the server
    const response = await fetch(`/api/game/user/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to load matches")
    }

    const matches = data.games || []

    // Split matches into active and completed
    const activeMatches = matches.filter((match) => match.status !== "completed")
    const completedMatches = matches.filter((match) => match.status === "completed")

    // Display active matches
    displayMatches("activeMatchesList", "noActiveMatches", activeMatches)

    // Display completed matches
    displayMatches("completedMatchesList", "noCompletedMatches", completedMatches)
  } catch (error) {
    console.error("Error loading matches:", error)
    alert("Failed to load matches: " + error.message)
  }
}

// Display matches
function displayMatches(listId, noMatchesId, matches) {
  const matchesList = document.getElementById(listId)
  const noMatches = document.getElementById(noMatchesId)

  if (!matchesList) return

  // Clear current content
  matchesList.innerHTML = ""

  if (matches.length === 0) {
    // Show no matches message
    if (noMatches) {
      noMatches.classList.remove("d-none")
    }
    return
  }

  // Hide no matches message
  if (noMatches) {
    noMatches.classList.add("d-none")
  }

  // Add matches to the list
  matches.forEach((match) => {
    const matchElement = createMatchElement(match)
    matchesList.appendChild(matchElement)
  })
}

// Create a match element
function createMatchElement(match) {
  const user = getCurrentUser()
  const player = match.players.find((p) => p.id === user.id)
  const opponent = match.players.find((p) => p.id !== user.id)

  const isUserTurn = match.currentTurn === user.id

  const matchDiv = document.createElement("div")
  matchDiv.className = "match-card"

  let statusText = ""
  let statusClass = ""

  if (match.status === "completed") {
    const userScore = player ? player.score : 0
    const opponentScore = opponent ? opponent.score : 0
    statusText = userScore > opponentScore ? "You won!" : userScore < opponentScore ? "You lost" : "Draw"
    statusClass = "completed"
  } else {
    statusText = isUserTurn ? "Your turn" : "Waiting for opponent"
    statusClass = isUserTurn ? "your-turn" : "waiting"
  }

  const opponentName = opponent ? opponent.username || "Opponent" : "Waiting for opponent"
  const userScore = player ? player.score : 0
  const opponentScore = opponent ? opponent.score : 0

  matchDiv.innerHTML = `
      <div class="match-header">
          <span>Match #${match.id.substring(0, 6)}</span>
          <span>${new Date(match.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="match-players">
          <div class="match-player">
              <span>${user.username}</span>
              <div class="match-score">${userScore}</div>
          </div>
          <div class="match-vs">VS</div>
          <div class="match-player">
              <span>${opponentName}</span>
              <div class="match-score">${opponentScore}</div>
          </div>
      </div>
      <div class="match-footer">
          <span class="match-date">${new Date(match.updatedAt).toLocaleDateString()}</span>
          <span class="match-status ${statusClass}">${statusText}</span>
      </div>
  `

  // Add click event to go to the game
  matchDiv.addEventListener("click", () => {
    window.location.href = `game.html?code=${match.code}`
  })

  return matchDiv
}

