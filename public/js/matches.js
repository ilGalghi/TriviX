// matches.js - Handles functionality for the matches page

// Utilizzo checkAuthStatus direttamente
checkAuthStatus();

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("User not authenticated, redirecting to home page");
    window.location.href = "index.html";
    return;
  }

  console.log("User authenticated, loading matches");

  // Load matches
  await loadMatches();
})

// Load matches
async function loadMatches() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("You must be logged in to view your matches");
    window.location.href = "index.html";
    return;
  }
  console.log("carico matches");

  try {
    // Fetch user's games from the server
    const response = await fetch(`/api/games/user/${currentUser.id}`);
    
    if (!response.ok) {
      // Se il server risponde con un errore perché non ci sono partite
      if (response.status === 404) {
        // Mostra il messaggio "nessuna partita" invece di un errore
        document.getElementById("noCompletedMatches").classList.remove("d-none");
        // Nascondi la tabella o il contenitore delle partite
        document.getElementById("completedMatchesList").innerHTML = "";
        // Carica comunque la classifica
        await loadLeaderboard();
        return;
      }
      
      const data = await response.json();
      throw new Error(data.error || "Failed to load matches");
    }

    const data = await response.json();
    const matches = data.games || [];
    console.log("matches ricevuto: ", matches);
    // Filtra solo i match completati
    const completedMatches = matches.filter((match) => match.status === "completed");

    // Ordino i match completati per data (più recenti in alto)
    completedMatches.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Visualizza i match completati
    displayMatches("completedMatchesList", "noCompletedMatches", completedMatches);

    // Carica la classifica globale
    await loadLeaderboard();
  } catch (error) {
    console.error("Error loading matches:", error);
    // Invece di mostrare un alert, mostra il messaggio "nessuna partita"
    document.getElementById("noCompletedMatches").classList.remove("d-none");
    document.getElementById("completedMatchesList").innerHTML = "";
    // Carica comunque la classifica
    await loadLeaderboard();
  }
}

// Carica la classifica globale
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/users/all/public');
    const users = await response.json();

    // Ordina gli utenti per punti in ordine decrescente
    const sortedUsers = users.sort((a, b) => {
      return (b.profile?.stats?.points || 0) - (a.profile?.stats?.points || 0);
    });

    displayLeaderboard(sortedUsers);
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    document.getElementById("noLeaderboardData").classList.remove("d-none");
  }
}

// Visualizza la classifica
function displayLeaderboard(users) {
  const leaderboardList = document.getElementById("leaderboardList");
  const noLeaderboardData = document.getElementById("noLeaderboardData");

  if (!users || users.length === 0) {
    noLeaderboardData.classList.remove("d-none");
    return;
  }

  noLeaderboardData.classList.add("d-none");
  leaderboardList.innerHTML = "";

  users.forEach((user, index) => {
    const stats = user.profile?.stats || {};
    const row = document.createElement("tr");
    
    // Determina la classe per la posizione
    let positionClass = "";
    let position = "";
    let tdPositionClass = "";
    
    if (index === 0) {
      positionClass = "text-warning"; // Oro
      position = ""; // Solo l'emoji dal CSS
      tdPositionClass = "position-relative";
    } else if (index === 1) {
      positionClass = "text-secondary"; // Argento
      position = ""; // Solo l'emoji dal CSS
      tdPositionClass = "position-relative";
    } else if (index === 2) {
      positionClass = "text-bronze"; // Bronzo
      position = ""; // Solo l'emoji dal CSS
      tdPositionClass = "position-relative";
    }
    
      else {
      position = index + 1; // Numeri dal quarto posto in poi
    }

    row.innerHTML = `
      <td class="text-center border-end px-4 ${tdPositionClass}">
        <span class="fw-bold ${positionClass}">${position}</span>
      </td>
      <td class="text-center border-end px-4">
        <div class="d-flex justify-content-center align-items-center gap-2">
          <span class="fw-semibold">${user.username}</span>
        </div>
      </td>
      <td class="text-center border-end px-4">
        <span class="badge bg-primary">${stats.points || 0}</span>
      </td>
      <td class="text-center border-end px-4">
        <span class="fw-semibold">${stats.gamesWon || 0}</span>
      </td>
      <td class="text-center px-4">
        <span class="fw-semibold">${stats.gamesPlayed || 0}</span>
      </td>
    `;

    leaderboardList.appendChild(row);
  });
}

// Display matches
function displayMatches(listId, noMatchesId, matches) {
  const matchesList = document.getElementById(listId);
  const noMatches = document.getElementById(noMatchesId);

  if (!matchesList) return;

  // Clear current content
  matchesList.innerHTML = "";

  if (matches.length === 0) {
    console.log("no matches");
    if (noMatches) {
      noMatches.classList.remove("d-none");
    }
    return;
  }

  // Hide no matches message
  if (noMatches) {
    console.log("no matches");
    noMatches.classList.add("d-none");
  }

  // Add matches to the list
  matches.forEach((match) => {
    console.log("creo entry", match);
    const matchElement = createMatchElement(match);
    matchesList.appendChild(matchElement);
  });
}

// Create a match element
function createMatchElement(match) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const player = match.players.find((p) => p.id === user.id);
  const opponent = match.players.find((p) => p.id !== user.id);

  const isUserTurn = match.currentTurn === user.id;

  const matchDiv = document.createElement("tr");
  matchDiv.className = "match-row";

  let statusText = "";
  let statusClass = "";

  if (match.status === "completed") {
    const userScore = player ? player.score : 0;
    const opponentScore = opponent ? opponent.score : 0;
    statusText = userScore > opponentScore ? "Win" : userScore < opponentScore ? "Lose" : "Draw";
    statusClass = userScore > opponentScore ? "text-success" : userScore < opponentScore ? "text-danger" : "text-warning";
  } else {
    statusText = isUserTurn ? "Your turn" : "Waiting for opponent";
    statusClass = isUserTurn ? "text-primary" : "text-muted";
  }

  const opponentName = opponent ? opponent.username || "Opponent" : "Waiting for opponent";
  const userScore = player ? player.score : 0;
  const opponentScore = opponent ? opponent.score : 0;

  matchDiv.innerHTML = `
      <td class="text-center border-end px-4 ${statusClass} fw-bold">${statusText}</td>
      <td class="text-center border-end px-4">
          <div class="d-flex justify-content-center align-items-center gap-3">
              <span class="fw-semibold">${user.username}</span>
              <span class="text-muted small">vs</span>
              <span class="fw-semibold">${opponentName}</span>
          </div>
      </td>
      <td class="text-center border-end px-4">
          <div class="d-flex justify-content-center align-items-center gap-2">
              <span class="fw-semibold">${userScore}</span>
              <span class="text-muted small">-</span>
              <span class="fw-semibold">${opponentScore}</span>
          </div>
      </td>
      <td class="text-center border-end px-4">
          <span class="badge bg-secondary">${match.currentRound}/${match.maxRounds}</span>
      </td>
      <td class="text-center px-4">${new Date(match.updatedAt).toLocaleDateString()}</td>
  `;

  return matchDiv;
}
