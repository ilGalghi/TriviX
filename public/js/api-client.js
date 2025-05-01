// API client for making requests to the server
const API = {
  // Base URL for API requests (empty for relative URLs)
  baseUrl: "", // URL di base per le richieste API, vuoto per URL relativi

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/api/${endpoint}`; // Costruisce l'URL completo per la richiesta API

    // Default headers
    const headers = {
      "Content-Type": "application/json", // Imposta il tipo di contenuto a JSON
      ...options.headers, // Aggiunge eventuali intestazioni personalizzate fornite nelle opzioni
    };

    try {
      const response = await fetch(url, {
        ...options, // Aggiunge le opzioni fornite (metodo, body, etc.)
        headers, // Aggiunge le intestazioni
        credentials: "include", // Importante per gestire cookie/sessions
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`); // Lancia un errore se la risposta non è OK
      }

      const data = await response.json(); // Converte la risposta in formato JSON
      return data; // Restituisce i dati ricevuti
    } catch (error) {
      console.error(`Url: ${url}.\nAPI error for ${endpoint}:`, error); // Log dell'errore con l'URL e l'endpoint
      throw error; // Rilancia l'errore
    }
  },

  // Auth methods
  auth: {
    // Register a new user
    async register(userData) {
      return API.request("auth/register", { // Richiesta per registrare un nuovo utente
        method: "POST", // Metodo HTTP POST
        body: JSON.stringify(userData), // Converte i dati dell'utente in formato JSON
      });
    },

    // Login a user
    async login(credentials) {
      return API.request("auth/login", { // Richiesta per il login di un utente
        method: "POST", // Metodo HTTP POST
        body: JSON.stringify(credentials), // Converte le credenziali in formato JSON
      });
    },

    // Get current user
    async getCurrentUser() {
      return API.request("auth/me"); // Richiesta per ottenere i dati dell'utente attualmente autenticato
    },

    // Logout
    async logout() {
      return API.request("auth/logout", { // Richiesta per disconnettere l'utente
        method: "POST", // Metodo HTTP POST
      });
    },

    // Update profile
    async updateProfile(profileData) {
      return API.request("auth/profile", { // Richiesta per aggiornare il profilo dell'utente
        method: "PUT", // Metodo HTTP PUT
        body: JSON.stringify(profileData), // Converte i dati del profilo in formato JSON
      });
    },

    // Update game stats
    async updateStats(statsData) {
      return API.request("auth/stats", { // Richiesta per aggiornare le statistiche di gioco dell'utente
        method: "PUT", // Metodo HTTP PUT
        body: JSON.stringify(statsData), // Converte i dati delle statistiche in formato JSON
      });
    },
  },

  // Game methods
  games: {
    // Create a new game
    async createGame(userId, gameCode, maxRounds) {
      console.log("Creating game for user:", userId); // Log per indicare che si sta creando un gioco per l'utente
      try {
        const response = await API.request("games/create", { // Richiesta per creare un nuovo gioco
          method: "POST", // Metodo HTTP POST
          body: JSON.stringify({ userId, gameCode, maxRounds }), // Converte i dati del gioco in formato JSON
        });
        console.log("Game created successfully:", response); // Log per confermare che il gioco è stato creato con successo
        return response; // Restituisce la risposta del server
      } catch (error) {
        console.error("Failed to create game:", error); // Log dell'errore se la creazione del gioco fallisce
        throw error; // Rilancia l'errore
      }
    },

    // Other game-related API calls can go here
  },
};