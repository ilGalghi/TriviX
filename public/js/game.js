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

  




  // Fetch match data from server and update it
fetch(`../data/matches.json`)
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json();
})
.then(matchData => {
  if (!Array.isArray(matchData)) {
    throw new Error("Invalid match data format received.");
  }

  console.log("Match data:", matchData);

  // Verifica se gameCode è valido
  if (!gameCode) {
    console.error("Game code is missing.");
    alert("Invalid game code. Redirecting to home page.");
    window.location.href = "index.html";
    return;
  }

  // Trova la partita corrispondente
  const match = matchData.find(m => m.matchCode === gameCode.toString());

  if (!match) {
    console.error("Match not found.");
    alert("Match not found. Redirecting to home page.");
    window.location.href = "index.html";
    return;
  }

  // Assicuriamoci che la proprietà players esista
  if (!match.players) {
    match.players = [];
  }

  // Retrieve current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("No authenticated user found.");
    alert("You must be logged in to join a match.");
    return;
  }

  // Se entrambi gli slot sono occupati, l'utente non può unirsi
  let playerAssigned = false;

  if (match.players.length == 0) {
    match.players[0] = {
      id: currentUser.id,
      username: currentUser.username,
      points: 0,
      categoryPoints: { category1: 0, category2: 0, category3: 0 }
    };
    playerAssigned = true;
  } else if (match.players.length == 1) {
    match.players[1] = {
      id: currentUser.id,
      username: currentUser.username,
      points: 0,
      categoryPoints: { category1: 0, category2: 0, category3: 0 }
    };
    playerAssigned = true;
  }

  // Se entrambi gli slot sono occupati, l'utente non può unirsi
  if (!playerAssigned) {
    if(match.players[0].id != currentUser.id && match.players[1].id != currentUser.id){
      alert("This match has already started with two players. You cannot join.");
    
      window.location.href = "index.html";
    
      return;
    }
  }



  console.log("Dati inviati normalizzati:", JSON.stringify(match, null, 2));

  // Aggiorna il match nel server
  fetch(`/api/games/update/${match.matchCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUser: { id: currentUser.id, username: currentUser.username } })
  })
  .then(response => response.json())
  .then(data => console.log("Match aggiornato con successo:", data))
  .catch(error => console.error("Errore nell'aggiornamento della partita:", error));



  // Update player info
  updatePlayerInfo(gameCode)
})
.catch(error => {
  console.error("Error fetching match data:", error);
});

}

// Update player info
function updatePlayerInfo(gameCode) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      console.error("No authenticated user found.");
      return;
    }
    console.log("trovando " + gameCode);

    // Fetch match data from server
    fetch('../data/matches.json')
      .then(response => response.json())
      .then(matchData => {
        matchData.forEach(m => console.log(`Checking match code: ${m.matchCode} e confronto con ` + gameCode));
        const match = matchData.find(m => m.matchCode === gameCode);
        if (!match) {
          console.error("Match not found.");
          return;
        }else{
          console.log(match);
        }

        // Identify players
        const player1 = match.players[0] || null;
        const player2 = match.players[1] || null;

        console.log("Player 1:", player1);
        console.log("Player 2:", player2);

        // Determine if current user is Player 1 or Player 2
        let currentPlayer = player1;
        let opponentPlayer = player2;

        if (player2 && currentUser && player2.id === currentUser.id) {
          currentPlayer = player2;
          opponentPlayer = player1;
        }

        // Update current player (Player 1 in UI)
        const player1Name = document.querySelector("#player1Info .player-name");
        if (player1Name && currentPlayer) {
          player1Name.textContent = `@${currentPlayer.username || "Waiting..."}`;
        } else if (player1Name) {
          player1Name.textContent = "Waiting for player...";
        }

        const player1Avatar = document.querySelector("#player1Info .player-avatar");
        if (player1Avatar && currentPlayer?.profile?.avatar) {
          player1Avatar.src = currentPlayer.profile.avatar;
        } else if (player1Avatar) {
          player1Avatar.src = "../img/default-avatar.png"; // Avatar di default se non disponibile
        }

        // Update opponent player (Player 2 in UI)
        const player2Name = document.querySelector("#player2Info .player-name");
        if (player2Name && opponentPlayer) {
          player2Name.textContent = `@${opponentPlayer.username || "Waiting..."}`;
        } else if (player2Name) {
          player2Name.textContent = "Waiting for player...";
        }

        const player2Avatar = document.querySelector("#player2Info .player-avatar");
        if (player2Avatar && opponentPlayer?.profile?.avatar) {
          player2Avatar.src = opponentPlayer.profile.avatar;
        } else if (player2Avatar) {
          player2Avatar.src = "../img/default-avatar.png"; // Avatar di default se non disponibile
        }

      })
      .catch(error => {
        console.error("Error fetching match data:", error);
      });

  } catch (error) {
    console.error("Error updating player info:", error);
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

