// Main page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI
  initMainUI();

  // Set up event listeners
  setupMainListeners();

  // Check if we need to open join game modal
  const urlParams = new URLSearchParams(window.location.search);
  const openJoinGame = urlParams.get("openJoinGame");
  if (openJoinGame === "true") {
    openJoinGameModal();
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
  // New Game button
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
          loginMessage.textContent = "Per favore effettua il login per creare una nuova partita";
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
        openJoinGameModal();
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
            // Apri il modal di join game se l'utente è loggato
            openJoinGameModal();
          }
        });
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

      // Verifica se l'input è un URL o un codice
      let gameCode = gameCodeInput;
      
      // Regex per controllare se è un URL con parametro code
      const urlRegex = /^(?:https?:\/\/)?(?:[^\/]+)\/game\.html\?code=([A-Z0-9]+)$/i;
      const match = gameCodeInput.match(urlRegex);
      
      if (match && match[1]) {
        // Se è un URL, estrai solo il codice
        gameCode = match[1];
      }

      // Forza il codice in maiuscolo
      gameCode = gameCode.toUpperCase();

      // Redirect to game page with code
      window.location.href = `game.html?code=${gameCode}`;
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