// Game functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) {
    console.error("User not authenticated, redirecting to home page")
    alert("You must be logged in to play the game.")
    window.location.href = "index.html"
    return
  }

  console.log("User authenticated, initializing game")

  // Initialize game
  initGame()

  // Set up event listeners
  setupGameListeners()
})

// Initialize game
function initGame() {
  // Get game code from URL
  const urlParams = new URLSearchParams(window.location.search)
  const gameCode = urlParams.get("code")

  console.log("Game code:", gameCode)

  // Update player info
  updatePlayerInfo()

  // Initialize game state
  // This would typically fetch game data from the server
  // For now, we'll just set up a basic game state
}

// Update player info
function updatePlayerInfo() {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))

    // Update player 1 info (current user)
    const player1Name = document.querySelector("#player1Info .player-name")
    if (player1Name) {
      player1Name.textContent = `@${currentUser.username}`
    }

    const player1Avatar = document.querySelector("#player1Info .player-avatar")
    if (player1Avatar && currentUser.profile && currentUser.profile.avatar) {
      player1Avatar.src = currentUser.profile.avatar
    }

    // Player 2 would typically be fetched from the server
    // For now, we'll just use a placeholder
  } catch (error) {
    console.error("Error updating player info:", error)
  }
}

// Set up game event listeners
function setupGameListeners() {
  // Spin button
  const spinButton = document.getElementById("spinButton")
  if (spinButton) {
    spinButton.addEventListener("click", () => {
      // Simulate spinning the wheel
      spinWheel()
    })
  }

  // Chat button
  const chatButton = document.getElementById("chatButton")
  if (chatButton) {
    chatButton.addEventListener("click", () => {
      // Toggle chat sidebar
      document.getElementById("chatSidebar").classList.toggle("active")
    })
  }

  // Close chat button
  const closeChatButton = document.getElementById("closeChatButton")
  if (closeChatButton) {
    closeChatButton.addEventListener("click", () => {
      // Hide chat sidebar
      document.getElementById("chatSidebar").classList.remove("active")
    })
  }

  // Send message button
  const sendMessageButton = document.getElementById("sendMessageButton")
  if (sendMessageButton) {
    sendMessageButton.addEventListener("click", () => {
      sendChatMessage()
    })
  }

  // Message input enter key
  const messageInput = document.getElementById("messageInput")
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage()
      }
    })
  }

  // Continue button in result section
  const continueButton = document.getElementById("continueButton")
  if (continueButton) {
    continueButton.addEventListener("click", () => {
      // Hide result section and show spinner section
      document.getElementById("resultSection").classList.add("d-none")
      document.getElementById("spinnerSection").classList.remove("d-none")
    })
  }
}

// Spin the wheel
function spinWheel() {
  // Disable spin button
  document.getElementById("spinButton").disabled = true

  // Add spinning animation to wheel
  const wheel = document.getElementById("categoryWheel")
  wheel.classList.add("spinning")

  // Randomly select a category
  const categories = ["science", "entertainment", "sports", "art", "geography", "history"]
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]

  // After a delay, stop spinning and show question
  setTimeout(() => {
    // Remove spinning animation
    wheel.classList.remove("spinning")

    // Show question for selected category
    showQuestion(randomCategory)

    // Enable spin button
    document.getElementById("spinButton").disabled = false
  }, 3000)
}

// Show question for category
function showQuestion(category) {
  // Hide spinner section and show question section
  document.getElementById("spinnerSection").classList.add("d-none")
  document.getElementById("questionSection").classList.remove("d-none")

  // Update question category
  document.getElementById("questionCategory").textContent = category.toUpperCase()

  // This would typically fetch a question from the server
  // For now, we'll just use a placeholder question
  const questions = {
    science: {
      text: "Which type of rock forms in layers, is often found near water, and contains fossils?",
      answers: ["Igneous", "Sedimentary", "Metamorphic", "Granite"],
      correctIndex: 1,
      explanation:
        "Sedimentary rocks form in layers (strata) as sediment is deposited, often in bodies of water, and may contain fossils of plants and animals that were buried in the sediment.",
    },
    entertainment: {
      text: "Which actor played Iron Man in the Marvel Cinematic Universe?",
      answers: ["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"],
      correctIndex: 2,
      explanation: "Robert Downey Jr. played Tony Stark / Iron Man in the Marvel Cinematic Universe from 2008 to 2019.",
    },
    sports: {
      text: "In which sport would you perform a slam dunk?",
      answers: ["Football", "Basketball", "Tennis", "Golf"],
      correctIndex: 1,
      explanation:
        "A slam dunk is a basketball move in which a player jumps high and forcefully puts the ball through the hoop with one or both hands.",
    },
    art: {
      text: "Who painted the Mona Lisa?",
      answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correctIndex: 2,
      explanation: "The Mona Lisa was painted by Leonardo da Vinci between 1503 and 1519.",
    },
    geography: {
      text: "Which is the largest ocean on Earth?",
      answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctIndex: 3,
      explanation:
        "The Pacific Ocean is the largest and deepest ocean on Earth, covering more than 30% of the Earth's surface.",
    },
    history: {
      text: "In which year did World War II end?",
      answers: ["1943", "1945", "1947", "1950"],
      correctIndex: 1,
      explanation: "World War II ended in 1945 with the surrender of Germany in May and Japan in September.",
    },
  }

  // Get question for selected category
  const question = questions[category]

  // Update question text
  document.getElementById("questionText").textContent = question.text

  // Update answers
  const answersContainer = document.getElementById("answersContainer")
  answersContainer.innerHTML = ""

  question.answers.forEach((answer, index) => {
    const answerElement = document.createElement("div")
    answerElement.className = "answer-option"
    answerElement.textContent = answer
    answerElement.dataset.index = index

    answerElement.addEventListener("click", () => {
      // Check if answer is correct
      checkAnswer(index, question.correctIndex, question.explanation)
    })

    answersContainer.appendChild(answerElement)
  })

  // Start timer
  startTimer()
}

// Start timer
function startTimer() {
  let timeLeft = 30
  document.getElementById("timerValue").textContent = timeLeft

  const timer = setInterval(() => {
    timeLeft--
    document.getElementById("timerValue").textContent = timeLeft

    if (timeLeft <= 0) {
      // Time's up
      clearInterval(timer)

      // Show incorrect answer
      showResult(false, "Time's up!")
    }
  }, 1000)

  // Store timer in window object so it can be cleared later
  window.questionTimer = timer
}

// Check answer
function checkAnswer(selectedIndex, correctIndex, explanation) {
  // Clear timer
  clearInterval(window.questionTimer)

  // Check if answer is correct
  const isCorrect = selectedIndex === correctIndex

  // Show result
  showResult(isCorrect, explanation)
}

// Show result
function showResult(isCorrect, explanation) {
  // Hide question section and show result section
  document.getElementById("questionSection").classList.add("d-none")
  document.getElementById("resultSection").classList.remove("d-none")

  // Update result text and icon
  document.getElementById("resultText").textContent = isCorrect ? "Correct!" : "Incorrect!"

  const resultIcon = document.getElementById("resultIcon")
  resultIcon.innerHTML = isCorrect
    ? '<i class="fas fa-check-circle text-success"></i>'
    : '<i class="fas fa-times-circle text-danger"></i>'

  // Update explanation
  document.getElementById("resultExplanation").textContent = explanation
}

// Send chat message
function sendChatMessage() {
  const messageInput = document.getElementById("messageInput")
  const message = messageInput.value.trim()

  if (!message) return

  // Clear input
  messageInput.value = ""

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  // Create message element
  const messageElement = document.createElement("div")
  messageElement.className = "chat-message"
  messageElement.innerHTML = `
    <div class="message-sender">${currentUser.username}</div>
    <div class="message-text">${message}</div>
  `

  // Add message to chat
  document.getElementById("chatMessages").appendChild(messageElement)

  // Scroll to bottom of chat
  document.getElementById("chatMessages").scrollTop = document.getElementById("chatMessages").scrollHeight

  // This would typically send the message to the server
  // For now, we'll just add it to the chat locally
}

