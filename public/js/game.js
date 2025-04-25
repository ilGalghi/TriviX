// Dichiarazione globale del gameState
let gameState = {
  pollingInterval: null,
  lastOpponentScore: 0, // Aggiungo tracciamento del punteggio dell'avversario
  currentUser: null
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
  
  // Salvo l'utente corrente nel gameState
  gameState.currentUser = JSON.parse(currentUser);

  // Initialize game
  initGame()

  // Set up event listeners
  setupGameListeners()
  
  // Setup focus/blur detection
  setupFocusDetection()
})

// Funzione per rilevare quando l'utente lascia la pagina
function setupFocusDetection() {
  // Crea un div per il messaggio di avviso
  const warningElement = document.createElement('div');
  warningElement.id = 'focus-warning';
  warningElement.className = 'focus-warning';
  warningElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> You left the page, don\'t cheat!';
  warningElement.style.display = 'none';
  document.body.appendChild(warningElement);
  
  // Aggiungi event listeners per visibilitychange e blur
  document.addEventListener('visibilitychange', () => {
    const questionSectionVisible = !document.getElementById("questionSection").classList.contains("d-none");
    
    // Mostra avviso solo se l'utente sta rispondendo a una domanda
    if (document.visibilityState === 'hidden' && questionSectionVisible) {
      warningElement.style.display = 'block';
    } else {
      warningElement.style.display = 'none';
    }
  });
  
  // Evento per la perdita di focus della finestra
  window.addEventListener('blur', () => {
    const questionSectionVisible = !document.getElementById("questionSection").classList.contains("d-none");
    
    // Mostra avviso solo se l'utente sta rispondendo a una domanda
    if (questionSectionVisible) {
      warningElement.style.display = 'block';
    }
  });
  
  // Evento per il ritorno del focus alla finestra
  window.addEventListener('focus', () => {
    warningElement.style.display = 'none';
  });
}

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
  
  // Se è la prima visita, resetta i powerup e gli indici usati e segna come visitato
  if (isFirstVisit) {
    console.log("Prima visita a questa partita, reset dei powerup e degli indici usati");
    if (window.powerupManager) {
      window.powerupManager.resetPowerups();
    }
    
    // Pulisci gli indici usati per tutte le categorie
    const categories = ["science", "entertainment", "sports", "art", "geography", "history"];
    categories.forEach(category => {
      localStorage.removeItem(`usedIndices_${category}`);
      console.log(`Reset indici usati per la categoria: ${category}`);
    });
    
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
        alert("Wait, it's your opponent's turn!");
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
      const conferma = confirm("Are you sure you want to surrender? You will automatically lose the match.");
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
  
  // Elenco completo di tutte le categorie, incluse quelle in italiano
  const categories = ["science", "entertainment", "sports", "art", "geography", "history"];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]

  // Calcola l'angolo di rotazione in base alla categoria
  const categoryAngles = {
    'science': 30,        // Rotazione 0° come definito in CSS
    'entertainment': 90,  // Rotazione 60° come definito in CSS
    'sports': 150,       // Rotazione 120° come definito in CSS
    'art': 210,         // Rotazione 180° come definito in CSS
    'geography': 270,    // Rotazione 240° come definito in CSS
    'history': 330      // Rotazione 300° come definito in CSS
  };

  // Calcola rotazioni complete (2 giri completi) più l'angolo della categoria
  const rotations = 2 * 360; // 2 giri completi
  let finalAngle = rotations + (360 - categoryAngles[randomCategory]); // Invertiamo l'angolo per la rotazione corretta
  
  // Applica la rotazione con CSS - uso una curva di decelerazione più uniforme
  wheel.style.transition = 'transform 2s cubic-bezier(0.2, 0, 0.1, 1)';
  wheel.style.transform = `rotate(${finalAngle}deg)`;

  // After a delay, stop spinning and show question
  setTimeout(() => {
    // Remove spinning animation
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${360 - categoryAngles[randomCategory]}deg)`;
    
    // Aggiungi l'animazione all'indicatore
    const indicator = document.querySelector('.wheel-indicator');
    indicator.classList.add('pulse');
    
    // Rimuovi la classe dopo l'animazione
    setTimeout(() => {
      indicator.classList.remove('pulse');
    }, 1500);
  }, 2000);

  setTimeout(() => {
    console.log("categoria: ", randomCategory);
    console.log("angolo finale: ", 360 - categoryAngles[randomCategory]);
    showQuestion(randomCategory);
    startPollingForOpponentMove();
    document.getElementById("gameStatus").textContent = "Your turn!";
    document.getElementById("spinButton").disabled = true;

    // Reset istantaneo dello spinner
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
  }, 3000);
}

// Funzione per ottenere gli indici usati per una categoria
function getUsedIndices(category) {
  const storedIndices = localStorage.getItem(`usedIndices_${category}`);
  
  console.log(category + ", indici gia usati:", storedIndices);
  return storedIndices ? JSON.parse(storedIndices) : [];
}

// Funzione per salvare un nuovo indice usato
function saveUsedIndex(category, index) {
  const usedIndices = getUsedIndices(category);
  if (!usedIndices.includes(index)) {
    usedIndices.push(index);
    localStorage.setItem(`usedIndices_${category}`, JSON.stringify(usedIndices));
  }
}

// Show question for category
function showQuestion(category) {
  // Hide spinner section and show question section
  document.getElementById("spinnerSection").classList.add("d-none")
  document.getElementById("questionSection").classList.remove("d-none")
  
  // Aggiorna il testo della categoria
  document.getElementById("questionCategory").textContent = category.toUpperCase();
  
  // Imposta il colore dell'header della categoria in base alla categoria
  const categoryColors = {
    'science': 'var(--science-color)',      // Colore per scienza
    'entertainment': 'var(--entertainment-color)',  // Colore per intrattenimento
    'sports': 'var(--sports-color)',        // Colore per sport
    'art': 'var(--art-color)',          // Colore per arte
    'geography': 'var(--geography-color)',     // Colore per geografia
    'history': 'var(--history-color)'       // Colore per storia
  };
  
  // Applica il colore corrispondente alla categoria
  const questionCategory = document.getElementById("questionCategory");
  questionCategory.style.backgroundColor = categoryColors[category] || '#343a40';

  // Reset solo del messaggio di stato dei powerup
  const powerupMessage = document.getElementById('powerupMessage');
  if (powerupMessage) {
    powerupMessage.textContent = '';
    powerupMessage.className = 'powerup-message';
  }

  // Ottieni gli indici già usati dal localStorage
  const usedIndices = getUsedIndices(category);

  // Richiedi la domanda al server con gli indici già usati
  fetch(`/api/questions/${category}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usedIndices: usedIndices
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Errore nel recupero della domanda');
      }
      return response.json();
    })
    .then(data => {
      console.log("Indice ricevuto:", data.index);
      // Salva la domanda corrente globalmente
      window.currentQuestion = data.question;

      // Salva il nuovo indice nel localStorage
      saveUsedIndex(category, data.index);

      // Salva la domanda nel localStorage
      saveCurrentQuestion(data.question, category);

      // Update question text
      document.getElementById("questionText").textContent = data.question.text;
      
      // Gestisci l'immagine della domanda
      const questionCard = document.querySelector('.question-card');
      // Rimuovi eventuali immagini precedenti
      const oldImg = questionCard.querySelector('.question-image');
      if (oldImg) {
        oldImg.remove();
      }
      
      // Se la domanda ha un'immagine, visualizzala
      if (data.question.hasImage && data.question.imageUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = data.question.imageUrl;
        imgElement.alt = 'Question image';
        imgElement.className = 'question-image';
        // Inserisci l'immagine dopo il testo della domanda
        const questionText = document.getElementById("questionText");
        questionText.parentNode.insertBefore(imgElement, questionText.nextSibling);
      }

      // Update answers
      const answersContainer = document.getElementById("answersContainer");
      answersContainer.innerHTML = "";

      data.question.answers.forEach((answer, index) => {
        const answerElement = document.createElement("div");
        answerElement.className = "answer-option";
        answerElement.textContent = answer;
        answerElement.dataset.index = index;

        answerElement.addEventListener("click", () => {
          // Check if answer is correct
          stopTimer();
          checkAnswer(index, data.question.correctIndex, data.question.explanation);
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
    
    // Mostra l'animazione "+1"
    showPointAnimation(playerScore);
  }
  
  // Save score to matches.json (sia per risposte corrette che errate)
  saveScoreToDatabase(isCorrect);
  
  // Disable spin button until opponent's turn is complete
  document.getElementById("spinButton").disabled = true;
  
  // Switch turn to opponent
  switchTurn();
}

// Funzione per mostrare l'animazione "+1" quando si guadagna un punto
function showPointAnimation(targetElement) {
  // Crea un elemento per l'animazione
  const pointAnimation = document.createElement('div');
  pointAnimation.textContent = '+1';
  pointAnimation.className = 'point-animation';
  
  // Posiziona l'animazione vicino al punteggio
  const rect = targetElement.getBoundingClientRect();
  pointAnimation.style.position = 'absolute';
  pointAnimation.style.left = `${rect.left + rect.width/2}px`;
  pointAnimation.style.top = `${rect.top}px`;
  
  // Aggiungi l'elemento al body
  document.body.appendChild(pointAnimation);
  
  // Rimuovi l'elemento dopo che l'animazione è completata
  setTimeout(() => {
    document.body.removeChild(pointAnimation);
  }, 1500);
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
  
  // Pulisci gli indici usati per tutte le categorie
  const categories = ["science", "entertainment", "sports", "art", "geography", "history"];
  categories.forEach(category => {
    localStorage.removeItem(`usedIndices_${category}`);
  });
  
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
      
      // Verifica se l'avversario si è arreso mentre l'utente stava rispondendo a una domanda
      if (data.match.surrenderedBy && data.match.surrenderedBy !== currentUser.id) {
        // L'avversario si è arreso
        
        // Verifica se l'utente sta rispondendo a una domanda
        const questionSectionVisible = !document.getElementById("questionSection").classList.contains("d-none");
        
        if (questionSectionVisible) {
          // Interrompi il timer se attivo
          stopTimer();
          
          // Nascondi sezione domanda e risultato, mostra sezione spinner
          document.getElementById("questionSection").classList.add("d-none");
          document.getElementById("resultSection").classList.add("d-none");
          document.getElementById("spinnerSection").classList.remove("d-none");
          
          // Mostra messaggio che l'avversario si è arreso
          const gameStatusElement = document.getElementById("gameStatus");
          gameStatusElement.textContent = "Your opponent surrendered! You won the match.";
          gameStatusElement.className = "game-status-win";
          
          // Disabilita pulsante spin
          document.getElementById("spinButton").disabled = true;
          
          // Disabilita pulsante bandiera
          const flagButton = document.getElementById("flagButton");
          if (flagButton) {
            flagButton.disabled = true;
            flagButton.style.opacity = "0.5";
            flagButton.style.cursor = "not-allowed";
          }
          
          // Pulisci i dati della domanda
          localStorage.removeItem(`currentQuestion_${gameCode}`);
          localStorage.removeItem(`resultData_${gameCode}`);
          localStorage.removeItem(`timer_${gameCode}`);
          localStorage.setItem(`gamePhase_${gameCode}`, 'spinner');
          
          // Notifica all'utente
          alert("Your opponent surrendered! You won the match.");
        }
      }
      
      // Controlla se l'avversario ha guadagnato punti
      if (opponent && opponent.score !== undefined) {
        const opponentScore = opponent.score;
        
        // Aggiorna il punteggio dell'avversario nell'UI
        const player2ScoreElement = document.querySelector("#player2Info .player-score");
        if (player2ScoreElement) {
          // Se il punteggio è aumentato, mostra l'animazione +1
          if (opponentScore > gameState.lastOpponentScore) {
            player2ScoreElement.textContent = opponentScore;
            // Mostra l'animazione "+1" sul punteggio dell'avversario
            showPointAnimation(player2ScoreElement);
          } else {
            player2ScoreElement.textContent = opponentScore;
          }
          
          // Aggiorna il punteggio salvato
          gameState.lastOpponentScore = opponentScore;
        }
      }
      
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
          gameStatusElement.textContent = "Match ended";
          gameStatusElement.className = ""; // No special class
        } else if (data.match.surrenderedBy) {
          // Check if the opponent surrendered
          if (data.match.surrenderedBy !== currentUser.id) {
            gameStatusElement.textContent = "You won! (The opponent surrendered)";
            gameStatusElement.className = "game-status-win";
          } else {
            gameStatusElement.textContent = "You surrendered! You lost the match.";
            gameStatusElement.className = "game-status-lose";
          }
        } else if (currentPlayer.score > opponent.score) {
          gameStatusElement.textContent = "You won!";
          gameStatusElement.className = "game-status-win";
        } else if (currentPlayer.score < opponent.score) {
          gameStatusElement.textContent = "You lost!";
          gameStatusElement.className = "game-status-lose";
        } else {
          gameStatusElement.textContent = "It's a draw!";
          gameStatusElement.className = "game-status-draw"; // Class for draw
        }
        

        // Aggiorna le statistiche dell'utente
        if (!data.match.statsUpdated) {
          fetch('/api/games/update-stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUser.id,
              gameCode: gameCode
            }),
            credentials: 'include'
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Errore nell\'aggiornamento delle statistiche');
            }
            return response.json();
          })
          .then(data => {
         
            // Aggiorna i dati dell'utente nel localStorage
            const updatedUser = JSON.parse(localStorage.getItem("currentUser"));
            if (updatedUser && data.user) {
              updatedUser.profile = data.user.profile;
              localStorage.setItem("currentUser", JSON.stringify(updatedUser));
            }
          })
          .catch(error => {
            console.error('Errore nell\'aggiornamento delle statistiche:', error);
          });
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
        
        // Salviamo il punteggio dell'avversario per il confronto futuro
        if (opponent.score !== undefined) {
          gameState.lastOpponentScore = opponent.score;
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

      if (match.status === 'completed') {
        // Assicuriamoci che i dati dei giocatori siano completi
        const player1 = {
          name: match.players[0]?.username || "Player 1",
          score: match.players[0]?.score || 0
        };
        const player2 = {
          name: match.players[1]?.username || "Player 2",
          score: match.players[1]?.score || 0
        };

        // Determiniamo il risultato
        let result;
        if (match.surrenderedBy) {
          result = match.surrenderedBy === currentUser.id ? 'lose' : 'win';
        } else if (match.players[0].score > match.players[1].score) {
          result = currentUser.id === match.players[0].id ? 'win' : 'lose';
        } else if (match.players[0].score < match.players[1].score) {
          result = currentUser.id === match.players[1].id ? 'win' : 'lose';
        } else {
          result = 'draw';
        }

        // Mostriamo il modale solo se non è già visibile
        const existingModal = document.querySelector('#gameResultModal.show');
        if (!existingModal) {
          showGameResultModal(result, player1, player2);
        }
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
      
      // Imposta il colore dell'header della categoria in base alla categoria salvata
      const categoryColors = {
        'science': 'var(--science-color)',      // Colore per scienza
        'entertainment': 'var(--entertainment-color)',  // Colore per intrattenimento
        'sports': 'var(--sports-color)',        // Colore per sport
        'art': 'var(--art-color)',          // Colore per arte
        'geography': 'var(--geography-color)',     // Colore per geografia
        'history': 'var(--history-color)'       // Colore per storia
      };
      
      // Applica il colore corrispondente alla categoria
      const questionCategory = document.getElementById("questionCategory");
      questionCategory.style.backgroundColor = categoryColors[questionData.category] || '#343a40';
      
      // Imposta la domanda corrente
      window.currentQuestion = questionData.question;
      
      // Aggiorna il testo della domanda
      document.getElementById("questionText").textContent = questionData.question.text;
      
      // Gestisci l'immagine della domanda
      const questionCard = document.querySelector('.question-card');
      // Rimuovi eventuali immagini precedenti
      const oldImg = questionCard.querySelector('.question-image');
      if (oldImg) {
        oldImg.remove();
      }
      
      // Se la domanda ha un'immagine, visualizzala
      if (questionData.question.hasImage && questionData.question.imageUrl) {
        const imgElement = document.createElement('img');
        imgElement.src = questionData.question.imageUrl;
        imgElement.alt = 'Question image';
        imgElement.className = 'question-image';
        // Inserisci l'immagine dopo il testo della domanda
        const questionText = document.getElementById("questionText");
        questionText.parentNode.insertBefore(imgElement, questionText.nextSibling);
      }
      
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
    gameStatusElement.textContent = "You surrendered! You lost the match.";
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
    //alert("Ti sei arreso. Hai perso la partita.");
  })
  .catch(error => {
    console.error('Error processing surrender:', error);
    alert("An error occurred while processing the surrender. Please try again.");
  });
}

function showGameResultModal(result, player1, player2) {
  const modal = new bootstrap.Modal(document.getElementById('gameResultModal'));
  const resultTitle = document.getElementById('resultTitle');
  const resultMessage = document.getElementById('resultMessage');
  const player1ResultName = document.getElementById('player1ResultName');
  const player1ResultScore = document.getElementById('player1ResultScore');
  const player1ResultRank = document.getElementById('player1ResultRank');
  const player2ResultName = document.getElementById('player2ResultName');
  const player2ResultScore = document.getElementById('player2ResultScore');
  const player2ResultRank = document.getElementById('player2ResultRank');
  const newMatchBtn = document.getElementById('newMatchBtn');
  const rematchBtn = document.getElementById('rematchBtn');
  const rematchNotification = document.getElementById('rematchNotification');
  const rematchStatus = document.getElementById('rematchStatus');
  const trophyIcon = document.querySelector('#gameResultModal .trophy-icon');

  // Reset dello stato del modale
  if (rematchNotification) rematchNotification.style.display = 'none';
  if (rematchStatus) rematchStatus.style.display = 'none';
  if (rematchBtn) {
    rematchBtn.disabled = false;
    rematchBtn.textContent = 'Rematch';
    rematchBtn.style.opacity = "1";
  }

  // Imposta i punteggi
  player1ResultName.textContent = player1.name;
  player1ResultScore.textContent = player1.score;
  player2ResultName.textContent = player2.name;
  player2ResultScore.textContent = player2.score;

  // Recupera la classifica globale per mostrare le posizioni
  fetch('/api/users/all/public')
    .then(response => response.json())
    .then(users => {
      // Ordina gli utenti per punti in ordine decrescente
      const sortedUsers = users.sort((a, b) => {
        return (b.profile?.stats?.points || 0) - (a.profile?.stats?.points || 0);
      });

      // Trova la posizione di ciascun giocatore
      const player1Index = sortedUsers.findIndex(user => user.username === player1.name);
      const player2Index = sortedUsers.findIndex(user => user.username === player2.name);

      // Utilizza la stessa logica della leaderboard per il formato delle posizioni
      function formatRankPosition(index) {
        if (index === 0) {
          // Primo posto (oro)
          return `<span class="position-relative text-warning">
                    <i class="fas fa-medal fa-lg"></i> 1°
                  </span>`;
        } else if (index === 1) {
          // Secondo posto (argento)
          return `<span class="position-relative text-secondary">
                    <i class="fas fa-medal fa-lg"></i> 2°
                  </span>`;
        } else if (index === 2) {
          // Terzo posto (bronzo)
          return `<span class="position-relative text-bronze">
                    <i class="fas fa-medal fa-lg"></i> 3°
                  </span>`;
        } else {
          // Posizioni successive
          return `<span>${index + 1}°</span>`;
        }
      }

      // Imposta le posizioni in classifica
      if (player1Index !== -1) {
        player1ResultRank.innerHTML = formatRankPosition(player1Index);
      } else {
        player1ResultRank.textContent = "N/A";
      }

      if (player2Index !== -1) {
        player2ResultRank.innerHTML = formatRankPosition(player2Index);
      } else {
        player2ResultRank.textContent = "N/A";
      }
    })
    .catch(error => {
      console.error('Errore nel recupero della classifica:', error);
      player1ResultRank.textContent = "N/A";
      player2ResultRank.textContent = "N/A";
    });

  // Imposta il titolo e il messaggio in base al risultato
  if (result === 'win') {
    resultTitle.textContent = 'You won!';
    resultTitle.className = 'game-status-win';
    resultMessage.textContent = 'Congratulations! You proved to be a true TriviX champion!';
    // Assicurati che il trofeo sia dorato per i vincitori
    if (trophyIcon) {
      trophyIcon.classList.remove('trophy-loser');
    }
  } else if (result === 'lose') {
    resultTitle.textContent = 'You lost';
    resultTitle.className = 'game-status-lose';
    resultMessage.textContent = 'Don\'t worry! You can always improve and challenge your opponent again.';
    // Applica lo stile del trofeo grigio per i perdenti
    if (trophyIcon) {
      trophyIcon.classList.add('trophy-loser');
    }
  } else {
    resultTitle.textContent = 'Draw!';
    resultTitle.className = 'game-status-draw';
    resultMessage.textContent = 'What an exciting match! You were truly equal.';
    // Per i pareggi, usa il trofeo dorato
    if (trophyIcon) {
      trophyIcon.classList.remove('trophy-loser');
    }
  }

  // Aggiungi l'event listener per il pulsante "Nuova Partita"
  newMatchBtn.onclick = function() {
    // Ottieni l'utente corrente
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      console.error("Utente non autenticato");
      return;
    }
    
    // Ottieni il codice della partita corrente
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get("code");
    
    // Se era stata richiesta una rivincita da qualcuno, invia una richiesta per declinare
    fetch('/api/games/decline-rematch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        gameCode: gameCode
      })
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Errore nel declinare la rivincita:', error);
    })
    .finally(() => {
      // Cancella l'intervallo di controllo se esiste
      if (window.rematchCheckIntervalId) {
        clearInterval(window.rematchCheckIntervalId);
      }
      modal.hide();
      window.location.href = 'index.html';
    });
  };

  // Aggiungi l'event listener per il pulsante "Rivincita"
  rematchBtn.onclick = function() {
    createRematch();
  };

  // Mostra il modale
  modal.show();
  
  // Avvia subito il check per vedere se l'avversario ha già richiesto una rivincita
  const urlParams = new URLSearchParams(window.location.search);
  const gameCode = urlParams.get("code");
  if (gameCode) {
    // Ottieni l'utente corrente
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
      console.error("Utente non autenticato");
      return;
    }
    
    // Controlla una volta sola all'inizio
    fetch(`/api/games/check-rematch/${gameCode}?userId=${currentUser.id}`)
    .then(response => response.json())
    .then(data => {
      if (data.opponentRequested && !data.currentUserRequested) {
        // L'avversario ha già richiesto una rivincita
        if (rematchNotification) {
          rematchNotification.textContent = 'Your opponent wants to play again!';
          rematchNotification.style.display = 'block';
        }
      }
    })
    .catch(error => {
      console.error('Errore nel controllo iniziale della rivincita:', error);
    });
    
    // Avvia il polling per controlli continui
    checkRematchStatus(gameCode);
  }
}

// Funzione per creare una rivincita con gli stessi giocatori
function createRematch() {
  // Ottieni il codice della partita corrente
  const urlParams = new URLSearchParams(window.location.search);
  const currentGameCode = urlParams.get("code");
  
  // Ottieni il currentUser
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    alert('User not authenticated. Please log in.');
    window.location.href = 'index.html';
    return;
  }
  
  // Disabilita il pulsante di rivincita per evitare clic multipli
  const rematchBtn = document.getElementById('rematchBtn');
  if (rematchBtn) {
    rematchBtn.disabled = true;
    rematchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Waiting...';
  }
  
  // Prima controlla se l'avversario ha abbandonato dopo aver richiesto una rivincita
  fetch(`/api/games/check-rematch/${currentGameCode}?userId=${currentUser.id}`)
  .then(response => {
    if (!response.ok) {
      throw new Error('Errore nel controllo dello stato della rivincita');
    }
    return response.json();
  })
  .then(checkData => {
    // Se l'avversario ha abbandonato dopo aver richiesto una rivincita, mostra un messaggio
    if (checkData.playerAbandoned) {
      // Mostra un messaggio
      const rematchStatus = document.getElementById('rematchStatus');
      if (rematchStatus) {
        rematchStatus.textContent = 'Your opponent has abandoned the game.';
        rematchStatus.style.display = 'block';
        rematchStatus.className = 'alert alert-warning mb-2';
      }
      
      // Disabilita il pulsante rivincita
      if (rematchBtn) {
        rematchBtn.disabled = true;
        rematchBtn.innerHTML = 'Rematch';
        rematchBtn.style.opacity = "0.5";
      }
      return Promise.reject(new Error('L\'avversario ha abbandonato'));
    }
    
    // Se non c'è stato abbandono, procedi con la richiesta di rivincita
    return fetch('/api/games/request-rematch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        gameCode: currentGameCode
      })
    });
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Errore nella richiesta di rivincita');
    }
    return response.json();
  })
  .then(data => {
    console.log('Risposta API rivincita:', data);
    
    // Controlla se entrambi i giocatori hanno richiesto la rivincita
    if (data.bothPlayersRequested && data.newGameCode) {
      // Entrambi i giocatori hanno richiesto la rivincita, reindirizza alla nuova partita
      const rematchStatus = document.getElementById('rematchStatus');
      if (rematchStatus) {
        rematchStatus.textContent = 'Both players have accepted! Redirecting...';
        rematchStatus.style.display = 'block';
      }
      
      // Breve ritardo per mostrare il messaggio
      setTimeout(() => {
        // Cancella l'intervallo di controllo se esiste
        if (window.rematchCheckIntervalId) {
          clearInterval(window.rematchCheckIntervalId);
        }
        
        // Reindirizza alla nuova partita
        window.location.href = `game.html?code=${data.newGameCode}`;
      }, 1500);
    } else {
      // Solo questo giocatore ha richiesto la rivincita, mostra un messaggio
      const rematchStatus = document.getElementById('rematchStatus');
      if (rematchStatus) {
        rematchStatus.textContent = 'Rematch request sent, waiting for opponent...';
        rematchStatus.style.display = 'block';
      }
      
      // Inizia a controllare periodicamente se l'altro giocatore ha accettato
      checkRematchStatus(currentGameCode);
    }
  })
  .catch(error => {
    console.error('Errore nella richiesta di rivincita:', error);
    
    // Se non è l'errore dell'avversario che ha abbandonato (già gestito sopra)
    if (error.message !== 'L\'avversario ha abbandonato') {
      // Riabilita il pulsante di rivincita
      if (rematchBtn) {
        rematchBtn.disabled = false;
        rematchBtn.innerHTML = 'Rematch';
        rematchBtn.style.opacity = "1";
      }
      
      // Mostra un messaggio di errore
      alert('An error occurred while requesting a rematch: ' + error.message);
    }
  });
}

// Funzione per controllare periodicamente lo stato della richiesta di rivincita
function checkRematchStatus(gameCode) {
  // Ottieni l'utente corrente
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("Utente non autenticato");
    return;
  }

  const rematchCheckInterval = setInterval(() => {
    fetch(`/api/games/check-rematch/${gameCode}?userId=${currentUser.id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Errore nel controllo dello stato della rivincita');
      }
      return response.json();
    })
    .then(data => {
      console.log('Stato rivincita:', data);
      
      // Se c'è un nuovo codice partita e entrambi i giocatori hanno richiesto la rivincita
      if (data.bothPlayersRequested && data.newGameCode) {
        // Entrambi i giocatori hanno richiesto la rivincita, interrompi il polling
        clearInterval(rematchCheckInterval);
        
        // Mostra un messaggio
        const rematchStatus = document.getElementById('rematchStatus');
        if (rematchStatus) {
          rematchStatus.textContent = 'Your opponent has also accepted! Redirecting...';
          rematchStatus.style.display = 'block';
        }
        
        // Breve ritardo per mostrare il messaggio
        setTimeout(() => {
          // Reindirizza alla nuova partita
          window.location.href = `game.html?code=${data.newGameCode}`;
        }, 1500);
      }
      
      // Controlla se l'avversario ha rifiutato la rivincita o ha abbandonato dopo averla richiesta
      if ((data.rematchDeclinedByOpponent && data.currentUserRequested) || data.playerAbandoned) {
        // L'avversario ha declinato la rivincita o ha abbandonato
        clearInterval(rematchCheckInterval);
        
        // Mostra un messaggio appropriato
        const rematchStatus = document.getElementById('rematchStatus');
        if (rematchStatus) {
          if (data.playerAbandoned) {
            rematchStatus.textContent = 'Your opponent has abandoned the game.';
          } else {
            rematchStatus.textContent = 'Your opponent doesn\'t want to play now.';
          }
          rematchStatus.style.display = 'block';
          rematchStatus.className = 'alert alert-warning mb-2';
        }
        
        // Disabilita il pulsante rivincita e rimuovi l'icona di caricamento
        const rematchBtn = document.getElementById('rematchBtn');
        if (rematchBtn) {
          rematchBtn.disabled = true;
          rematchBtn.style.opacity = "0.5";
          rematchBtn.innerHTML = 'Rematch'; // Rimuove l'icona di caricamento e ripristina il testo statico
        }
      }
      
      // Controlla se c'è una richiesta dall'altro giocatore
      if (data.opponentRequested && !data.currentUserRequested && !data.playerAbandoned) {
        // L'avversario ha richiesto la rivincita ma l'utente corrente no, e l'avversario non ha abbandonato
        const rematchNotification = document.getElementById('rematchNotification');
        if (rematchNotification) {
          rematchNotification.textContent = 'Your opponent wants to play again!';
          rematchNotification.style.display = 'block';
        }
        
        // Cambia il testo del pulsante in "Accetta Rivincita"
        const rematchBtn = document.getElementById('rematchBtn');
        if (rematchBtn) {
          rematchBtn.disabled = false; // Assicurati che il pulsante sia abilitato
          rematchBtn.textContent = 'Accept rematch'; // Imposta il testo su "Accetta Rivincita"
          rematchBtn.style.opacity = "1"; // Ripristina l'opacità normale
        }
      }
    })
    .catch(error => {
      console.error('Errore nel controllo dello stato della rivincita:', error);
    });
  }, 3000); // Controlla ogni 3 secondi
  
  // Salva l'ID dell'intervallo per poterlo cancellare se necessario
  window.rematchCheckIntervalId = rematchCheckInterval;
}