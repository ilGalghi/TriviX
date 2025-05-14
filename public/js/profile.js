// Funzionalità della pagina del profilo
document.addEventListener("DOMContentLoaded", () => {
  // Controlla se l'utente è loggato
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    // Reindirizza alla pagina di login se l'utente non è loggato
    window.location.href = "index.html";
    return;
  }

  // Analizza i dati dell'utente
  const userData = JSON.parse(currentUser);

  // Carica i dati del profilo dell'utente
  loadProfileData(userData);

  // Imposta i listener per gli eventi
  setupProfileListeners();
  
  // Carica gli avatar predefiniti
  loadDefaultAvatars();
});

// Carica i dati del profilo
function loadProfileData(userData) {
  // Aggiorna gli elementi del profilo con i dati dell'utente
  document.getElementById("profileUsername").textContent = userData.username; // Nome utente
  document.getElementById("profileEmail").textContent = userData.email; // Email

  // Aggiorna l'avatar se disponibile
  if (userData.profile && userData.profile.avatar) {
    document.getElementById("profileAvatar").src = userData.profile.avatar; // Imposta l'avatar
  }

  // Aggiorna le statistiche
  if (userData.profile && userData.profile.stats) {
    const stats = userData.profile.stats;
    document.getElementById("gamesPlayed").textContent = stats.gamesPlayed || 0; // Partite giocate
    document.getElementById("gamesWon").textContent = stats.gamesWon || 0; // Partite vinte
    document.getElementById("correctAnswers").textContent = stats.correctAnswers || 0; // Risposte corrette
    document.getElementById("points").textContent = stats.points || 0; // Punti totali
  }

  // Aggiorna le performance per categoria
  if (userData.profile && userData.profile.categoryPerformance) {
    updateCategoryStats(userData.profile.categoryPerformance); // Chiama la funzione per aggiornare le statistiche delle categorie
  }
}

// Aggiorna le statistiche delle categorie
function updateCategoryStats(categoryPerformance) {
  const categoryStatsContainer = document.getElementById("categoryStats");
  let categoryStatsHTML = ""; // Variabile per accumulare l'HTML delle statistiche

  // Definisce le icone e i colori delle categorie
  const categories = {
    science: { icon: "flask", color: "#3498db" },
    entertainment: { icon: "film", color: "#9b59b6" },
    sports: { icon: "futbol", color: "#2ecc71" },
    art: { icon: "palette", color: "#f1c40f" },
    geography: { icon: "globe-americas", color: "#e67e22" },
    history: { icon: "landmark", color: "#e74c3c" },
  };

  // Genera l'HTML per ciascuna categoria
  Object.keys(categories).forEach((category) => {
    // Recupera le performance per la categoria corrente, se non esistono, imposta a 0
    const performance = categoryPerformance[category] || { correct: 0, total: 0 };
    
    // Calcola la percentuale di risposte corrette
    const percentage = performance.total > 0 ? Math.round((performance.correct / performance.total) * 100) : 0;

    // Aggiunge il markup HTML per la categoria corrente
    categoryStatsHTML += `
      <div class="category-item mb-3"> <!-- Contenitore per la categoria -->
        <div class="d-flex justify-content-between align-items-center mb-1"> <!-- Righe per il nome e le statistiche -->
          <div>
            <i class="fas fa-${categories[category].icon}" style="color: ${categories[category].color}"></i> <!-- Icona della categoria -->
            <span class="ms-2">${category.charAt(0).toUpperCase() + category.slice(1)}</span> <!-- Nome della categoria con la prima lettera maiuscola -->
          </div>
          <span>${performance.correct}/${performance.total} (${percentage}%)</span> <!-- Statistiche di performance -->
        </div>
        <div class="progress"> <!-- Barra di progresso per la percentuale -->
          <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${categories[category].color}" 
            aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div> <!-- Imposta la larghezza e il colore della barra -->
        </div>
      </div>
    `;
  });

  // Imposta l'HTML generato nel contenitore delle statistiche delle categorie
  categoryStatsContainer.innerHTML = categoryStatsHTML;
}

// Imposta i listener per gli eventi della pagina del profilo
function setupProfileListeners() {
  // Bottone per modificare il profilo
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      // Popola il modulo di modifica con i dati dell'utente corrente
      document.getElementById("editUsername").value = currentUser.username; // Nome utente
      document.getElementById("editEmail").value = currentUser.email; // Email
      document.getElementById("editPassword").value = ""; // Reset della password

      // Aggiorna l'anteprima dell'avatar
      if (currentUser.profile && currentUser.profile.avatar) {
        document.getElementById("editProfileAvatar").src = currentUser.profile.avatar; // Imposta l'avatar nell'editor
      }

      // Mostra il modal per la modifica del profilo
      const editProfileModal = new bootstrap.Modal(document.getElementById("editProfileModal"));
      editProfileModal.show();
    });
  }

  // Ricarica la pagina quando il modal viene chiuso con il pulsante X
  const editProfileModalElement = document.getElementById("editProfileModal");
  if (editProfileModalElement) {
    editProfileModalElement.addEventListener('hidden.bs.modal', function () {
      window.location.reload(); // Ricarica la pagina
    });
  }

  // Caricamento dell'avatar
  const avatarUpload = document.getElementById("avatarUpload");
  if (avatarUpload) {
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]; // Ottiene il file caricato
      if (!file) return; // Se non c'è file, esci

      // Controlla il tipo di file
      if (!file.type.match("image.*")) {
        alert("Seleziona un file immagine"); // Messaggio di errore se non è un'immagine
        return;
      }

      // Controlla la dimensione del file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("La dimensione dell'immagine deve essere inferiore a 2MB"); // Messaggio di errore se il file è troppo grande
        return;
      }

      // Leggi il file come URL dei dati
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target.result; // Ottiene l'URL dei dati

        // Aggiorna l'anteprima dell'avatar
        document.getElementById("editProfileAvatar").src = dataURL; // Imposta l'anteprima dell'avatar
      };

      reader.readAsDataURL(file); // Legge il file come URL dei dati
    });
  }
  
  // Bottone per selezionare l'avatar
  const selectAvatarBtn = document.getElementById("selectAvatarBtn");
  if (selectAvatarBtn) {
    selectAvatarBtn.addEventListener("click", () => {
      const avatarSelectionModal = new bootstrap.Modal(document.getElementById("avatarSelectionModal"));
      avatarSelectionModal.show(); // Mostra il modal per la selezione dell'avatar
    });
  }
  
  // Imposta la selezione dell'avatar
  setupAvatarSelection();

  // Invio del modulo di modifica del profilo, qui solo per l'UI (in auth.js avviene su server)
  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Previene il comportamento predefinito del modulo

      // Ottiene i valori dal modulo
      const username = document.getElementById("editUsername").value; // Nome utente
      const email = document.getElementById("editEmail").value; // Email
      const password = document.getElementById("editPassword").value; // Password
      const avatar = document.getElementById("editProfileAvatar").src; // Avatar

      // Chiama la funzione per aggiornare il profilo utente
      updateUserProfile(username, email, password, avatar);
    });
  }

  // Bottone di logout mobile
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", () => {
      // Invece di rimuovere solo i dati utente, chiamiamo la funzione di logout completa
      if (typeof logout === 'function') {
        // Usa la funzione logout() definita in auth.js
        logout();
      } else {
        // Fallback nel caso la funzione logout non fosse disponibile
        localStorage.removeItem("currentUser"); // Rimuove i dati dell'utente
        window.location.href = "index.html"; // Reindirizza alla pagina di login
      }
    });
  }
}

// Avatar predefiniti
const defaultAvatars = [
  { name: "Default", path: "img/default-avatar.png" },
  { name: "Avatar 1", path: "img/avatars/avatar1.png" },
  { name: "Avatar 2", path: "img/avatars/avatar2.png" },
  { name: "Avatar 3", path: "img/avatars/avatar3.png" },
  { name: "Avatar 4", path: "img/avatars/avatar4.png" },
  { name: "Avatar 5", path: "img/avatars/avatar5.png" },
  { name: "Avatar 6", path: "img/avatars/avatar6.png" },
  { name: "Avatar 7", path: "img/avatars/avatar7.png" },
  { name: "Avatar 8", path: "img/avatars/avatar8.png" },
  { name: "Avatar 9", path: "img/avatars/avatar9.png" },
  { name: "Avatar 10", path: "img/avatars/avatar10.png" },
  { name: "Avatar 11", path: "img/avatars/avatar11.png" }
];

// Carica gli avatar predefiniti nel modal
function loadDefaultAvatars() {
  const avatarGrid = document.getElementById("avatarGrid");
  if (!avatarGrid) return; // Se non esiste il contenitore, esci
  
  let avatarsHTML = ""; // Variabile per accumulare l'HTML degli avatar
  
  defaultAvatars.forEach((avatar, index) => {
    avatarsHTML += `
      <div class="col-4 col-sm-3 mb-3">
        <div class="avatar-item" data-avatar="${avatar.path}"> <!-- Contenitore per l'avatar -->
          <img src="${avatar.path}" alt="${avatar.name}" class="img-fluid rounded-circle avatar-option"> <!-- Immagine dell'avatar -->
          <p class="text-center mt-1 small">${avatar.name}</p> <!-- Nome dell'avatar -->
        </div>
      </div>
    `;
  });
  
  avatarGrid.innerHTML = avatarsHTML; // Imposta l'HTML generato nel contenitore degli avatar
}

// Imposta la selezione dell'avatar
function setupAvatarSelection() {
  const avatarGrid = document.getElementById("avatarGrid");
  if (!avatarGrid) return; // Se non esiste il contenitore, esci
  
  // Delegazione degli eventi per la selezione dell'avatar
  avatarGrid.addEventListener("click", (e) => {
    // Trova l'elemento più vicino con la classe avatar-item
    const avatarItem = e.target.closest(".avatar-item");
    if (!avatarItem) return; // Se non è stato cliccato un avatar, esci
    
    // Ottiene il percorso dell'avatar
    const avatarPath = avatarItem.dataset.avatar;
    
    // Aggiorna l'anteprima dell'avatar
    document.getElementById("editProfileAvatar").src = avatarPath;
    
    // Chiude il modal
    const avatarSelectionModal = bootstrap.Modal.getInstance(document.getElementById("avatarSelectionModal"));
    if (avatarSelectionModal) {
      avatarSelectionModal.hide(); // Nasconde il modal
    }
  });
}

// Aggiorna il profilo utente
function updateUserProfile(username, email, password, avatar) {
  const editProfileError = document.getElementById("editProfileError");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  console.log("Dati utente corrente:", currentUser); // Log dei dati utente
  console.log("Elemento editProfileError:", editProfileError); // Verifica elemento DOM

  if (!currentUser) {
    showError(editProfileError, "Devi essere loggato per aggiornare il tuo profilo"); // Messaggio di errore se non loggato
    return;
  }

  // Validazione degli input
  if (!username || !email) {
    showError(editProfileError, "Nome utente e email sono obbligatori"); // Messaggio di errore se mancano i dati
    return;
  }

  // Validazione del formato dell'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex per validare l'email
  if (!emailRegex.test(email)) {
    showError(editProfileError, "Inserisci un indirizzo email valido"); // Messaggio di errore se l'email non è valida
    return;
  }

  // Converti URL assoluti in percorsi relativi per gli avatar
  if (avatar) {
    // Se è un URL assoluto con un host (come https://...)
    const urlPattern = /^(https?:\/\/[^\/]+)(\/img\/.*)/i;
    const match = avatar.match(urlPattern);
    
    if (match) {
      // Estrai solo il percorso relativo
      avatar = match[2];
    }
    
    // Per gli avatar caricati come data URL, mantieni il formato originale
    // Per i percorsi relativi, mantieni il formato originale
  }

  // Prepara i dati del profilo
  const profileData = {
    username,
    email,
    profile: {
      ...currentUser.profile,
      avatar,
    },
  };

  // Aggiungi la password se fornita
  if (password) {
    profileData.password = password; // Aggiungi la password ai dati del profilo
  }

  console.log("Dati del profilo da aggiornare:", profileData); // Log dei dati da aggiornare

  // Aggiorna direttamente l'utente corrente
  // spread operator per espandere tutte le proprietà di currentUser e profileData in updateUser
  const updatedUser = { ...currentUser, ...profileData };
  
  // Salva l'utente aggiornato nel localStorage
  localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  
  // Aggiorna anche l'array degli utenti se esiste
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex((user) => user.id === currentUser.id);
  
  if (userIndex !== -1) {
    // Se l'utente esiste nell'array, aggiornalo
    users[userIndex] = updatedUser;
    localStorage.setItem("users", JSON.stringify(users)); // Salva l'array aggiornato
  } else {
    // Se l'utente non esiste nell'array ma esiste come currentUser, aggiungilo
    users.push(updatedUser);
    localStorage.setItem("users", JSON.stringify(users)); // Salva l'array aggiornato
  }
  
  // Nascondi eventuali messaggi di errore
  if (editProfileError) {
    editProfileError.classList.add("d-none");
    editProfileError.textContent = ""; // Pulisci il messaggio di errore
  }

  // Chiudi il modal
  const editProfileModal = document.getElementById("editProfileModal");
  if (editProfileModal) {
    const bsModal = bootstrap.Modal.getInstance(editProfileModal);
    if (bsModal) {
      bsModal.hide(); // Nasconde il modal
    } else {
      // Fallback se l'istanza bootstrap non è disponibile
      editProfileModal.style.display = "none";
      editProfileModal.classList.remove("show");
      document.body.classList.remove("modal-open");
      const modalBackdrops = document.getElementsByClassName("modal-backdrop");
      while (modalBackdrops.length > 0) {
        modalBackdrops[0].parentNode.removeChild(modalBackdrops[0]); // Rimuove i backdrop
      }
    }
  }

  // Ricarica i dati del profilo
  loadProfileData(updatedUser); // Ricarica i dati del profilo aggiornati
}

// Funzione helper per mostrare messaggi di errore
function showError(element, message) {
  console.log("Mostrando errore:", message, "Elemento:", element); // Log dell'errore mostrato
  if (element) {
    element.textContent = message; // Imposta il messaggio di errore
    element.classList.remove("d-none"); // Mostra l'elemento di errore
  }
}

