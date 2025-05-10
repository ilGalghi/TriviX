// matches.js - Gestisce le funzionalità per la pagina delle partite

const DEFAULT_AVATAR = "img/default-avatar.png"; // Avatar predefinito per gli utenti

// Utilizzo checkAuthStatus di auth.js
checkAuthStatus();

document.addEventListener("DOMContentLoaded", async () => {
  // Controlla se l'utente è loggato
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    console.error("Utente non autenticato, reindirizzamento alla home page");
    window.location.href = "index.html";
    return;
  }

  console.log("Utente autenticato, caricamento delle partite");

  // Carica le partite
  await loadMatches();
});

// Carica le partite
async function loadMatches() {
  // Ottieni l'utente corrente
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    alert("Devi essere loggato per visualizzare le tue partite");
    window.location.href = "index.html";
    return;
  }
  console.log("carico partite");

  try {
    // Recupera le partite dell'utente dal server
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
      throw new Error(data.error || "Impossibile caricare le partite");
    }

    const data = await response.json();
    const matches = data.games || [];
    console.log("partite ricevute: ", matches);
    // Filtra solo i match completati
    const completedMatches = matches.filter((match) => match.status === "completed");

    // Ordino i match completati per data (più recenti in alto)
    completedMatches.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Visualizza i match completati
    displayMatches("completedMatchesList", "noCompletedMatches", completedMatches);

    // Carica la classifica globale
    await loadLeaderboard();
  } catch (error) {
    console.error("Errore nel caricamento delle partite:", error);
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
    // in base al valore di ritorno della differenza sort() stabilisce se 'a' o 'b' è maggiore
    const sortedUsers = users.sort((a, b) => {
      return (b.profile?.stats?.points || 0) - (a.profile?.stats?.points || 0);
    });

    displayLeaderboard(sortedUsers);
  } catch (error) {
    console.error("Errore nel caricamento della classifica:", error);
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

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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
    } else {
      position = index + 1; // Numeri dal quarto posto in poi
    }

    // evidenzia l'utente corrente
    if (currentUser && user.id === currentUser.id) {
      row.classList.add("user-row-highlight");
    }

    // Crea la riga della tabella a seconda del player (tdPositionClass, positionClass, position)
    row.innerHTML = `
      <td class="text-center border-end px-4 ${tdPositionClass}">
        <span class="fw-bold ${positionClass}">${position}</span>
      </td>
      <td class="text-center border-end px-4">
        <div class="d-flex justify-content-center align-items-center gap-2" style="min-height: 32px;">
          <img src="${user.profile?.avatar || DEFAULT_AVATAR}" alt="avatar" class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover; margin-right: 8px; vertical-align: middle; box-shadow: 0 1px 4px rgba(0,0,0,0.12);">
          <span class="fw-semibold align-middle" style="line-height: 28px;">${user.username}</span>
        </div>
      </td>
      <td class="text-center border-end px-4">
        <span class="badge bg-primary">${stats.points || 0}</span>
      </td>
      <td class="text-center border-end px-4">
        <span class="fw-semibold">${stats.gamesWon || 0}</span>
      </td>
      <td class="text-center border-end px-4">
        <span class="fw-semibold">${stats.gamesPlayed || 0}</span>
      </td>
      <td class="text-center px-4">
        <span class="fw-semibold">${stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) + '%' : '--'}</span>
      </td>
    `;

    leaderboardList.appendChild(row);
  });
}

// Visualizza le partite
function displayMatches(listId, noMatchesId, matches) {
  const matchesList = document.getElementById(listId);
  const noMatches = document.getElementById(noMatchesId);

  if (!matchesList) return;

  // Pulisci il contenuto corrente
  matchesList.innerHTML = "";

  if (matches.length === 0) {
    console.log("nessuna partita");
    if (noMatches) {
      noMatches.classList.remove("d-none");
    }
    return;
  }

  // Nascondi il messaggio "nessuna partita"
  if (noMatches) {
    console.log("nessuna partita");
    noMatches.classList.add("d-none");
  }

  // Aggiungi le partite alla lista
  matches.forEach((match) => {
    console.log("creo entry", match);
    const matchElement = createMatchElement(match);
    matchesList.appendChild(matchElement);
  });
}

// Crea l'item della tabella dei matches
function createMatchElement(match) {
  // Recupera l'utente corrente dal localStorage
  const user = JSON.parse(localStorage.getItem("currentUser"));
  
  // Trova il giocatore corrente e l'avversario nella partita
  const player = match.players.find((p) => p.id === user.id);
  const opponent = match.players.find((p) => p.id !== user.id);

  // Controlla se è il turno dell'utente corrente
  const isUserTurn = match.currentTurn === user.id;

  // Crea un nuovo elemento di riga per la partita
  const matchDiv = document.createElement("tr");
  matchDiv.className = "match-row"; // Aggiunge una classe per lo stile

  let statusText = ""; // Testo per lo stato della partita
  let statusClass = ""; // Classe per lo stile dello stato

  // Controlla se la partita è completata
  if (match.status === "completed") {
    // Ottiene i punteggi del giocatore e dell'avversario
    const userScore = player ? player.score : 0; // Punteggio dell'utente
    const opponentScore = opponent ? opponent.score : 0; // Punteggio dell'avversario
    
    // Determina il testo e la classe in base al punteggio
    statusText = userScore > opponentScore ? "Vittoria" : userScore < opponentScore ? "Sconfitta" : "Pareggio";
    statusClass = userScore > opponentScore ? "text-success" : userScore < opponentScore ? "text-danger" : "text-warning";
  } else {
    // Se la partita non è completata, mostra il turno corrente
    statusText = isUserTurn ? "Il tuo turno" : "In attesa dell'avversario";
    statusClass = isUserTurn ? "text-primary" : "text-muted"; // Stile per il turno dell'utente o in attesa
  }

  // Ottiene il nome dell'avversario o mostra un messaggio di attesa
  const opponentName = opponent ? opponent.username || "Avversario" : "In attesa dell'avversario";
  const userScore = player ? player.score : 0; // Punteggio dell'utente
  const opponentScore = opponent ? opponent.score : 0; // Punteggio dell'avversario

  // Imposta il contenuto HTML della riga della partita
  matchDiv.innerHTML = `
      <td class="text-center border-end px-4 ${statusClass} fw-bold">${statusText}</td> <!-- Stato della partita -->
      <td class="text-center border-end px-4">
          <div class="d-flex justify-content-center align-items-center gap-3">
              <span class="fw-semibold">${user.username}</span> <!-- Nome dell'utente -->
              <span class="text-muted small">vs</span> <!-- Testo "vs" -->
              <span class="fw-semibold">${opponentName}</span> <!-- Nome dell'avversario -->
          </div>
      </td>
      <td class="text-center border-end px-4">
          <div class="d-flex justify-content-center align-items-center gap-2">
              <span class="fw-semibold">${userScore}</span> <!-- Punteggio dell'utente -->
              <span class="text-muted small">-</span> <!-- Separatore -->
              <span class="fw-semibold">${opponentScore}</span> <!-- Punteggio dell'avversario -->
          </div>
      </td>
      <td class="text-center border-end px-4">
          <span class="badge bg-secondary">${match.currentRound}/${match.maxRounds}</span> <!-- Round corrente e massimo -->
      </td>
      <td class="text-center px-4">${new Date(match.updatedAt).toLocaleDateString()}</td> <!-- Data dell'ultima modifica -->
  `;

  return matchDiv; // Restituisce l'elemento della partita creato
}
