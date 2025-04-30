// FUNZIONI CORE DEL GIOCO

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

export {
  getUsedIndices,
  saveUsedIndex,
  initGame,
  updatePlayerInfo,
  setupFocusDetection,
  startPollingForOpponentMove,
  checkForOpponentMove,
  updateGameStateFromMatch,
  showGameResultModal,
  createRematch,
  checkRematchStatus,
  cleanupGameData
};