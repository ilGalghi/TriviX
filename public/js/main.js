// Main page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI
  initMainUI();

  // Set up event listeners
  setupMainListeners();
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
          loginMessage.textContent = "Please log in to start a new game";
          loginMessage.classList.remove("d-none");
        }
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
        // User is logged in, show join game modal
        const joinGameModalElement = document.getElementById("joinGameModal");
        const joinGameModal = new bootstrap.Modal(joinGameModalElement);
        joinGameModal.show();
      } else {
        // User is not logged in, show login modal
        const loginModalElement = document.getElementById("loginModal");
        const loginModal = new bootstrap.Modal(loginModalElement);
        loginModal.show();

        // Add a message to the login modal
        const loginMessage = document.getElementById("loginMessage");
        if (loginMessage) {
          loginMessage.textContent = "Please log in to join a game";
          loginMessage.classList.remove("d-none");
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
      // This would typically create a game on the server
      // For now, we'll just simulate it

      // Hide game creation section and show game link section
      //document.getElementById("gameCreationSection").classList.add("d-none");
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
        const data = await API.games.createGame(currentUser.id, gameCode);
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

      const gameCode = document.getElementById("gameCode").value.trim();

      if (!gameCode) {
        // Show error
        const joinGameError = document.getElementById("joinGameError");
        if (joinGameError) {
          joinGameError.textContent = "Please enter a game code";
          joinGameError.classList.remove("d-none");
        }
        return;
      }

      // Redirect to game page with code
      window.location.href = `game.html?code=${gameCode}`;
    });
  }
}

// Show Create Game modal
function showCreateGameModal() {
  // Reset modal state
  //document.getElementById("gameCreationSection").classList.remove("d-none");
  document.getElementById("gameLinkSection").classList.add("d-none");

  // Show modal
  const createGameModalElement = document.getElementById("createGameModal");
  const createGameModal = new bootstrap.Modal(createGameModalElement);
  createGameModal.show();
}