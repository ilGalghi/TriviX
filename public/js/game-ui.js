// FUNZIONI PER LA UI DEL GIOCO

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
      const timerElement = document.getElementById("timerValue");
      timerElement.textContent = timeLeft;
      
      // Aggiungi o rimuovi la classe low-time in base al tempo rimasto
      if (timeLeft <= 10) {
        timerElement.classList.add("low-time");
      } else {
        timerElement.classList.remove("low-time");
      }
      
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

export {
  spinWheel,
  showQuestion,
  startTimer,
  stopTimer,
  checkAnswer,
  showPointAnimation,
  showResult,
  checkForSavedQuestion,
  saveCurrentQuestion,
  saveQuestionResult,
  updateUserCategoryPerformance,
  setupGameListeners,
  surrenderGame,
  saveScoreToDatabase,
  switchTurn
};