const fs = require("fs").promises // Importa il modulo fs per operazioni di file in modo promisificato
const path = require("path") // Importa il modulo path per gestire i percorsi dei file
const bcrypt = require("bcryptjs") // Importa bcrypt per la gestione delle password in modo sicuro
const { v4: uuidv4 } = require("uuid") // Importa uuid per generare ID unici per gli utenti

// Percorso al file JSON che contiene i dati degli utenti
const usersFilePath = path.join(__dirname, "../data/users.json") // Definisce il percorso al file JSON degli utenti

// Assicurati che la directory data esista
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, "../data") // Percorso della directory data
  try {
    await fs.access(dataDir) // Controlla se la directory esiste
  } catch (error) {
    // La directory non esiste, creala
    await fs.mkdir(dataDir, { recursive: true }) // Crea la directory se non esiste
  }
}

// Leggi gli utenti dal file JSON
async function readUsers() {
  try {
    await ensureDataDirectory() // Assicura che la directory esista

    try {
      const data = await fs.readFile(usersFilePath, "utf8") // Legge il file JSON degli utenti
      return JSON.parse(data) // Restituisce i dati come oggetto JavaScript
    } catch (error) {
      // Se il file non esiste o è vuoto, restituisci un array vuoto
      if (error.code === "ENOENT" || error.message.includes("Unexpected end of JSON input")) {
        return [] // Restituisce un array vuoto se il file non esiste o è vuoto
      }
      throw error // Rilancia l'errore se diverso
    }
  } catch (error) {
    console.error("Errore nella lettura degli utenti:", error) // Log dell'errore
    return [] // Restituisce un array vuoto in caso di errore
  }
}

// Scrivi gli utenti nel file JSON
async function writeUsers(users) {
  try {
    await ensureDataDirectory() // Assicura che la directory esista
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8") // Scrive gli utenti nel file JSON
    return true // Restituisce true se la scrittura ha successo
  } catch (error) {
    console.error("Errore nella scrittura degli utenti:", error) // Log dell'errore
    return false // Restituisce false in caso di errore
  }
}

// Trova un utente per username
async function findUserByUsername(username) {
  const users = await readUsers() // Legge gli utenti
  return users.find((user) => user.username.toLowerCase() === username.toLowerCase()) // Restituisce l'utente con lo username corrispondente
}

// Trova un utente per email
async function findUserByEmail(email) {
  const users = await readUsers() // Legge gli utenti
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) // Restituisce l'utente con l'email corrispondente
}

// Trova un utente per ID
async function findUserById(id) {
  try {
    const users = await readUsers() // Legge gli utenti
    const user = users.find((user) => user.id === id) // Trova l'utente per ID

    if (!user) {
      console.log(`User with ID ${id} not found`) // Log se l'utente non viene trovato
    }

    return user // Restituisce l'utente trovato
  } catch (error) {
    console.error("Error finding user by ID:", error) // Log dell'errore
    return null // Restituisce null in caso di errore
  }
}

// Aggiungi un nuovo utente
async function addUser(userData) {
  const users = await readUsers() // Legge gli utenti esistenti

  // Controlla se username o email esistono già
  const existingUsername = await findUserByUsername(userData.username) // Controlla se lo username esiste già
  if (existingUsername) {
    return { success: false, message: "Username già esistente" } // Restituisce errore se lo username esiste
  }

  const existingEmail = await findUserByEmail(userData.email) // Controlla se l'email esiste già
  if (existingEmail) {
    return { success: false, message: "Email già esistente" } // Restituisce errore se l'email esiste
  }

  // Crea l'hash della password
  const salt = await bcrypt.genSalt(10) // Genera un sale per l'hashing della password
  const hashedPassword = await bcrypt.hash(userData.password, salt) // Hash della password fornita dall'utente

  // Crea un nuovo utente con dati di profilo predefiniti
  const newUser = {
    id: uuidv4(), // Genera un ID unico per il nuovo utente
    username: userData.username, // Assegna lo username fornito
    email: userData.email, // Assegna l'email fornita
    password: hashedPassword, // Assegna la password hashata
    createdAt: new Date().toISOString(), // Data di creazione dell'utente in formato ISO
    profile: { // Dati del profilo predefiniti
      avatar: "/img/default-avatar.png", // Avatar predefinito
      stats: { // Statistiche di gioco predefinite
        gamesPlayed: 0, // Numero di partite giocate
        gamesWon: 0, // Numero di partite vinte
        correctAnswers: 0, // Numero di risposte corrette
        points: 0, // Punti totali
      },
      categoryPerformance: { // Prestazioni per categoria predefinite
        science: { correct: 0, total: 0 }, // Prestazioni nella categoria scienza
        entertainment: { correct: 0, total: 0 }, // Prestazioni nella categoria intrattenimento
        sports: { correct: 0, total: 0 }, // Prestazioni nella categoria sport
        art: { correct: 0, total: 0 }, // Prestazioni nella categoria arte
        geography: { correct: 0, total: 0 }, // Prestazioni nella categoria geografia
        history: { correct: 0, total: 0 }, // Prestazioni nella categoria storia
      },
    },
  }

  // Aggiungi l'utente all'array e salva nel file
  users.push(newUser) // Aggiunge il nuovo utente all'array degli utenti
  await writeUsers(users) // Scrive gli utenti aggiornati nel file JSON

  // Restituisci il successo senza la password
  const { password, ...userWithoutPassword } = newUser // Rimuove la password dall'oggetto utente
  return { success: true, user: userWithoutPassword } // Restituisce il nuovo utente senza la password
}

// Autentica un utente
async function authenticateUser(username, password) {
  const user = await findUserByUsername(username) // Trova l'utente per username

  if (!user) {
    return { success: false, message: "Utente non trovato" } // Restituisce errore se l'utente non esiste
  }

  const isMatch = await bcrypt.compare(password, user.password) // Confronta la password fornita con quella hashata
  if (!isMatch) {
    return { success: false, message: "Password non corretta" } // Restituisce errore se la password non corrisponde
  }

  // Restituisci i dati dell'utente senza la password
  const { password: pwd, ...userWithoutPassword } = user // Rimuove la password dall'oggetto utente
  return { success: true, user: userWithoutPassword } // Restituisce l'utente autenticato senza la password
}

// Aggiorna il profilo dell'utente
async function updateUserProfile(userId, profileData) {
  const users = await readUsers() // Legge gli utenti
  const userIndex = users.findIndex((user) => user.id === userId) // Trova l'indice dell'utente per ID

  if (userIndex === -1) {
    return { success: false, message: "Utente non trovato" } // Restituisce errore se l'utente non viene trovato
  }

  // Aggiorna i dati del profilo
  if (profileData.username && profileData.username !== users[userIndex].username) {
    const existingUser = users.find(
      (u) => u.id !== userId && u.username.toLowerCase() === profileData.username.toLowerCase(),
    ) // Controlla se lo username esiste già
    if (existingUser) {
      return { success: false, message: "Username già esistente" } // Restituisce errore se lo username esiste
    }
    users[userIndex].username = profileData.username // Aggiorna lo username
  }

  if (profileData.email && profileData.email !== users[userIndex].email) {
    const existingUser = users.find((u) => u.id !== userId && u.email.toLowerCase() === profileData.email.toLowerCase()) // Controlla se l'email esiste già
    if (existingUser) {
      return { success: false, message: "Email già esistente" } // Restituisce errore se l'email esiste
    }
    users[userIndex].email = profileData.email // Aggiorna l'email
  }

  // Aggiorna la password se fornita
  if (profileData.password) {
    const salt = await bcrypt.genSalt(10) // Genera un salt per l'hashing
    users[userIndex].password = await bcrypt.hash(profileData.password, salt) // Hash della nuova password
  }

  // Aggiorna l'avatar se fornito
  if (profileData.profile && profileData.profile.avatar) {
    let avatar = profileData.profile.avatar;
    
    // Converti URL assoluti in percorsi relativi per gli avatar
    // Se è un URL assoluto con un host (come https://...)
    const urlPattern = /^(https?:\/\/[^\/]+)(\/img\/.*)/i;
    const match = avatar.match(urlPattern);
    
    if (match) {
      // Estrai solo il percorso relativo
      avatar = match[2];
    }
    
    users[userIndex].profile.avatar = avatar; // Aggiorna l'avatar
  }

  // Salva le modifiche
  await writeUsers(users) // Scrive gli utenti aggiornati nel file

  // Restituisci l'utente aggiornato senza la password
  const { password, ...userWithoutPassword } = users[userIndex] // Rimuove la password dall'oggetto utente
  return { success: true, user: userWithoutPassword } // Restituisce l'utente aggiornato senza la password
}

// Aggiorna le statistiche di gioco
async function updateGameStats(userId, gameStats) {
  const users = await readUsers() // Legge gli utenti
  const userIndex = users.findIndex((user) => user.id === userId) // Trova l'indice dell'utente per ID

  if (userIndex === -1) {
    return { success: false, message: "Utente non trovato" } // Restituisce errore se l'utente non viene trovato
  }

  // Aggiorna le statistiche di gioco
  const userStats = users[userIndex].profile.stats // Ottiene le statistiche dell'utente
  // Assegna direttamente i nuovi valori forniti in gameStats
  userStats.gamesPlayed = gameStats.gamesPlayed !== undefined ? gameStats.gamesPlayed : (userStats.gamesPlayed || 0) // Aggiorna le partite giocate
  userStats.gamesWon = gameStats.gamesWon !== undefined ? gameStats.gamesWon : (userStats.gamesWon || 0) // Aggiorna le partite vinte
  userStats.correctAnswers = gameStats.correctAnswers !== undefined ? gameStats.correctAnswers : (userStats.correctAnswers || 0) // Aggiorna le risposte corrette
  userStats.points = gameStats.points !== undefined ? gameStats.points : (userStats.points || 0) // Aggiorna i punti
  
  // Aggiorna le prestazioni per categoria se fornite
  if (gameStats.categoryPerformance) {
    Object.keys(gameStats.categoryPerformance).forEach((category) => {
      if (!users[userIndex].profile.categoryPerformance[category]) {
        users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 } // Inizializza le prestazioni per categoria se non esistono
      }

      users[userIndex].profile.categoryPerformance[category].correct +=
        gameStats.categoryPerformance[category].correct || 0 // Aggiorna le risposte corrette per categoria
      users[userIndex].profile.categoryPerformance[category].total += gameStats.categoryPerformance[category].total || 0 // Aggiorna il totale delle risposte per categoria
    })
  }

  // Salva le modifiche
  await writeUsers(users) // Scrive gli utenti aggiornati nel file

  return { success: true } // Restituisce successo
}

// Aggiorna le prestazioni dell'utente per una singola categoria
async function updateCategoryPerformance(userId, category, isCorrect) {
  try {
    const users = await readUsers(); // Legge gli utenti
    const userIndex = users.findIndex((user) => user.id === userId); // Trova l'indice dell'utente per ID

    if (userIndex === -1) {
      return { success: false, message: "Utente non trovato" }; // Restituisce errore se l'utente non viene trovato
    }

    // Assicurati che l'oggetto categoryPerformance esista
    if (!users[userIndex].profile.categoryPerformance) {
      users[userIndex].profile.categoryPerformance = {}; // Inizializza l'oggetto categoryPerformance se non esiste
    }

    // Assicurati che la categoria esista nell'oggetto categoryPerformance
    if (!users[userIndex].profile.categoryPerformance[category]) {
      users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 }; // Inizializza la categoria se non esiste
    }

    // Incrementa il contatore delle risposte totali
    users[userIndex].profile.categoryPerformance[category].total += 1; // Incrementa il totale delle risposte

    // Se la risposta è corretta, incrementa anche il contatore delle risposte corrette
    if (isCorrect) {
      users[userIndex].profile.categoryPerformance[category].correct += 1; // Incrementa le risposte corrette
      // Aggiorna immediatamente il contatore globale delle risposte corrette
      users[userIndex].profile.stats.correctAnswers = (users[userIndex].profile.stats.correctAnswers || 0) + 1; // Incrementa le risposte corrette globali
    }

    // Salva le modifiche
    await writeUsers(users); // Scrive gli utenti aggiornati nel file

    console.log(`Prestazioni aggiornate per utente ${userId}, categoria ${category}, risposta corretta: ${isCorrect}`); // Log delle prestazioni aggiornate
    console.log("Nuovi valori:", users[userIndex].profile.categoryPerformance[category]); // Log dei nuovi valori delle prestazioni

    return { 
      success: true, 
      categoryPerformance: users[userIndex].profile.categoryPerformance[category] // Restituisce successo e le prestazioni aggiornate per categoria
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento delle prestazioni per categoria:", error); // Log dell'errore
    return { success: false, message: "Errore del server" }; // Restituisce errore in caso di eccezione
  }
}

// Elimina un utente
async function deleteUser(userId) {
  try {
    const users = await readUsers(); // Legge gli utenti esistenti
    const userIndex = users.findIndex(user => user.id === userId); // Trova l'indice dell'utente nell'array
    
    if (userIndex === -1) {
      return { success: false, message: "Utente non trovato" }; // Restituisce errore se l'utente non esiste
    }
    
    // Rimuove l'utente dall'array
    users.splice(userIndex, 1);
    
    // Salva l'array aggiornato
    await writeUsers(users);
    
    return { success: true, message: "Profilo eliminato con successo" }; // Restituisce successo
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'utente:", error); // Log dell'errore
    return { success: false, message: "Errore del server" }; // Restituisce errore del server
  }
}

// Esporta le funzioni per l'uso in altri moduli
module.exports = {
  readUsers,
  writeUsers,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  addUser,
  authenticateUser,
  updateUserProfile,
  updateGameStats,
  updateCategoryPerformance,
  deleteUser,
}

