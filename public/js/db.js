// Database module for handling user data
const DB = {
    // Inizializza il database
    init() {
        // Controlla se localStorage è disponibile
        if (typeof localStorage === "undefined") {
            console.error("localStorage is not available in this browser");
            return false; // Restituisce false se localStorage non è disponibile
        }

        // Inizializza il database degli utenti se non esiste
        if (!localStorage.getItem("trivix_users")) {
            localStorage.setItem("trivix_users", JSON.stringify([])); // Imposta un array vuoto
        }

        return true; // Restituisce true se l'inizializzazione ha successo
    },

    // Ottiene tutti gli utenti
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem("trivix_users") || "[]"); // Restituisce gli utenti come array
        } catch (error) {
            console.error("Error getting users:", error); // Gestisce eventuali errori
            return []; // Restituisce un array vuoto in caso di errore
        }
    },

    // Salva gli utenti nel database
    saveUsers(users) {
        try {
            localStorage.setItem("trivix_users", JSON.stringify(users)); // Salva gli utenti nel localStorage
            return true; // Restituisce true se il salvataggio ha successo
        } catch (error) {
            console.error("Error saving users:", error); // Gestisce eventuali errori
            return false; // Restituisce false in caso di errore
        }
    },

    // Trova un utente per nome utente
    findUserByUsername(username) {
        const users = this.getUsers(); // Ottiene tutti gli utenti
        return users.find((user) => user.username.toLowerCase() === username.toLowerCase()); // Restituisce l'utente trovato
    },

    // Trova un utente per email
    findUserByEmail(email) {
        const users = this.getUsers(); // Ottiene tutti gli utenti
        return users.find((user) => user.email.toLowerCase() === email.toLowerCase()); // Restituisce l'utente trovato
    },

    // Aggiunge un nuovo utente
    addUser(userData) {
        const users = this.getUsers(); // Ottiene tutti gli utenti

        // Controlla se il nome utente o l'email esistono già
        if (this.findUserByUsername(userData.username)) {
            return { success: false, message: "Username already exists" }; // Restituisce errore se il nome utente esiste
        }

        if (this.findUserByEmail(userData.email)) {
            return { success: false, message: "Email already exists" }; // Restituisce errore se l'email esiste
        }

        // Crea un oggetto utente con dati di profilo predefiniti
        const newUser = {
            id: Date.now().toString(), // Genera un ID unico basato sul timestamp
            username: userData.username,
            email: userData.email,
            password: userData.password, // In un'app reale, questa dovrebbe essere crittografata
            createdAt: new Date().toISOString(), // Data di creazione
            profile: {
                avatar: "img/default-avatar.png", // Avatar predefinito
                stats: {
                    gamesPlayed: 0, // Giocati
                    gamesWon: 0, // Vinti
                    correctAnswers: 0, // Risposte corrette
                },
                categoryPerformance: {
                    science: { correct: 0, total: 0 }, // Statistiche per la categoria scienza
                    entertainment: { correct: 0, total: 0 }, // Statistiche per la categoria intrattenimento
                    sports: { correct: 0, total: 0 }, // Statistiche per la categoria sport
                    art: { correct: 0, total: 0 }, // Statistiche per la categoria arte
                    geography: { correct: 0, total: 0 }, // Statistiche per la categoria geografia
                    history: { correct: 0, total: 0 }, // Statistiche per la categoria storia
                },
            },
        };

        // Aggiunge l'utente al database
        users.push(newUser);
        this.saveUsers(users); // Salva gli utenti aggiornati

        // Restituisce successo senza la password
        const { password, ...userWithoutPassword } = newUser; // Esclude la password dalla risposta
        return { success: true, user: userWithoutPassword }; // Restituisce l'utente creato
    },

    // Autentica un utente
    authenticateUser(username, password) {
        const user = this.findUserByUsername(username); // Trova l'utente per nome utente

        if (!user) {
            return { success: false, message: "User not found" }; // Restituisce errore se l'utente non esiste
        }

        if (user.password !== password) {
            // In un'app reale, confronta le password crittografate
            return { success: false, message: "Incorrect password" }; // Restituisce errore se la password è errata
        }

        // Restituisce i dati dell'utente senza la password
        const { password: pwd, ...userWithoutPassword } = user; // Esclude la password dalla risposta
        return { success: true, user: userWithoutPassword }; // Restituisce l'utente autenticato
    },

    // Aggiorna il profilo utente
    updateUserProfile(userId, profileData) {
        const users = this.getUsers(); // Ottiene tutti gli utenti
        const userIndex = users.findIndex((user) => user.id === userId); // Trova l'indice dell'utente

        if (userIndex === -1) {
            return { success: false, message: "User not found" }; // Restituisce errore se l'utente non esiste
        }

        // Aggiorna i dati del profilo
        users[userIndex].profile = {
            ...users[userIndex].profile,
            ...profileData,
        };

        // Se il nome utente o l'email vengono aggiornati, controlla i duplicati
        if (profileData.username && profileData.username !== users[userIndex].username) {
            if (this.findUserByUsername(profileData.username)) {
                return { success: false, message: "Username already exists" }; // Restituisce errore se il nome utente esiste
            }
            users[userIndex].username = profileData.username; // Aggiorna il nome utente
        }

        if (profileData.email && profileData.email !== users[userIndex].email) {
            if (this.findUserByEmail(profileData.email)) {
                return { success: false, message: "Email already exists" }; // Restituisce errore se l'email esiste
            }
            users[userIndex].email = profileData.email; // Aggiorna l'email
        }

        // Aggiorna la password se fornita
        if (profileData.password) {
            users[userIndex].password = profileData.password; // In un'app reale, questa dovrebbe essere crittografata
        }

        this.saveUsers(users); // Salva gli utenti aggiornati

        // Restituisce l'utente aggiornato senza la password
        const { password, ...userWithoutPassword } = users[userIndex]; // Esclude la password dalla risposta
        return { success: true, user: userWithoutPassword }; // Restituisce l'utente aggiornato
    },

    // Aggiorna le statistiche di gioco
    updateGameStats(userId, gameStats) {
        const users = this.getUsers(); // Ottiene tutti gli utenti
        const userIndex = users.findIndex((user) => user.id === userId); // Trova l'indice dell'utente

        if (userIndex === -1) {
            return { success: false, message: "User not found" }; // Restituisce errore se l'utente non esiste
        }

        // Aggiorna le statistiche di gioco
        const userStats = users[userIndex].profile.stats;
        userStats.gamesPlayed = (userStats.gamesPlayed || 0) + (gameStats.gamesPlayed || 0); // Aggiorna i giochi giocati
        userStats.gamesWon = (userStats.gamesWon || 0) + (gameStats.gamesWon || 0); // Aggiorna i giochi vinti
        userStats.correctAnswers = (userStats.correctAnswers || 0) + (gameStats.correctAnswers || 0); // Aggiorna le risposte corrette

        // Aggiorna le prestazioni per categoria se fornite
        if (gameStats.categoryPerformance) {
            Object.keys(gameStats.categoryPerformance).forEach((category) => {
                if (!users[userIndex].profile.categoryPerformance[category]) {
                    users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 }; // Inizializza se non esiste
                }

                users[userIndex].profile.categoryPerformance[category].correct +=
                    gameStats.categoryPerformance[category].correct || 0; // Aggiorna le risposte corrette per categoria
                users[userIndex].profile.categoryPerformance[category].total +=
                    gameStats.categoryPerformance[category].total || 0; // Aggiorna il totale per categoria
            });
        }

        this.saveUsers(users); // Salva gli utenti aggiornati

        return { success: true }; // Restituisce successo
    },

    // Ottiene un utente per ID
    getUserById(userId) {
        const users = this.getUsers(); // Ottiene tutti gli utenti
        const user = users.find((user) => user.id === userId); // Trova l'utente per ID

        if (!user) {
            return { success: false, message: "User not found" }; // Restituisce errore se l'utente non esiste
        }

        // Restituisce l'utente senza la password
        const { password, ...userWithoutPassword } = user; // Esclude la password dalla risposta
        return { success: true, user: userWithoutPassword }; // Restituisce l'utente trovato
    },
};

// Inizializza il database al caricamento
DB.init();