// Authentication module for client-side
document.addEventListener("DOMContentLoaded", () => {
  // Inizializza gli elementi dell'interfaccia utente
  initAuthUI()

  // Controlla se l'utente è connesso
  checkAuthStatus()

  // Aggiungi listener per i moduli di login e registrazione
  setupAuthListeners()
})

// Inizializza gli elementi dell'interfaccia utente in base allo stato di autenticazione
function initAuthUI() {
  const loginNavItem = document.getElementById("loginNavItem") // Elemento di navigazione per il login
  const registerNavItem = document.getElementById("registerNavItem") // Elemento di navigazione per la registrazione
  const profileNavItem = document.getElementById("profileNavItem") // Elemento di navigazione per il profilo
  const logoutNavItem = document.getElementById("logoutNavItem") // Elemento di navigazione per il logout

  // Mostra/nascondi gli elementi di navigazione in base allo stato di login
  const isLoggedIn = !!localStorage.getItem("currentUser") // Verifica se l'utente è connesso

  if (loginNavItem && registerNavItem) {
    loginNavItem.classList.toggle("d-none", isLoggedIn) // Nasconde il link di login se l'utente è connesso
    registerNavItem.classList.toggle("d-none", isLoggedIn) // Nasconde il link di registrazione se l'utente è connesso
  }

  if (profileNavItem && logoutNavItem) {
    profileNavItem.classList.toggle("d-none", !isLoggedIn) // Mostra il link del profilo se l'utente è connesso
    logoutNavItem.classList.toggle("d-none", !isLoggedIn) // Mostra il link di logout se l'utente è connesso
  }

  // Log dello stato di autenticazione corrente per il debug
  console.log("Auth state:", isLoggedIn ? "Logged in" : "Not logged in")
  if (isLoggedIn) {
    console.log("Current user:", JSON.parse(localStorage.getItem("currentUser"))) // Logga i dati dell'utente corrente
  }
  
  // Emetti un evento per informare altri componenti del cambiamento di stato
  dispatchAuthStateChangedEvent(isLoggedIn)
}

// Funzione per emettere evento authStateChanged
function dispatchAuthStateChangedEvent(isAuthenticated) {
  // Crea e dispatchare un evento personalizzato
  const authEvent = new CustomEvent("authStateChanged", {
    detail: { isAuthenticated } // Dettagli dell'evento con lo stato di autenticazione
  })
  document.dispatchEvent(authEvent) // Emette l'evento
  
  // Se è disponibile la funzione di aggiornamento della navbar mobile, chiamala
  if (typeof window.updateMobileNavUI === 'function') {
    window.updateMobileNavUI() // Aggiorna la navbar mobile se la funzione è definita
  }
}

// Controlla se l'utente è connesso
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include" // Includi i cookie per la sessione
    });
    const data = await response.json(); // Converte la risposta in formato JSON

    if (data.success) {
      // L'utente è connesso
      localStorage.setItem("currentUser", JSON.stringify(data.user)); // Salva i dati dell'utente in localStorage
      return true; // Restituisce true se l'utente è connesso
    } else {
      // L'utente non è connesso
      localStorage.removeItem("currentUser"); // Rimuove i dati dell'utente da localStorage
      return false; // Restituisce false se l'utente non è connesso
    }
  } catch (error) {
    console.error("Error checking auth status:", error); // Log dell'errore
    localStorage.removeItem("currentUser"); // Rimuove i dati dell'utente in caso di errore
    return false; // Restituisce false in caso di errore
  }
}

// Funzione di login
async function login(username, password, actionType = null) {
  const loginError = document.getElementById("loginError") // Elemento per mostrare errori di login

  // Valida gli input
  if (!username || !password) {
    showError(loginError, "Please enter both username and password") // Mostra errore se i campi sono vuoti
    return
  }

  try {
    // Invia la richiesta di login al server
    const response = await fetch("/api/auth/login", {
      method: "POST", // Metodo HTTP POST
      headers: {
        "Content-Type": "application/json", // Imposta il tipo di contenuto a JSON
      },
      body: JSON.stringify({ username, password }), // Converte le credenziali in formato JSON
      credentials: "include", // Importante per gestire cookie/sessions
    })

    const data = await response.json() // Converte la risposta in formato JSON

    if (data.success) {
      console.log("Login successful:", data.user) // Log per confermare il successo del login

      // Salva i dati dell'utente in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Chiudi il modal di login
      const loginModalElement = document.getElementById("loginModal")
      if (loginModalElement) {
        const bootstrap = window.bootstrap
        const loginModal = bootstrap.Modal.getInstance(loginModalElement) || new bootstrap.Modal(loginModalElement)
        
        // Nascondi il messaggio di login
        const loginMessage = document.getElementById("loginMessage")
        if (loginMessage) {
          loginMessage.classList.add("d-none") // Nasconde il messaggio di login
        }
        
        // Rimuovi eventuali backdrop esistenti
        const existingBackdrops = document.querySelectorAll('.modal-backdrop') // Seleziona tutti i backdrop esistenti
        existingBackdrops.forEach(backdrop => backdrop.remove()) // Rimuove i backdrop esistenti
        
        // Rimuovi la classe modal-open dal body
        document.body.classList.remove('modal-open') // Rimuove la classe modal-open dal body
        
        // Chiudi il modal
        loginModal.hide() // Chiude il modal di login
      }

      // Aggiorna l'interfaccia utente
      initAuthUI()

      // Gestisci diversi tipi di azione dopo il login
      if (actionType === "create") {
        console.log("Redirecting to game creation after login") // Log per indicare il reindirizzamento
        setTimeout(() => {
          showCreateGameModal() // Mostra il modal per creare un gioco
        }, 300)
      } else if (actionType === "join") {
        console.log("Redirecting to join game after login") // Log per indicare il reindirizzamento
        setTimeout(() => {
          openJoinGameModal() // Mostra il modal per unirsi a un gioco
        }, 300)
      } else if (window.location.pathname.includes("login.html")) {
        // Reindirizza alla home page se si trova nella pagina di login
        window.location.href = "index.html"
      } else {
        // Ricarica la pagina corrente per aggiornare l'interfaccia utente
        window.location.reload()
      }
    } else {
      showError(loginError, data.message || "Login failed. Please check your credentials.") // Mostra errore se il login fallisce
    }
  } catch (error) {
    console.error("Login error:", error) // Log dell'errore
    showError(loginError, "An error occurred. Please try again later.") // Mostra errore generico
  }
}

// Funzione di registrazione
async function register(username, email, password, confirmPassword) {
  const registerError = document.getElementById("registerError") // Elemento per mostrare errori di registrazione

  // Valida gli input
  if (!username || !email || !password || !confirmPassword) {
    showError(registerError, "Please fill in all fields") // Mostra errore se i campi sono vuoti
    return
  }

  if (password !== confirmPassword) {
    showError(registerError, "Passwords do not match") // Mostra errore se le password non corrispondono
    return
  }

  // Valida il formato dell'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Regex per validare l'email
  if (!emailRegex.test(email)) {
    showError(registerError, "Please enter a valid email address") // Mostra errore se l'email non è valida
    return
  }

  try {
    // Invia la richiesta di registrazione al server
    const response = await fetch("/api/auth/register", {
      method: "POST", // Metodo HTTP POST
      headers: {
        "Content-Type": "application/json", // Imposta il tipo di contenuto a JSON
      },
      body: JSON.stringify({ username, email, password, confirmPassword }), // Converte i dati della registrazione in formato JSON
      credentials: "include", // Importante per gestire cookie/sessions
    })

    const data = await response.json() // Converte la risposta in formato JSON

    if (data.success) {
      console.log("Registration successful:", data.user) // Log per confermare il successo della registrazione

      // Salva i dati dell'utente in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Chiudi il modal di registrazione
      const registerModalElement = document.getElementById("registerModal")
      if (registerModalElement) {
        const bootstrap = window.bootstrap
        const registerModal = new bootstrap.Modal(registerModalElement)
        registerModal.hide() // Chiude il modal di registrazione
      }

      // Aggiorna l'interfaccia utente
      initAuthUI()

      // Mostra messaggio di successo o reindirizza
      alert("Registration successful! Welcome to TriviX.") // Mostra messaggio di successo

      // Ricarica la pagina corrente per aggiornare l'interfaccia utente
      window.location.reload()
    } else {
      showError(registerError, data.message || "Registration failed. Please try again.") // Mostra errore se la registrazione fallisce
    }
  } catch (error) {
    console.error("Registration error:", error) // Log dell'errore
    showError(registerError, "An error occurred. Please try again later.") // Mostra errore generico
  }
}

// Funzione di logout
async function logout() {
  try {
    // Invia la richiesta di logout al server
    const response = await fetch("/api/auth/logout", {
      method: "POST", // Metodo HTTP POST
      credentials: "include", // Importante per gestire cookie/sessions
    })

    // Pulisci i dati dell'utente da localStorage
    localStorage.removeItem("currentUser")

    // Aggiorna l'interfaccia utente
    initAuthUI()
    
    // Notifica esplicitamente del cambiamento di stato di autenticazione
    dispatchAuthStateChangedEvent(false)

    // Reindirizza alla home page
    window.location.href = "index.html"
  } catch (error) {
    console.error("Logout error:", error) // Log dell'errore
    // Pulisci comunque il local storage e reindirizza anche se la richiesta al server fallisce
    localStorage.removeItem("currentUser")
    // Notifica esplicitamente del cambiamento di stato di autenticazione
    dispatchAuthStateChangedEvent(false)
    window.location.href = "index.html"
  }
}

// Funzione per aggiornare il profilo
async function updateProfile(username, email, password, avatar) {
  const editProfileError = document.getElementById("editProfileError") // Elemento per mostrare errori di aggiornamento profilo
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) // Ottiene i dati dell'utente corrente

  if (!currentUser) {
    showError(editProfileError, "You must be logged in to update your profile") // Mostra errore se l'utente non è connesso
    return
  }

  // Valida gli input
  if (!username || !email) {
    showError(editProfileError, "Username and email are required") // Mostra errore se username o email sono vuoti
    return
  }

  // Valida il formato dell'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Regex per validare l'email
  if (!emailRegex.test(email)) {
    showError(editProfileError, "Please enter a valid email address") // Mostra errore se l'email non è valida
    return
  }

  // Prepara i dati del profilo
  const profileData = {
    username,
    email,
    avatar,
  }

  // Aggiungi la password se fornita
  if (password) {
    profileData.password = password // Aggiunge la password ai dati del profilo
  }

  try {
    // Invia la richiesta di aggiornamento profilo al server
    const response = await fetch("/api/auth/profile", {
      method: "PUT", // Metodo HTTP PUT
      headers: {
        "Content-Type": "application/json", // Imposta il tipo di contenuto a JSON
      },
      body: JSON.stringify(profileData), // Converte i dati del profilo in formato JSON
      credentials: "include", // Importante per gestire cookie/sessions
    })

    const data = await response.json() // Converte la risposta in formato JSON

    if (data.success) {
      // Aggiorna i dati dell'utente memorizzati
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Chiudi il modal in modo sicuro
      const editProfileModalElement = document.getElementById("editProfileModal")
      if (editProfileModalElement) {
        const editProfileModal = bootstrap.Modal.getInstance(editProfileModalElement) || new bootstrap.Modal(editProfileModalElement)
        editProfileModal.hide() // Chiude il modal di modifica profilo
      }

      // Aggiorna l'interfaccia utente
      updateProfileUI(data.user)

      // Mostra messaggio di successo
      alert("Profile updated successfully!") // Mostra messaggio di successo
      location.reload() // Ricarica la pagina
    } else {
      showError(editProfileError, data.message || "Failed to update profile. Please try again.") // Mostra errore se l'aggiornamento fallisce
    }
  } catch (error) {
    console.error("Update profile error:", error) // Log dell'errore
    if (editProfileError) {
      showError(editProfileError, "An error occurred. Please try again later.") // Mostra errore generico
    }
  }
}

// Gestisci il caricamento dell'avatar
function handleAvatarUpload(e) {
  const file = e.target.files[0]; // Ottiene il file caricato
  if (!file || !file.type.startsWith("image/")) return alert("Seleziona un'immagine valida"); // Controlla se il file è un'immagine valida

  const reader = new FileReader(); // Crea un FileReader per leggere il file
  reader.onload = function (event) {
    const img = new Image(); // Crea un nuovo oggetto immagine
    img.onload = function () {
      const canvas = document.createElement("canvas"); // Crea un canvas per ridimensionare l'immagine
      const ctx = canvas.getContext("2d"); // Ottiene il contesto 2D del canvas

      // Imposta la dimensione desiderata (es. max 200x200)
      const maxSize = 200; // Dimensione massima
      let width = img.width; // Larghezza originale
      let height = img.height; // Altezza originale

      // Ridimensiona l'immagine mantenendo le proporzioni
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width; // Calcola l'altezza proporzionale
          width = maxSize; // Imposta la larghezza massima
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height; // Calcola la larghezza proporzionale
          height = maxSize; // Imposta l'altezza massima
        }
      }

      canvas.width = width; // Imposta la larghezza del canvas
      canvas.height = height; // Imposta l'altezza del canvas
      ctx.drawImage(img, 0, 0, width, height); // Disegna l'immagine sul canvas

      // Converti in base64 con qualità ridotta
      const dataURL = canvas.toDataURL("image/jpeg", 0.4); // Converte il canvas in un URL base64

      document.getElementById("editProfileAvatar").src = dataURL; // Aggiorna l'anteprima dell'avatar
    };
    img.src = event.target.result; // Imposta la sorgente dell'immagine
  };
  reader.readAsDataURL(file); // Legge il file come URL di dati
}

// Aggiorna l'interfaccia utente del profilo
function updateProfileUI(userData) {
  // Aggiorna gli elementi del profilo se esistono
  const profileElements = {
    username: document.getElementById("profileUsername"), // Elemento per il nome utente
    email: document.getElementById("profileEmail"), // Elemento per l'email
    avatar: document.getElementById("profileAvatar"), // Elemento per l'avatar
    gamesPlayed: document.getElementById("gamesPlayed"), // Elemento per le partite giocate
    gamesWon: document.getElementById("gamesWon"), // Elemento per le partite vinte
    correctAnswers: document.getElementById("correctAnswers"), // Elemento per le risposte corrette
    categoryStats: document.getElementById("categoryStats"), // Elemento per le statistiche per categoria
  }

  if (profileElements.username) {
    profileElements.username.textContent = userData.username // Aggiorna il nome utente
  }

  if (profileElements.email) {
    profileElements.email.textContent = userData.email // Aggiorna l'email
  }

  if (profileElements.avatar && userData.profile && userData.profile.avatar) {
    profileElements.avatar.src = userData.profile.avatar // Aggiorna l'avatar
  }

  // Aggiorna le statistiche se esistono
  if (userData.profile && userData.profile.stats) {
    const stats = userData.profile.stats // Ottiene le statistiche dell'utente

    if (profileElements.gamesPlayed) {
      profileElements.gamesPlayed.textContent = stats.gamesPlayed || 0 // Aggiorna le partite giocate
    }

    if (profileElements.gamesWon) {
      profileElements.gamesWon.textContent = stats.gamesWon || 0 // Aggiorna le partite vinte
    }

    if (profileElements.correctAnswers) {
      profileElements.correctAnswers.textContent = stats.correctAnswers || 0 // Aggiorna le risposte corrette
    }
  }

  // Aggiorna le prestazioni per categoria
  if (profileElements.categoryStats && userData.profile && userData.profile.categoryPerformance) {
    const categoryPerformance = userData.profile.categoryPerformance // Ottiene le prestazioni per categoria
    let categoryStatsHTML = "" // Inizializza la variabile per il contenuto HTML delle statistiche

    // Definisci icone e colori per le categorie
    const categories = {
      science: { icon: "flask", color: "#3498db" }, // Categoria scienza
      entertainment: { icon: "film", color: "#9b59b6" }, // Categoria intrattenimento
      sports: { icon: "futbol", color: "#2ecc71" }, // Categoria sport
      art: { icon: "palette", color: "#f1c40f" }, // Categoria arte
      geography: { icon: "globe-americas", color: "#e67e22" }, // Categoria geografia
      history: { icon: "landmark", color: "#e74c3c" }, // Categoria storia
    }

    // Genera HTML per ciascuna categoria
    Object.keys(categories).forEach((category) => {
      const performance = categoryPerformance[category] || { correct: 0, total: 0 } // Ottiene le prestazioni per categoria
      const percentage = performance.total > 0 ? Math.round((performance.correct / performance.total) * 100) : 0 // Calcola la percentuale di risposte corrette

      categoryStatsHTML += `
        <div class="category-item mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div>
              <i class="fas fa-${categories[category].icon}" style="color: ${categories[category].color}"></i>
              <span class="ms-2">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </div>
            <span>${performance.correct}/${performance.total} (${percentage}%)</span>
          </div>
          <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${categories[category].color}" 
              aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `
    })

    profileElements.categoryStats.innerHTML = categoryStatsHTML // Aggiorna il contenuto HTML delle statistiche per categoria
  }
}

// Funzione helper per mostrare messaggi di errore
function showError(element, message) {
  if (element) {
    element.textContent = message // Imposta il messaggio di errore
    element.classList.remove("d-none") // Rimuove la classe d-none per mostrare l'errore
  }
}

// Imposta i listener per i moduli di autenticazione
function setupAuthListeners() {
  // Invio del modulo di login
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault() // Previene il comportamento predefinito del modulo

      const username = document.getElementById("username").value // Ottiene il valore dello username
      const password = document.getElementById("password").value // Ottiene il valore della password

      // Controlla se c'è un messaggio di login e determina il tipo di azione
      const loginMessage = document.getElementById("loginMessage")
      let actionType = null
      
      if (loginMessage && !loginMessage.classList.contains("d-none")) {
        if (loginMessage.textContent.includes("creare una nuova partita")) {
          actionType = "create" // Imposta il tipo di azione su "create"
        } else if (loginMessage.textContent.includes("unirti a una partita")) {
          actionType = "join" // Imposta il tipo di azione su "join"
        }
      }

      login(username, password, actionType) // Chiama la funzione di login
    })
  }

  // Invio del modulo di registrazione
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault() // Previene il comportamento predefinito del modulo

      const username = document.getElementById("registerUsername").value // Ottiene il valore dello username
      const email = document.getElementById("registerEmail").value // Ottiene il valore dell'email
      const password = document.getElementById("registerPassword").value // Ottiene il valore della password
      const confirmPassword = document.getElementById("registerConfirmPassword").value // Ottiene il valore della conferma password

      register(username, email, password, confirmPassword) // Chiama la funzione di registrazione
    })
  }

  // Click sul pulsante di logout
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault() // Previene il comportamento predefinito del pulsante
      logout() // Chiama la funzione di logout
    })
  }

  // Modulo di modifica profilo
  const editProfileForm = document.getElementById("editProfileForm")
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault() // Previene il comportamento predefinito del modulo

      const username = document.getElementById("editUsername").value // Ottiene il valore dello username
      const email = document.getElementById("editEmail").value // Ottiene il valore dell'email
      const password = document.getElementById("editPassword").value // Ottiene il valore della password
      const avatar = document.getElementById("editProfileAvatar").src // Ottiene l'URL dell'avatar

      updateProfile(username, email, password, avatar) // Chiama la funzione di aggiornamento profilo
    })
  }

  // Caricamento dell'avatar
  const avatarUpload = document.getElementById("avatarUpload")
  if (avatarUpload) {
    avatarUpload.addEventListener("change", handleAvatarUpload) // Chiama la funzione di gestione del caricamento dell'avatar
  }

  // Pulsante di modifica profilo
  const editProfileBtn = document.getElementById("editProfileBtn")
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser")) // Ottiene i dati dell'utente corrente

      if (!currentUser) return // Se non c'è un utente corrente, esci dalla funzione

      // Popola il modulo di modifica con i dati dell'utente corrente
      document.getElementById("editUsername").value = currentUser.username // Imposta il valore dello username
      document.getElementById("editEmail").value = currentUser.email // Imposta il valore dell'email
      document.getElementById("editPassword").value = "" // Pulisce il campo della password

      // Aggiorna l'anteprima dell'avatar
      if (currentUser.profile && currentUser.profile.avatar) {
        document.getElementById("editProfileAvatar").src = currentUser.profile.avatar // Imposta l'anteprima dell'avatar
      }

      // Mostra il modal di modifica profilo
      const editProfileModalElement = document.getElementById("editProfileModal")
      if (editProfileModalElement) {
        const bootstrap = window.bootstrap
        const editProfileModal = new bootstrap.Modal(editProfileModalElement)
        editProfileModal.show() // Mostra il modal di modifica profilo
      }
    })
  }
}

