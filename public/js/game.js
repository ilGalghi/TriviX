// Dichiarazione globale del gameState
let gameState = {
  pollingInterval: null
};

// Game functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) {
    console.error("User not authenticated, redirecting to home page")
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

  // Verifica se gameCode è valido
  if (!gameCode) {
    console.error("Game code is missing.");
    alert("Invalid game code. Redirecting to home page.");
    window.location.href = "index.html";
    return;
  }

  // Controlla se è la prima visita a questa partita
  const isFirstVisit = !localStorage.getItem(`visited_game_${gameCode}`);
  
  // Se è la prima visita, resetta i powerup e segna come visitato
  if (isFirstVisit) {
    console.log("Prima visita a questa partita, reset dei powerup");
    if (window.powerupManager) {
      window.powerupManager.resetPowerups();
    }
    localStorage.setItem(`visited_game_${gameCode}`, "true");
  } else {
    console.log("Partita già visitata, mantengo lo stato dei powerup");
    
    // Controlla se c'è una domanda salvata da ripristinare
    if (checkForSavedQuestion()) {
      console.log("Domanda ripristinata con successo");
    }
  }

  // Fetch match data from server and update it
  fetch(`/api/games/match/${gameCode}`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (!data.success || !data.match) {
      throw new Error("Match not found or invalid data format received.");
    }

    const match = data.match;
    console.log("Match data:", match);

    // Assicuriamoci che la proprietà players esista
    if (!match.players) {
      match.players = [];
    }

    // Retrieve current user
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      console.error("No authenticated user found.");
      return;
    }

    // Se entrambi gli slot sono occupati, l'utente non può unirsi
    let playerAssigned = false;
    
    // Verifica se l'utente è già presente nel match
    const isUserAlreadyInMatch = match.players.some(player => player && player.id === currentUser.id);
    console.log("isUserAlreadyInMatch:", isUserAlreadyInMatch);
    
    if (isUserAlreadyInMatch) {
      // L'utente è già nel match, non serve riassegnarlo
      playerAssigned = true;
      console.log("Utente già presente nel match, skip assegnazione");
    } else if (match.players.length === 0) {
      match.players[0] = {
        id: currentUser.id,
        username: currentUser.username,
        points: 0,
        categoryPoints: { category1: 0, category2: 0, category3: 0 }
      };
      playerAssigned = true;
      console.log("Utente assegnato come player 1");
    } else if (match.players.length === 1 && !match.players[0].id) {
      match.players[0] = {
        id: currentUser.id,
        username: currentUser.username,
        points: 0,
        categoryPoints: { category1: 0, category2: 0, category3: 0 }
      };
      playerAssigned = true;
      console.log("Utente assegnato come player 1 (slot 0 vuoto)");
    } else if (match.players.length === 1 && match.players[0].id) {
      match.players[1] = {
        id: currentUser.id,
        username: currentUser.username,
        points: 0,
        categoryPoints: { category1: 0, category2: 0, category3: 0 }
      };
      playerAssigned = true;
      console.log("Utente assegnato come player 2");
    }

    // Se l'utente non è stato assegnato e non è già nel match, non può unirsi
    if (!playerAssigned && !isUserAlreadyInMatch) {
      console.log("Utente non assegnato e non presente nel match, redirect alla home");
      alert("Questa partita ha già due giocatori. Non puoi unirti.");
      window.location.href = "index.html";
      return;
    }

    // Controlla se il turno esiste e se è quello dell'utente corrente
    if (match.currentTurn) {
      const gameStatusElement = document.getElementById("gameStatus");
      
      // Verifica se è il turno dell'utente corrente
      if (match.currentTurn === currentUser.id) {
        // Aggiorna lo stato della partita
        gameStatusElement.textContent = "Your turn!";
        
        // Abilita il pulsante di spin se era disabilitato
        const spinButton = document.getElementById("spinButton");
        if (spinButton) {
          // Disabilita il pulsante se l'utente è il creatore (primo giocatore) e non c'è ancora un avversario
          if (match.players.length < 2 && match.players[0].id === currentUser.id) {
            spinButton.disabled = true;
            gameStatusElement.textContent = "Waiting for other player to join...";
          } else {
            spinButton.disabled = false;
          }
        }
      } else {
        // Non è il turno dell'utente corrente
        gameStatusElement.textContent = "Waiting for opponent's turn";
        
        // Disabilita il pulsante di spin
        const spinButton = document.getElementById("spinButton");
        if (spinButton) {
          console.log("spinButton disabled");
          spinButton.disabled = true;
        }
      }
    } else {
      // Se il turno non è definito, imposta il turno al primo giocatore
      match.currentTurn = match.players[0].id;
      
      // Aggiorna lo stato della partita in base a chi è il primo giocatore
      const gameStatusElement = document.getElementById("gameStatus");
      if (match.currentTurn === currentUser.id) {
        // Controlla se l'utente è il creatore e non c'è ancora un avversario
        if (match.players.length < 2 && match.players[0].id === currentUser.id) {
          gameStatusElement.textContent = "Waiting for opponent to join...";
          const spinButton = document.getElementById("spinButton");
          if (spinButton) {
            spinButton.disabled = true;
          }
        } else {
          gameStatusElement.textContent = "Your turn!";
        }
      } else {
        gameStatusElement.textContent = "Waiting for opponent's turn";
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
    updateGameStateFromMatch(match)
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
    fetch(`/api/games/match/${gameCode}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.match) {
        console.error("Match not found.");
        return;
      }
      
      const match = data.match;
      console.log("Match trovata:", match);

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

      if(currentPlayer && opponentPlayer){
        // Update game state
        updateGameStateFromMatch(match);
        if(match.status == "completed"){
          document.getElementById("spinButton").disabled = true;
          if(currentPlayer.score > opponentPlayer.score){
            document.getElementById("gameStatus").textContent = "You won!";
          }else if(currentPlayer.score < opponentPlayer.score){
            document.getElementById("gameStatus").textContent = "You lost!";
          }else{
            document.getElementById("gameStatus").textContent = "It's a draw!";
          }
        }
      }

      // Update current player (Player 1 in UI)
      const player1Name = document.querySelector("#player1Info .player-name");
      if (player1Name && currentPlayer) {
        player1Name.textContent = `@${currentPlayer.username || "Waiting..."}`;
      } else if (player1Name) {
        player1Name.textContent = "Waiting for player...";
      }

      // Aggiorna il punteggio del giocatore corrente
      const player1Score = document.querySelector("#player1Info .player-score");
      if (player1Score && currentPlayer) {
        player1Score.textContent = currentPlayer.score || 0;
      } else if (player1Score) {
        player1Score.textContent = "0";
      }

      // Update opponent player (Player 2 in UI)
      const player2Name = document.querySelector("#player2Info .player-name");
      if (player2Name && opponentPlayer) {
        player2Name.textContent = `@${opponentPlayer.username || "Waiting..."}`;
      } else if (player2Name) {
        player2Name.textContent = "Waiting for player...";
      }

      // Aggiorna il punteggio dell'avversario
      const player2Score = document.querySelector("#player2Info .player-score");
      if (player2Score && opponentPlayer) {
        player2Score.textContent = opponentPlayer.score || 0;
      } else if (player2Score) {
        player2Score.textContent = "0";
      }

      // Fetch users data to get avatar information
      fetch('/api/users/all/public')
      .then(response => response.json())
      .then(usersData => {
        // Update current player (Player 1 in UI)
        
        console.log("currentPlayer: ", currentPlayer);
        console.log("Tutti gli utenti:", usersData);
        
        const player1Avatar = document.querySelector("#player1Info .player-avatar");
        if (player1Avatar && currentPlayer) {
          // Log per debug
          console.log("Cerco utente con ID:", currentPlayer.id);
          
          // Verifica se l'utente esiste nei dati
          const userData = usersData.find(u => u.id === currentPlayer.id);
          console.log("Utente trovato:", userData);
          
          if (userData && userData.profile && userData.profile.avatar) {
            console.log("Avatar trovato:", userData.profile.avatar.substring(0, 30) + "...");
            player1Avatar.src = userData.profile.avatar;
            console.log("avatar trovato");
          } else {
            player1Avatar.src = "/img/default-avatar.png";
            console.log("avatar non trovato");
          }
        }

        const player2Avatar = document.querySelector("#player2Info .player-avatar");
        if (player2Avatar && opponentPlayer) {
          const userData = usersData.find(u => u.id === opponentPlayer.id);
          console.log("Opponent trovato:", userData ? userData.username : "non trovato");
          
          if (userData && userData.profile && userData.profile.avatar) {
            player2Avatar.src = userData.profile.avatar;
          } else {
            player2Avatar.src = "/img/default-avatar.png";
          }
        }

      })
      .catch(error => {
        console.error("Error fetching users data:", error);
      });

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
  const spinButton = document.getElementById("spinButton");
  if (spinButton) {
    spinButton.addEventListener("click", () => {
      if(spinButton.disabled) {
        alert("Aspetta, è il turno dell'avversario!");
      } else {
        spinWheel();
      }
    });
  }

  // Flag button (surrender)
  const flagButton = document.getElementById("flagButton");
  if (flagButton) {
    flagButton.addEventListener("click", () => {
      // Chiedi conferma prima di arrendersi
      const conferma = confirm("Sei sicuro di volerti arrendere? Perderai automaticamente la partita.");
      if (conferma) {
        surrenderGame();
      }
    });
  }

  // Chat button
  const chatButton = document.getElementById("chatButton");
  if (chatButton) {
    chatButton.addEventListener("click", () => {
      // Toggle chat sidebar
      const chatSidebar = document.getElementById("chatSidebar");
      if (chatSidebar) {
        chatSidebar.classList.toggle("active");
      }
    });
  }

  // Inizializza la chat una sola volta, subito dopo il caricamento della pagina
  if (!window.chatManager) {
    window.chatManager = new ChatManager();
  }

  // Close chat button
  const closeChatButton = document.getElementById("closeChatButton")
  if (closeChatButton) {
    closeChatButton.addEventListener("click", () => {
      // Hide chat sidebar
      const chatSidebar = document.getElementById("chatSidebar")
      if (chatSidebar) {
        chatSidebar.classList.remove("active")
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
      
      // Rimuovi i dati della domanda precedente
      const gameCode = new URLSearchParams(window.location.search).get("code");
      if (gameCode) {
        localStorage.removeItem(`currentQuestion_${gameCode}`);
        localStorage.removeItem(`resultData_${gameCode}`);
        localStorage.removeItem(`timer_${gameCode}`);
        localStorage.setItem(`gamePhase_${gameCode}`, 'spinner');
      }
    })
  }

  // Start polling for opponent's move
  startPollingForOpponentMove();
  
}

// Spin the wheel
function spinWheel() {
  // Disable spin button
  document.getElementById("spinButton").disabled = true

  clearInterval(gameState.pollingInterval);
  // Update game status to show spinning state
  document.getElementById("gameStatus").textContent = "Spinning the wheel...";
  

  // Add spinning animation to wheel
  const wheel = document.getElementById("categoryWheel")
  wheel.classList.add("spinning")

  // Elenco completo di tutte le categorie, incluse quelle in italiano
  const categories = ["science", "entertainment", "sports", "art", "geography", "history"];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]

  // After a delay, stop spinning and show question
  setTimeout(() => {
    // Remove spinning animation
    wheel.classList.remove("spinning")

    // Show question for selected category
    showQuestion(randomCategory)
    startPollingForOpponentMove();
    document.getElementById("gameStatus").textContent = "Your turn!";

    // Enable spin button
    document.getElementById("spinButton").disabled = true
  }, 3000)
}

// Show question for category
function showQuestion(category) {
  // Hide spinner section and show question section
  document.getElementById("spinnerSection").classList.add("d-none")
  document.getElementById("questionSection").classList.remove("d-none")

  // Reset solo del messaggio di stato dei powerup
  const powerupMessage = document.getElementById('powerupMessage');
  if (powerupMessage) {
    powerupMessage.textContent = '';
    powerupMessage.className = 'powerup-message';
  }

  // Update question category
  document.getElementById("questionCategory").textContent = category.toUpperCase()

  // Richiedi la domanda al server
  fetch(`/api/questions/${category}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Errore nel recupero della domanda');
      }
      return response.json();
    })
    .then(question => {
      // Salva la domanda corrente globalmente
      window.currentQuestion = question;

      // Salva la domanda nel localStorage
      saveCurrentQuestion(question, category);

      // Update question text
      document.getElementById("questionText").textContent = question.text;

      // Update answers
      const answersContainer = document.getElementById("answersContainer");
      answersContainer.innerHTML = "";

      question.answers.forEach((answer, index) => {
        const answerElement = document.createElement("div");
        answerElement.className = "answer-option";
        answerElement.textContent = answer;
        answerElement.dataset.index = index;

        answerElement.addEventListener("click", () => {
          // Check if answer is correct
          stopTimer();
          checkAnswer(index, question.correctIndex, question.explanation);
        });

        answersContainer.appendChild(answerElement);
      });

      // Start timer
      startTimer();
    })
    .catch(error => {
      console.error("Errore nel caricamento della domanda:", error);
      document.getElementById("questionText").textContent = "Errore nel caricamento della domanda. Riprova più tardi.";
    });
}

// Start timer
function startTimer(initialTime = 30) {
  let timeLeft = initialTime;
  let timerInterval;
  
  // Funzione per aggiornare il timer
  function updateTimer() {
    document.getElementById("timerValue").textContent = timeLeft;
    
    // Salva lo stato attuale del timer
    const gameCode = new URLSearchParams(window.location.search).get("code");
    if (gameCode) {
      localStorage.setItem(`timer_${gameCode}`, timeLeft.toString());
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showResult(false, "Time's up!");
      
      // Disabilita il pulsante spin fino al turno dell'avversario
      document.getElementById("spinButton").disabled = true;
      
      // Salva il punteggio (0 punti per timeout)
      saveScoreToDatabase(false);
      
      // Passa il turno all'avversario
      switchTurn();
    }
  }

  // Aggiorna il timer iniziale
  updateTimer();

  // Avvia l'intervallo del timer
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
  }, 1000);

  // Salva il timer nell'oggetto window per poterlo gestire globalmente
  window.questionTimer = {
    interval: timerInterval,
    timeLeft: timeLeft,
    updateTime: (newTime) => {
      timeLeft = newTime;
      updateTimer();
    },
    getTimeLeft: () => timeLeft
  };
}

// Funzione per fermare il timer
function stopTimer() {
  if (window.questionTimer && window.questionTimer.interval) {
    clearInterval(window.questionTimer.interval);
    window.questionTimer = null;
  }
}

// Check answer
function checkAnswer(index, correctIndex, explanation) {
  // Verifica se il tempo è scaduto usando il valore corrente del timer
  if (window.questionTimer && window.questionTimer.getTimeLeft() <= 0) {
    showResult(false, "Time's up!");
    return;
  }
  
  // Check if selected option is correct
  const isCorrect = index === correctIndex;
  
  // Update UI to show result
  showResult(isCorrect, explanation || "");
  
  // Ottieni la categoria corrente dalla UI
  const currentCategory = document.getElementById("questionCategory").textContent.toLowerCase();
  
  // Aggiorna le prestazioni dell'utente per categoria
  updateUserCategoryPerformance(currentCategory, isCorrect);
  
  // Update game state and save score to database
  if (isCorrect) {
    // Increment score for current player
    
    // Update score display
    const playerScore = document.querySelector("#player1Info .player-score");
    playerScore.textContent = parseInt(playerScore.textContent) + 1;
  }
  
  // Save score to matches.json (sia per risposte corrette che errate)
  saveScoreToDatabase(isCorrect);
  
  // Disable spin button until opponent's turn is complete
  document.getElementById("spinButton").disabled = true;
  
  // Switch turn to opponent
  switchTurn();
}

// Nuova funzione per aggiornare le prestazioni dell'utente per categoria
function updateUserCategoryPerformance(category, isCorrect) {
  // Ottieni l'utente corrente
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  if (!currentUser) {
    console.error("Utente non autenticato");
    return;
  }
  
  // Prepara i dati da inviare al server
  const performanceData = {
    userId: currentUser.id,
    category: category,
    isCorrect: isCorrect
  };
  
  // Invia la richiesta al server
  fetch('/api/users/update-category-performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(performanceData),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Errore nell\'aggiornamento delle prestazioni');
    }
    return response.json();
  })
  .then(data => {
    console.log('Prestazioni per categoria aggiornate:', data);
  })
  .catch(error => {
    console.error('Errore nell\'aggiornamento delle prestazioni per categoria:', error);
  });
}

// Save score to database
function saveScoreToDatabase(isCorrect) {
  // Get current user and match data
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get("code");
  
  if (!currentUser || !gameCode) {
    console.error("Missing user or game code");
    return;
  }
  
  // Prepare data to send to server
  const scoreData = {
    userId: currentUser.id,
    gameCode: gameCode,
    isCorrect: isCorrect
  };
  
  // Send score update to server
  fetch('/api/games/update-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoreData),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Score updated successfully:', data);
    
    // Update local game state with new match data if returned
    if (data.match) {
      updateGameStateFromMatch(data.match);
    }
  })
  .catch(error => {
    console.error('Error updating score:', error);
  });
}

// Switch turn to opponent
function switchTurn() {
  // Get current user and match data
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get("code");
  
  if (!currentUser || !gameCode) {
    console.error("Missing user or game code");
    return;
  }
  
  // Prepare data to send to server
  const turnData = {
    userId: currentUser.id,
    gameCode: gameCode
  };
  
  // Send turn switch to server
  fetch('/api/games/switch-turn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(turnData),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Turn switched successfully:', data);
    
    if (data.match.status == "completed") {
      // Se la partita è completata, pulisci i dati salvati
      cleanupGameData(gameCode);
    }
    
    if (data.match.status != "completed"){
      document.getElementById("gameStatus").textContent = "Waiting for opponent's turn";
    }
  })
  .catch(error => {
    alert("Other player still not playing, please wait...")
    console.error('Error switching turn:', error);
  });
}

// Pulisce tutti i dati salvati relativi alla partita quando questa termina
function cleanupGameData(gameCode) {
  if (!gameCode) return;
  
  console.log("Partita completata, pulizia dei dati salvati");
  
  // Rimuovi i dati della domanda
  localStorage.removeItem(`currentQuestion_${gameCode}`);
  localStorage.removeItem(`resultData_${gameCode}`);
  localStorage.removeItem(`timer_${gameCode}`);
  localStorage.removeItem(`gamePhase_${gameCode}`);
  
  // Rimuovi il flag di visita della partita per permettere un nuovo inizio in futuro
  localStorage.removeItem(`visited_game_${gameCode}`);
  
  // Pulisci la chat se esiste il manager
  if (window.chatManager) {
    window.chatManager.clearChat();
  }
}

// Start polling for opponent's move
function startPollingForOpponentMove() {
  // Clear any existing polling interval
  gameState.pollingInterval = setInterval(() => {
    checkForOpponentMove();
  }, 2000); // Check every 5 seconds
}

// Check if opponent has made their move
function checkForOpponentMove() {
  // Get current user and match data
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get("code");
  
  if (!currentUser || !gameCode) {
    console.error("Missing user or game code");
    return;
  }
  
  // Fetch current match state
  fetch(`/api/games/match/${gameCode}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // Controlla se c'è un secondo giocatore e aggiorna le sue informazioni
    if (data.match && data.match.players) {
      // Verifica se l'utente è già presente nel match
      
      const opponent = data.match.players.find(player => player && player.id !== currentUser.id);
      const currentPlayer = data.match.players.find(player => player && player.id === currentUser.id);
      
     
      
      // Aggiorniamo lo stato completo della partita, inclusi nomi utente e avatar
      updateGameStateFromMatch(data.match);
      
      // Ottieni l'elemento gameStatus
      const gameStatusElement = document.getElementById("gameStatus");
      
      // Rimuovi eventuali classi precedenti
      gameStatusElement.classList.remove("game-status-win", "game-status-lose");
      
      // Gestione del turno corrente
      if (data.match.currentTurn === currentUser.id) {
        // È il turno dell'utente corrente
        if (data.match.status !== "completed") {
          // Controlla se ci sono due giocatori nella partita
          if (data.match.players.length >= 2) {
            gameStatusElement.textContent = "Your turn!";
            gameStatusElement.className = ""; // Rimuovi tutte le classi
            document.getElementById("spinButton").disabled = false;
          }
        }
      } else {
        // Non è il turno dell'utente corrente
        if (data.match.status !== "completed") {
          gameStatusElement.textContent = "Waiting for opponent's turn...";
          gameStatusElement.className = ""; // Rimuovi tutte le classi
          document.getElementById("spinButton").disabled = true;
        }
      }
      
      // Gestione stato partita completata
      if (data.match.status === "completed") {
        document.getElementById("spinButton").disabled = true;
        
        // Disabilita il pulsante flag quando la partita è completata
        const flagButton = document.getElementById("flagButton");
        if (flagButton) {
          flagButton.disabled = true;
          flagButton.style.opacity = "0.5";
          flagButton.style.cursor = "not-allowed";
        }
        
        if (!opponent) {
          gameStatusElement.textContent = "Partita terminata";
          gameStatusElement.className = ""; // Nessuna classe speciale
        } else if (data.match.surrenderedBy) {
          // Verifica se l'avversario si è arreso
          if (data.match.surrenderedBy !== currentUser.id) {
            gameStatusElement.textContent = "Hai vinto! (L'avversario si è arreso)";
            gameStatusElement.className = "game-status-win";
          } else {
            gameStatusElement.textContent = "Ti sei arreso! Hai perso la partita.";
            gameStatusElement.className = "game-status-lose";
          }
        } else if (currentPlayer.score > opponent.score) {
          gameStatusElement.textContent = "Hai vinto!";
          gameStatusElement.className = "game-status-win";
        } else if (currentPlayer.score < opponent.score) {
          gameStatusElement.textContent = "Hai perso!";
          gameStatusElement.className = "game-status-lose";
        } else {
          gameStatusElement.textContent = "È un pareggio!";
          gameStatusElement.className = "game-status-draw"; // Classe per il pareggio
        }
      }
    }
  })
  .catch(error => {
    console.error('Error checking for opponent move:', error);
  });
}

// Update game state from match data
function updateGameStateFromMatch(match) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Find current player in match
    if (match && match.players) {
      const currentPlayer = match.players.find(player => player && player.id === currentUser.id);
      const opponent = match.players.find(player => player && player.id !== currentUser.id);
      
      // Update player names
      if (currentPlayer) {
        const player1NameElement = document.querySelector("#player1Info .player-name");
        if (player1NameElement) {
          player1NameElement.textContent = `@${currentPlayer.username || "player1"}`;
        }
      }
      
      if (opponent) {
        const player2NameElement = document.querySelector("#player2Info .player-name");
        if (player2NameElement) {
          player2NameElement.textContent = `@${opponent.username || "player2"}`;
        }
      }
      
      // Update scores
      if (currentPlayer) {
        const player1ScoreElement = document.querySelector("#player1Info .player-score");
        if (player1ScoreElement) {
          player1ScoreElement.textContent = currentPlayer.score || 0;
        }
      }
      
      if (opponent) {
        const player2ScoreElement = document.querySelector("#player2Info .player-score");
        if (player2ScoreElement) {
          player2ScoreElement.textContent = opponent.score || 0;
        }
      }
      
      // Get avatars
      fetch('/api/users/all/public')
        .then(response => response.json())
        .then(usersData => {
          console.log("updateGameStateFromMatch - Tutti gli utenti:", usersData.map(u => u.username));
          
          if (currentPlayer) {
            console.log("updateGameStateFromMatch - Cerco ID:", currentPlayer.id);
            const userData = usersData.find(u => u.id === currentPlayer.id);
            console.log("updateGameStateFromMatch - Utente trovato:", userData ? userData.username : "non trovato");
            
            const player1Avatar = document.querySelector("#player1Info .player-avatar");
            if (player1Avatar && userData && userData.profile && userData.profile.avatar) {
              console.log("updateGameStateFromMatch - Avatar trovato per:", userData.username);
              player1Avatar.src = userData.profile.avatar;
            } else if (player1Avatar) {
              console.log("updateGameStateFromMatch - Avatar NON trovato");
              player1Avatar.src = "/img/default-avatar.png";
            }
          }
          
          if (opponent) {
            const userData = usersData.find(u => u.id === opponent.id);
            const player2Avatar = document.querySelector("#player2Info .player-avatar");
            if (player2Avatar && userData && userData.profile && userData.profile.avatar) {
              player2Avatar.src = userData.profile.avatar;
            } else if (player2Avatar) {
              player2Avatar.src = "/img/default-avatar.png";
            }
          }
        })
        .catch(error => {
          console.error("Error fetching users data:", error);
        });
      
      // Update round info
      const roundInfoElement = document.getElementById("roundInfo");
      if (roundInfoElement && match.currentRound !== undefined && match.maxRounds !== undefined) {
        roundInfoElement.textContent = `ROUND ${match.currentRound}/${match.maxRounds}`;
      }
    }
  } catch (error) {
    console.error("Error updating game state:", error);
  }
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
  
  // Salva il risultato nel localStorage
  saveQuestionResult(isCorrect, explanation);
}

// Mostra la domanda precedente se si ricarica la pagina
function checkForSavedQuestion() {
  const gameCode = new URLSearchParams(window.location.search).get("code");
  if (!gameCode) return;

  const savedQuestionData = localStorage.getItem(`currentQuestion_${gameCode}`);
  const savedGamePhase = localStorage.getItem(`gamePhase_${gameCode}`);
  
  if (savedQuestionData && savedGamePhase === 'question') {
    try {
      const questionData = JSON.parse(savedQuestionData);
      console.log("Ripristino domanda salvata:", questionData);
      
      // Nascondi la sezione spinner e mostra la sezione domanda
      document.getElementById("spinnerSection").classList.add("d-none");
      document.getElementById("questionSection").classList.remove("d-none");
      document.getElementById("resultSection").classList.add("d-none");
      
      // Imposta la categoria
      document.getElementById("questionCategory").textContent = questionData.category.toUpperCase();
      
      // Imposta la domanda corrente
      window.currentQuestion = questionData.question;
      
      // Aggiorna il testo della domanda
      document.getElementById("questionText").textContent = questionData.question.text;
      
      // Aggiorna le risposte
      const answersContainer = document.getElementById("answersContainer");
      answersContainer.innerHTML = "";
      
      questionData.question.answers.forEach((answer, index) => {
        const answerElement = document.createElement("div");
        answerElement.className = "answer-option";
        answerElement.textContent = answer;
        answerElement.dataset.index = index;
        
        // Se c'era già una risposta selezionata, marca quella risposta
        if (questionData.selectedIndex !== undefined && questionData.selectedIndex === index) {
          answerElement.classList.add('selected');
        }
        
        // Aggiungi event listener per la selezione
        answerElement.addEventListener("click", () => {
          // Check if answer is correct
          stopTimer();
          checkAnswer(index, questionData.question.correctIndex, questionData.question.explanation);
        });
        
        answersContainer.appendChild(answerElement);
      });
      
      // Ripristina il timer con il tempo rimanente salvato
      const savedTimeLeft = parseInt(localStorage.getItem(`timer_${gameCode}`)) || 30;
      startTimer(savedTimeLeft);
      
      return true;
    } catch (error) {
      console.error("Errore nel ripristino della domanda:", error);
    }
  } else if (savedGamePhase === 'result') {
    // Se l'utente aveva già risposto, mostra il risultato
    try {
      const resultData = JSON.parse(localStorage.getItem(`resultData_${gameCode}`));
      if (resultData) {
        // Nascondi le altre sezioni e mostra la sezione risultato
        document.getElementById("spinnerSection").classList.add("d-none");
        document.getElementById("questionSection").classList.add("d-none");
        document.getElementById("resultSection").classList.remove("d-none");
        
        // Aggiorna il testo e l'icona del risultato
        document.getElementById("resultText").textContent = resultData.isCorrect ? "Correct!" : "Incorrect!";
        const resultIcon = document.getElementById("resultIcon");
        resultIcon.innerHTML = resultData.isCorrect
          ? '<i class="fas fa-check-circle text-success"></i>'
          : '<i class="fas fa-times-circle text-danger"></i>';
        
        // Aggiorna la spiegazione
        document.getElementById("resultExplanation").textContent = resultData.explanation || "";
        
        return true;
      }
    } catch (error) {
      console.error("Errore nel ripristino del risultato:", error);
    }
  }
  
  return false;
}

// Salva lo stato corrente della domanda
function saveCurrentQuestion(question, category) {
  const gameCode = new URLSearchParams(window.location.search).get("code");
  if (!gameCode) return;
  
  const questionData = {
    question: question,
    category: category
  };
  
  localStorage.setItem(`currentQuestion_${gameCode}`, JSON.stringify(questionData));
  localStorage.setItem(`gamePhase_${gameCode}`, 'question');
}

// Salva il risultato della risposta
function saveQuestionResult(isCorrect, explanation) {
  const gameCode = new URLSearchParams(window.location.search).get("code");
  if (!gameCode) return;
  
  const resultData = {
    isCorrect: isCorrect,
    explanation: explanation
  };
  
  localStorage.setItem(`resultData_${gameCode}`, JSON.stringify(resultData));
  localStorage.setItem(`gamePhase_${gameCode}`, 'result');
}

// Funzione per arrendersi durante la partita
function surrenderGame() {
  // Get current user and match data
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get("code");
  
  if (!currentUser || !gameCode) {
    console.error("Missing user or game code");
    return;
  }
  
  // Prepare data to send to server
  const surrenderData = {
    userId: currentUser.id,
    gameCode: gameCode,
    surrender: true
  };
  
  // Send surrender request to server
  fetch('/api/games/surrender', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(surrenderData),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Surrender processed successfully:', data);
    
    // Update UI to show surrender
    const gameStatusElement = document.getElementById("gameStatus");
    gameStatusElement.textContent = "Ti sei arreso! Hai perso la partita.";
    gameStatusElement.className = "game-status-lose";
    
    // Disabilita i pulsanti di gioco
    document.getElementById("spinButton").disabled = true;
    
    // Disabilita il pulsante flag
    const flagButton = document.getElementById("flagButton");
    if (flagButton) {
      flagButton.disabled = true;
      flagButton.style.opacity = "0.5";
      flagButton.style.cursor = "not-allowed";
    }
    
    // Se la partita è completata, pulisci i dati salvati
    if (data.match && data.match.status === "completed") {
      cleanupGameData(gameCode);
    }
    
    // Notifica l'utente
    alert("Ti sei arreso. Hai perso la partita.");
  })
  .catch(error => {
    console.error('Error processing surrender:', error);
    alert("Si è verificato un errore durante l'elaborazione della resa. Riprova.");
  });
}