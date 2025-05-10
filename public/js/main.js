// FUNZIONALITÀ DELLA PAGINA PRINCIPALE - Gestione dell'interfaccia utente della home page di TriviX

/**
 * Inizializzazione della pagina principale quando il DOM è completamente caricato
 * Funzionalità:
 * - Inizializza l'interfaccia utente
 * - Configura gli event listener
 * - Gestisce l'apertura automatica dei modal
 * - Gestisce il reindirizzamento post-login
 */
document.addEventListener("DOMContentLoaded", () => {
  
  // Set up event listeners
  setupMainListeners();

  // Check if we need to open create game modal
  const urlParams = new URLSearchParams(window.location.search);
  const openCreateGame = urlParams.get("openCreateGame");
  
  if (openCreateGame === "true") {
    const isLoggedIn = !!localStorage.getItem("currentUser");
    if (isLoggedIn) {
      showCreateGameModal();
    }
  }
  
  // Controlla se c'è un flag per aprire il modal di login
  // usiamo il sessionStorage che a differenza del localStorage non persiste dopo la chiusura della pagina
  // localStorage usato, per esempio, per funzionalità legate al match che può essere riaperto in una nuova sessione
  const openLoginModal = sessionStorage.getItem("openLoginModal");
  const loginReason = sessionStorage.getItem("loginReason");
  const pendingCategory = sessionStorage.getItem("pendingCategory");
  
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
        } else if (loginReason === "training") {
          loginMessage.textContent = "Per favore effettua il login per accedere all'allenamento";
        } else {
          loginMessage.textContent = "Please log in to continue";
        }
        loginMessage.classList.remove("d-none");
      }
    }
  }

  // Se c'è una categoria in sospeso e l'utente è loggato, reindirizza al training
  if (pendingCategory && localStorage.getItem("currentUser")) {
    sessionStorage.removeItem("pendingCategory");
    window.location.href = `training.html?category=${pendingCategory}`;
  }
});





/**
 * Configura gli event listener per la pagina principale
 * Funzionalità:
 * - Gestisce il pulsante "Nuova Partita"
 * - Gestisce il pulsante "Unisciti a Partita"
 * - Gestisce l'input del codice partita
 * - Gestisce le card delle categorie
 * - Gestisce i modal di creazione e join
 */
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
        
        // Aggiungi il messaggio per la creazione partita
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Per favore effettua il login per creare una nuova partita";
          loginMessage.classList.remove("d-none");
        }
        
        // Imposta il tipo di azione nel modal
        loginModalElement.dataset.actionType = "create";
        
        loginModal.show();
      }
    });
  }

  // Join Game button
  const joinGameBtn = document.getElementById("joinGameBtn");
  if (joinGameBtn) {
    joinGameBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Ottieni il codice di gioco dall'input
      const gameCodeInput = document.getElementById("heroGameCode").value.trim();
      
      // Se il campo è vuoto, mostra un messaggio di errore
      if (!gameCodeInput) {
        // Mostra un messaggio di errore sotto l'input
        const errorElement = document.createElement('div');
        errorElement.className = 'text-danger mt-2';
        errorElement.textContent = 'Inserisci un codice di gioco valido';
        
        // Rimuovi eventuali messaggi di errore precedenti
        const existingError = document.querySelector('.hero-actions .text-danger');
        if (existingError) {
          existingError.remove();
        }
        
        // Aggiungi il messaggio di errore dopo l'input
        const inputGroup = document.querySelector('.hero-actions .input-group');
        if (inputGroup) {
          inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
        }
        
        return;
      }

      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem("currentUser");

      if (isLoggedIn) {
        // L'utente è loggato, procedi direttamente con il join
        joinGame(gameCodeInput);
      } else {
        // User is not logged in, show login modal
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        
        // Salva il codice di gioco per usarlo dopo il login
        sessionStorage.setItem("pendingGameCode", gameCodeInput);
        
        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Per favore effettua il login per unirti a una partita";
          loginMessage.classList.remove("d-none");
        }

        // Aggiungi un listener per quando il modal viene chiuso
        loginModalElement.addEventListener('hidden.bs.modal', function handler() {
          // Rimuovi il listener per evitare duplicazioni
          loginModalElement.removeEventListener('hidden.bs.modal', handler);
          
          // Verifica se l'utente è ora loggato
          const isLoggedIn = !!localStorage.getItem("currentUser");
          if (isLoggedIn) {
            // Recupera il codice di gioco salvato
            const savedGameCode = sessionStorage.getItem("pendingGameCode");
            if (savedGameCode) {
              // Rimuovi il codice salvato
              sessionStorage.removeItem("pendingGameCode");
              // Procedi con il join
              joinGame(savedGameCode);
            }
          }
        });
        
        loginModal.show();
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
        
        // Se il campo è vuoto, mostra un messaggio di errore
        if (!gameCodeInput) {
          // Mostra un messaggio di errore sotto l'input
          const errorElement = document.createElement('div');
          errorElement.className = 'text-danger mt-2';
          errorElement.textContent = 'Inserisci un codice di gioco valido';
          
          // Rimuovi eventuali messaggi di errore precedenti
          const existingError = document.querySelector('.hero-actions .text-danger');
          if (existingError) {
            existingError.remove();
          }
          
          // Aggiungi il messaggio di errore dopo l'input
          const inputGroup = document.querySelector('.hero-actions .input-group');
          if (inputGroup) {
            inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
          }
          
          return;
        }
        
        // Verifica se l'utente è loggato
        const isLoggedIn = !!localStorage.getItem("currentUser");
        
        if (isLoggedIn) {
          // Utente loggato, procedi con il join
          joinGame(gameCodeInput);
        } else {
          // Utente non loggato, mostra il modal di login
          const loginModalElement = document.getElementById("loginModal");
          const loginModal = new bootstrap.Modal(loginModalElement);
          
          // Salva il codice di gioco per usarlo dopo il login
          sessionStorage.setItem("pendingGameCode", gameCodeInput);
          
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
            if (isLoggedIn) {
              // Recupera il codice di gioco salvato
              const savedGameCode = sessionStorage.getItem("pendingGameCode");
              if (savedGameCode) {
                // Rimuovi il codice salvato
                sessionStorage.removeItem("pendingGameCode");
                // Procedi con il join
                joinGame(savedGameCode);
              }
            }
          });
          
          loginModal.show();
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

  // Category cards click handlers
  const categoryCards = document.querySelectorAll('.category-item');
  categoryCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get category from card class (es. 'category-item science' -> 'science')
      const category = card.classList[1];
      
      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem("currentUser");
      
      if (isLoggedIn) {
        // User is logged in, proceed to training
        window.location.href = `training.html?category=${category}`;
      } else {
        // User is not logged in, show login modal
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        
        // Save category for later redirect
        sessionStorage.setItem("pendingCategory", category);
        
        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Per favore effettua il login per accedere all'allenamento";
          loginMessage.classList.remove("d-none");
        }
        
        // Set login reason
        sessionStorage.setItem("loginReason", "training");
        
        loginModal.show();
      }
    });
  });
}

/**
 * Mostra il modal di creazione partita
 * Funzionalità:
 * - Resetta lo stato del modal
 * - Rimuove eventuali backdrop esistenti
 * - Rimuove la classe modal-open dal body
 * - Visualizza il modal
 */
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

/**
 * Gestisce l'unione a una partita esistente
 * Funzionalità:
 * - Normalizza il formato del codice partita
 * - Valida la lunghezza del codice
 * - Gestisce gli errori di input
 * - Reindirizza alla pagina di gioco
 * @param {string} code - Il codice della partita a cui unirsi
 */
function joinGame(code) {
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
    // Mostra un messaggio di errore sotto l'input
    const errorElement = document.createElement('div');
    errorElement.className = 'text-danger mt-2';
    errorElement.textContent = 'Il codice di gioco deve essere di almeno 6 caratteri';
    
    // Rimuovi eventuali messaggi di errore precedenti
    const existingError = document.querySelector('.hero-actions .text-danger');
    if (existingError) {
      existingError.remove();
    }
    
    // Aggiungi il messaggio di errore dopo l'input
    const inputGroup = document.querySelector('.hero-actions .input-group');
    if (inputGroup) {
      inputGroup.parentNode.insertBefore(errorElement, inputGroup.nextSibling);
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

/**
 * Gestisce la navigazione mobile
 * Funzionalità:
 * - Gestisce il pulsante nuova partita su mobile
 * - Gestisce il pulsante unisciti su mobile
 * - Gestisce il link al profilo su mobile
 * - Gestisce i reindirizzamenti appropriati
 */
document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation button handlers
    const mobileNewGameBtn = document.getElementById('mobileNewGameBtn');
    const mobileJoinGameBtn = document.getElementById('mobileJoinGameBtn');

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
                    // Redirect alla homepage normale
                    window.location.href = 'index.html';
                } else {
                    // Redirect alla homepage normale
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Gestione del link Profile ora affidata a mobile-nav.js
});

/**
 * Funzionalità JavaScript principale della pagina
 * Funzionalità:
 * - Gestisce i pulsanti principali
 * - Gestisce i modal
 * - Gestisce il form di join
 * - Gestisce l'input del codice partita
 * - Gestisce la creazione di nuove partite
 */
document.addEventListener('DOMContentLoaded', function() {
  // Button event listeners
  const heroGameCodeInput = document.getElementById('heroGameCode');
  
  
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
  
});