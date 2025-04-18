// Main page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI
  initMainUI();

  // Set up event listeners
  setupMainListeners();

  // Check if we need to open join game modal or create game modal
  const urlParams = new URLSearchParams(window.location.search);
  const openJoinGame = urlParams.get("openJoinGame");
  const openCreateGame = urlParams.get("openCreateGame");
  
  if (openJoinGame === "true") {
    openJoinGameModal();
  } else if (openCreateGame === "true") {
    const isLoggedIn = !!localStorage.getItem("currentUser");
    if (isLoggedIn) {
      showCreateGameModal();
    }
  }
  
  // Controlla se c'è un flag per aprire il modal di login
  const openLoginModal = sessionStorage.getItem("openLoginModal");
  const loginReason = sessionStorage.getItem("loginReason");
  
  if (openLoginModal === "true") {
    // Rimuovi i flag per evitare aperture multiple
    sessionStorage.removeItem("openLoginModal");
    sessionStorage.removeItem("loginReason");
    
    // Apri il modal di login
    const loginModalElement = document.getElementById("loginModal");
    if (loginModalElement) {
      const loginModal = new bootstrap.Modal(loginModalElement);
      loginModal.show();
      
      // Aggiungi un messaggio al modal di login in base al motivo
      const loginMessage = document.getElementById("loginMessage");
      if (loginMessage) {
        if (loginReason === "profile") {
          loginMessage.textContent = "Please log in to access your profile";
        } else if (loginReason === "stats") {
          loginMessage.textContent = "Please log in to view your statistics";
        } else {
          loginMessage.textContent = "Please log in to continue";
        }
        loginMessage.classList.remove("d-none");
      }
    }
  }
});

// Initialize main page UI
function initMainUI() {
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("currentUser");
  console.log("Main page - Auth state:", isLoggedIn ? "Logged in" : "Not logged in");

  // Show/hide recent matches section based on login status
  const recentMatchesSection = document.getElementById("recentMatchesSection");
  if (recentMatchesSection) {
    // Only show recent matches if user is logged in
    if (isLoggedIn) {
      // Load recent matches (if any)
      loadRecentMatches();
    }
  }
}

// Load recent matches
function loadRecentMatches() {
  // This would typically fetch from the server
  // For now, we'll just show a placeholder
  const recentMatchesList = document.getElementById("recentMatchesList");
  if (recentMatchesList) {
    recentMatchesList.innerHTML = `
      <p class="text-muted">No recent matches found. Start playing!</p>
    `;
  }
}

// Set up event listeners for main page
function setupMainListeners() {
  // Play Game button
  const newGameBtn = document.getElementById("newGameBtn");
  if (newGameBtn) {
    newGameBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem("currentUser");

      if (isLoggedIn) {
        // User is logged in, proceed to game creation
        console.log("User is logged in, proceeding to game creation");
        showCreateGameModal();
      } else {
        // User is not logged in, show login modal
        console.log("User is not logged in, showing login modal");
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Please log in to create a new game";
          loginMessage.classList.remove("d-none");
        }

        // Aggiungi un listener per quando il modal viene chiuso
        loginModalElement.addEventListener('hidden.bs.modal', function () {
          // Verifica se l'utente è ora loggato
          const isLoggedIn = !!localStorage.getItem("currentUser");
          if (isLoggedIn) {
            // Apri il modal di creazione partita se l'utente è loggato
            showCreateGameModal();
          }
        });
      }
    });
  }

  // Join Game button
  const joinGameBtn = document.getElementById("joinGameBtn");
  if (joinGameBtn) {
    joinGameBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem("currentUser");

      if (isLoggedIn) {
        // L'utente è loggato, elabora il codice di gioco direttamente
        const gameCodeInput = document.getElementById("heroGameCode").value.trim();
        if (gameCodeInput) {
          joinGame(gameCodeInput);
        } else {
          // Se non c'è input, apri il modal
          openJoinGameModal();
        }
      } else {
        // User is not logged in, show login modal
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Per favore effettua il login per unirti a una partita";
          loginMessage.classList.remove("d-none");
        }

        // Aggiungi un listener per quando il modal viene chiuso
        loginModalElement.addEventListener('hidden.bs.modal', function () {
          // Verifica se l'utente è ora loggato
          const isLoggedIn = !!localStorage.getItem("currentUser");
          if (isLoggedIn) {
            // Controlla se c'è un codice, altrimenti apri il modal
            const gameCodeInput = document.getElementById("heroGameCode").value.trim();
            if (gameCodeInput) {
              joinGame(gameCodeInput);
            } else {
              // Apri il modal di join game se l'utente è loggato
              openJoinGameModal();
            }
          }
        });
      }
    });
  }

  // Hero game code input - gestisci pressione tasto Enter
  const heroGameCodeInput = document.getElementById("heroGameCode");
  if (heroGameCodeInput) {
    heroGameCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const gameCodeInput = heroGameCodeInput.value.trim();
        
        // Verifica se l'utente è loggato
        const isLoggedIn = !!localStorage.getItem("currentUser");
        
        if (isLoggedIn) {
          // Utente loggato, procedi con il join
          if (gameCodeInput) {
            joinGame(gameCodeInput);
          }
        } else {
          // Utente non loggato, mostra il modal di login
          const loginModalElement = document.getElementById("loginModal");
          const loginModal = new bootstrap.Modal(loginModalElement);
          loginModal.show();
          
          // Aggiungi un messaggio al modal di login
          const loginMessage = document.getElementById("loginMessage");
          if (loginMessage) {
            loginMessage.textContent = "Per favore effettua il login per unirti a una partita";
            loginMessage.classList.remove("d-none");
          }
          
          // Quando il modal viene chiuso, controlla se l'utente si è loggato
          loginModalElement.addEventListener('hidden.bs.modal', function handler() {
            // Rimuovi il listener per evitare duplicazioni
            loginModalElement.removeEventListener('hidden.bs.modal', handler);
            
            // Verifica se l'utente è ora loggato
            const isLoggedIn = !!localStorage.getItem("currentUser");
            if (isLoggedIn && gameCodeInput) {
              joinGame(gameCodeInput);
            }
          });
        }
      }
    });
  }

  // Recent Matches button
  const recentMatchesBtn = document.getElementById("recentMatchesBtn");
  if (recentMatchesBtn) {
    recentMatchesBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem("currentUser");

      if (isLoggedIn) {
        // User is logged in, toggle recent matches section
        const recentMatchesSection = document.getElementById("recentMatchesSection");
        if (recentMatchesSection) {
          recentMatchesSection.classList.toggle("d-none");

          // Load recent matches if section is visible
          if (!recentMatchesSection.classList.contains("d-none")) {
            loadRecentMatches();
          }
        }
      } else {
        // User is not logged in, show login modal
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Please log in to view your recent matches";
          loginMessage.classList.remove("d-none");
        }
      }
    });
  }

  // Create Game button in modal
  const createGameBtn = document.getElementById("createGameBtn");
  if (createGameBtn) {
    createGameBtn.addEventListener("click", async () => {
      // Get selected match type
      const matchType = document.getElementById("matchType").value;
      let maxRounds;
      
      // Set max rounds based on match type
      switch(matchType) {
        case 'fast':
          maxRounds = 3;
          break;
        case 'normal':
          maxRounds = 5;
          break;
        case 'long':
          maxRounds = 10;
          break;
        default:
          maxRounds = 5;
      }

      // Hide game creation section and show game link section
      document.getElementById("gameLinkSection").classList.remove("d-none");
      // show go to game button
      document.getElementById("goToGameBtn").classList.remove("d-none");
      document.getElementById("goToGameBtn").addEventListener("click", () => {
        window.location.href = `game.html?code=${gameCode}`;
      });
      // Generate a random game code
      const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      document.getElementById("gameCodeDisplay").textContent = gameCode;

      //get currentUser
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      // Set the game link
      const gameLink = `${window.location.origin}/game.html?code=${gameCode}`;
      document.getElementById("gameLink").value = gameLink;

      // Send match data to server
      try {
        const data = await API.games.createGame(currentUser.id, gameCode, maxRounds);
        console.log('Game created:', data);
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }

  // Copy Link button
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => {
      const gameLink = document.getElementById("gameLink");
      gameLink.select();
      document.execCommand("copy");

      // Show copied alert
      document.getElementById("linkCopiedAlert").classList.remove("d-none");

      // Hide alert after 2 seconds
      setTimeout(() => {
        document.getElementById("linkCopiedAlert").classList.add("d-none");
      }, 2000);
    });
  }

  // Join Game form submission
  const joinGameForm = document.getElementById("joinGameForm");
  if (joinGameForm) {
    joinGameForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const gameCodeInput = document.getElementById("gameCode").value.trim();

      if (!gameCodeInput) {
        // Show error
        const joinGameError = document.getElementById("joinGameError");
        if (joinGameError) {
          joinGameError.textContent = "Please enter a game code";
          joinGameError.classList.remove("d-none");
        }
        return;
      }

      joinGame(gameCodeInput);
    });
  }
}

// Show Create Game modal
function showCreateGameModal() {
  // Reset modal state
  document.getElementById("gameLinkSection").classList.add("d-none");

  // Rimuovi eventuali backdrop esistenti
  const existingBackdrops = document.querySelectorAll('.modal-backdrop');
  existingBackdrops.forEach(backdrop => backdrop.remove());
  
  // Rimuovi la classe modal-open dal body
  document.body.classList.remove('modal-open');

  // Show modal
  const createGameModalElement = document.getElementById("createGameModal");
  const createGameModal = new bootstrap.Modal(createGameModalElement);
  createGameModal.show();
}

// Function to open join game modal
function openJoinGameModal() {
  const joinGameModalElement = document.getElementById("joinGameModal");
  if (joinGameModalElement) {
    // Rimuovi eventuali backdrop esistenti
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // Rimuovi la classe modal-open dal body
    document.body.classList.remove('modal-open');
    
    const joinGameModal = new bootstrap.Modal(joinGameModalElement);
    joinGameModal.show();
  }
}

// Funzione per unirsi a un gioco
function joinGame(code) {
  if (!code) {
    const joinGameError = document.getElementById("joinGameError");
    if (joinGameError) {
      joinGameError.textContent = "Inserisci un codice o link di gioco valido";
      joinGameError.classList.remove("d-none");
    }
    return;
  }
  
  // Gestisci formati diversi del codice
  if (code.includes('/')) {
    // Estrai il codice dall'URL
    const urlParts = code.split('/');
    code = urlParts[urlParts.length - 1];
    
    // Se il codice è parte di un parametro URL (es. code=ABC123)
    if (code.includes('code=')) {
      code = code.split('code=')[1];
      
      // Rimuovi eventuali parametri aggiuntivi
      if (code.includes('&')) {
        code = code.split('&')[0];
      }
    }
  }
  
  // Forza maiuscolo e rimuovi spazi
  code = code.toUpperCase().trim();
  
  // Valida la lunghezza del codice - tutti i codici di gioco sono esattamente 6 caratteri
  if (code.length < 6) {
    const joinGameError = document.getElementById("joinGameError");
    if (joinGameError) {
      joinGameError.textContent = "Il codice di gioco deve essere di almeno 6 caratteri";
      joinGameError.classList.remove("d-none");
    }
    return;
  }
  
  // Redirect alla pagina di gioco con il codice
  window.location.href = `game.html?code=${code}`;
}

// Aggiungi event listener per la chiusura dei modal
document.addEventListener('DOMContentLoaded', function() {
  // Listener per il modal di join game
  const joinGameModal = document.getElementById('joinGameModal');
  if (joinGameModal) {
    joinGameModal.addEventListener('hidden.bs.modal', function () {
      // Rimuovi il backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
      // Rimuovi la classe modal-open dal body
      document.body.classList.remove('modal-open');
    });
  }

  // Listener per il modal di creazione partita
  const createGameModal = document.getElementById('createGameModal');
  if (createGameModal) {
    createGameModal.addEventListener('hidden.bs.modal', function () {
      // Rimuovi il backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
      // Rimuovi la classe modal-open dal body
      document.body.classList.remove('modal-open');
    });
  }
});

// Mobile navigation handlers
document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation button handlers
    const mobileNewGameBtn = document.getElementById('mobileNewGameBtn');
    const mobileJoinGameBtn = document.getElementById('mobileJoinGameBtn');
    const mobileProfileLink = document.getElementById('mobileProfileLink');

    // Open new game modal on mobile button click
    if (mobileNewGameBtn) {
        mobileNewGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                // Siamo sulla homepage, possiamo usare il pulsante esistente
                const newGameBtn = document.getElementById('newGameBtn');
                if (newGameBtn) newGameBtn.click();
            } else {
                // Siamo su un'altra pagina, verifichiamo se l'utente è loggato
                const isLoggedIn = localStorage.getItem('currentUser');
                if (isLoggedIn) {
                    // Redirect alla homepage con parametro per aprire il modal
                    window.location.href = 'index.html?openCreateGame=true';
                } else {
                    // Redirect alla homepage normale
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Open join game modal on mobile button click
    if (mobileJoinGameBtn) {
        mobileJoinGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
                // Siamo sulla homepage, possiamo usare il pulsante esistente
                const joinGameBtn = document.getElementById('joinGameBtn');
                if (joinGameBtn) joinGameBtn.click();
            } else {
                // Siamo su un'altra pagina, verifichiamo se l'utente è loggato
                const isLoggedIn = localStorage.getItem('currentUser');
                if (isLoggedIn) {
                    // Redirect alla homepage con parametro per aprire il modal
                    window.location.href = 'index.html?openJoinGame=true';
                } else {
                    // Redirect alla homepage normale
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Gestione del link Profile ora affidata a mobile-nav.js
});

// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
  // Button event listeners
  const newGameBtn = document.getElementById('newGameBtn');
  const joinGameBtn = document.getElementById('joinGameBtn');
  const mobileNewGameBtn = document.getElementById('mobileNewGameBtn');
  const mobileJoinGameBtn = document.getElementById('mobileJoinGameBtn');
  const heroGameCodeInput = document.getElementById('heroGameCode');
  
  // Modal elements
  const createGameModal = new bootstrap.Modal(document.getElementById('createGameModal'));
  const joinGameModal = new bootstrap.Modal(document.getElementById('joinGameModal'));
  
  
  
 
  
 
  // Join game form handler
  const joinGameForm = document.getElementById('joinGameForm');
  if (joinGameForm) {
    joinGameForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const gameCode = document.getElementById('gameCode').value.trim();
      joinGame(gameCode);
    });
  }
  
  // Hero game code input handler - join on Enter key
  if (heroGameCodeInput) {
    heroGameCodeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const code = heroGameCodeInput.value.trim();
        if (code) {
          joinGame(code);
        }
      }
    });
  }
  
  // Function to join a game with the given code
  function joinGame(code) {
    if (!code) {
      showJoinGameError('Please enter a valid game code or link');
      return;
    }
    
    // Handle different code formats
    if (code.includes('/')) {
      // Extract code from URL
      const urlParts = code.split('/');
      code = urlParts[urlParts.length - 1];
      
      // Se il codice è parte di un parametro URL (es. code=ABC123)
      if (code.includes('code=')) {
        code = code.split('code=')[1];
        
        // Rimuovi eventuali parametri aggiuntivi
        if (code.includes('&')) {
          code = code.split('&')[0];
        }
      }
    }
    
    // Force uppercase and trim whitespace
    code = code.toUpperCase().trim();
    
    // Validate code length - all game codes are exactly 6 characters
    if (code.length < 6) {
      showJoinGameError('Game code must be at least 6 characters');
      return;
    }
    
    // Redirect to game page with code
    window.location.href = `game.html?code=${code}`;
  }
  
  function showJoinGameError(message) {
    const errorElement = document.getElementById('joinGameError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('d-none');
      
      setTimeout(() => {
        errorElement.classList.add('d-none');
      }, 3000);
    }
  }
  
  // Create game functionality
  // ... existing code ...
});