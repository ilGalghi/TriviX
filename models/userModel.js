const fs = require("fs").promises
const path = require("path")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

// Percorso al file JSON
const usersFilePath = path.join(__dirname, "../data/users.json")

// Assicurati che la directory data esista
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, "../data")
  try {
    await fs.access(dataDir)
  } catch (error) {
    // La directory non esiste, creala
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Leggi gli utenti dal file JSON
async function readUsers() {
  try {
    await ensureDataDirectory()

    try {
      const data = await fs.readFile(usersFilePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      // Se il file non esiste o è vuoto, restituisci un array vuoto
      if (error.code === "ENOENT" || error.message.includes("Unexpected end of JSON input")) {
        return []
      }
      throw error
    }
  } catch (error) {
    console.error("Errore nella lettura degli utenti:", error)
    return []
  }
}

// Scrivi gli utenti nel file JSON
async function writeUsers(users) {
  try {
    await ensureDataDirectory()
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8")
    return true
  } catch (error) {
    console.error("Errore nella scrittura degli utenti:", error)
    return false
  }
}

// Trova un utente per username
async function findUserByUsername(username) {
  const users = await readUsers()
  return users.find((user) => user.username.toLowerCase() === username.toLowerCase())
}

// Trova un utente per email
async function findUserByEmail(email) {
  const users = await readUsers()
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

// Trova un utente per ID
async function findUserById(id) {
  try {
    const users = await readUsers()
    const user = users.find((user) => user.id === id)

    if (!user) {
      console.log(`User with ID ${id} not found`)
    }

    return user
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return null
  }
}

// Aggiungi un nuovo utente
async function addUser(userData) {
  const users = await readUsers()

  // Controlla se username o email esistono già
  const existingUsername = await findUserByUsername(userData.username)
  if (existingUsername) {
    return { success: false, message: "Username già esistente" }
  }

  const existingEmail = await findUserByEmail(userData.email)
  if (existingEmail) {
    return { success: false, message: "Email già esistente" }
  }

  // Crea l'hash della password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(userData.password, salt)

  // Crea un nuovo utente con dati di profilo predefiniti
  const newUser = {
    id: uuidv4(),
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    profile: {
      avatar: "/img/default-avatar.png",
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        correctAnswers: 0,
        points: 0,
      },
      categoryPerformance: {
        science: { correct: 0, total: 0 },
        entertainment: { correct: 0, total: 0 },
        sports: { correct: 0, total: 0 },
        art: { correct: 0, total: 0 },
        geography: { correct: 0, total: 0 },
        history: { correct: 0, total: 0 },
      },
    },
  }

  // Aggiungi l'utente all'array e salva nel file
  users.push(newUser)
  await writeUsers(users)

  // Restituisci il successo senza la password
  const { password, ...userWithoutPassword } = newUser
  return { success: true, user: userWithoutPassword }
}

// Autentica un utente
async function authenticateUser(username, password) {
  const user = await findUserByUsername(username)

  if (!user) {
    return { success: false, message: "Utente non trovato" }
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return { success: false, message: "Password non corretta" }
  }

  // Restituisci i dati dell'utente senza la password
  const { password: pwd, ...userWithoutPassword } = user
  return { success: true, user: userWithoutPassword }
}

// Aggiorna il profilo dell'utente
async function updateUserProfile(userId, profileData) {
  const users = await readUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return { success: false, message: "Utente non trovato" }
  }

  // Aggiorna i dati del profilo
  if (profileData.username && profileData.username !== users[userIndex].username) {
    const existingUser = users.find(
      (u) => u.id !== userId && u.username.toLowerCase() === profileData.username.toLowerCase(),
    )
    if (existingUser) {
      return { success: false, message: "Username già esistente" }
    }
    users[userIndex].username = profileData.username
  }

  if (profileData.email && profileData.email !== users[userIndex].email) {
    const existingUser = users.find((u) => u.id !== userId && u.email.toLowerCase() === profileData.email.toLowerCase())
    if (existingUser) {
      return { success: false, message: "Email già esistente" }
    }
    users[userIndex].email = profileData.email
  }

  // Aggiorna la password se fornita
  if (profileData.password) {
    const salt = await bcrypt.genSalt(10)
    users[userIndex].password = await bcrypt.hash(profileData.password, salt)
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
    
    users[userIndex].profile.avatar = avatar;
  }

  // Salva le modifiche
  await writeUsers(users)

  // Restituisci l'utente aggiornato senza la password
  const { password, ...userWithoutPassword } = users[userIndex]
  return { success: true, user: userWithoutPassword }
}

// Aggiorna le statistiche di gioco
async function updateGameStats(userId, gameStats) {
  const users = await readUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    return { success: false, message: "Utente non trovato" }
  }

  // Aggiorna le statistiche di gioco
  const userStats = users[userIndex].profile.stats
  // Assegna direttamente i nuovi valori forniti in gameStats
  userStats.gamesPlayed = gameStats.gamesPlayed !== undefined ? gameStats.gamesPlayed : (userStats.gamesPlayed || 0)
  userStats.gamesWon = gameStats.gamesWon !== undefined ? gameStats.gamesWon : (userStats.gamesWon || 0)
  userStats.correctAnswers = gameStats.correctAnswers !== undefined ? gameStats.correctAnswers : (userStats.correctAnswers || 0)
  userStats.points = gameStats.points !== undefined ? gameStats.points : (userStats.points || 0)
  
  // Aggiorna le prestazioni per categoria se fornite
  if (gameStats.categoryPerformance) {
    Object.keys(gameStats.categoryPerformance).forEach((category) => {
      if (!users[userIndex].profile.categoryPerformance[category]) {
        users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 }
      }

      users[userIndex].profile.categoryPerformance[category].correct +=
        gameStats.categoryPerformance[category].correct || 0
      users[userIndex].profile.categoryPerformance[category].total += gameStats.categoryPerformance[category].total || 0
    })
  }

  // Salva le modifiche
  await writeUsers(users)

  return { success: true }
}

// Aggiorna le prestazioni dell'utente per una singola categoria
async function updateCategoryPerformance(userId, category, isCorrect) {
  try {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return { success: false, message: "Utente non trovato" };
    }

    // Assicurati che l'oggetto categoryPerformance esista
    if (!users[userIndex].profile.categoryPerformance) {
      users[userIndex].profile.categoryPerformance = {};
    }

    // Assicurati che la categoria esista nell'oggetto categoryPerformance
    if (!users[userIndex].profile.categoryPerformance[category]) {
      users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 };
    }

    // Incrementa il contatore delle risposte totali
    users[userIndex].profile.categoryPerformance[category].total += 1;

    // Se la risposta è corretta, incrementa anche il contatore delle risposte corrette
    if (isCorrect) {
      users[userIndex].profile.categoryPerformance[category].correct += 1;
      
      // Aggiorna immediatamente il contatore globale delle risposte corrette
      users[userIndex].profile.stats.correctAnswers = (users[userIndex].profile.stats.correctAnswers || 0) + 1;
    }

    // Salva le modifiche
    await writeUsers(users);

    console.log(`Prestazioni aggiornate per utente ${userId}, categoria ${category}, risposta corretta: ${isCorrect}`);
    console.log("Nuovi valori:", users[userIndex].profile.categoryPerformance[category]);

    return { 
      success: true, 
      categoryPerformance: users[userIndex].profile.categoryPerformance[category]
    };
  } catch (error) {
    console.error("Errore nell'aggiornamento delle prestazioni per categoria:", error);
    return { success: false, message: "Errore del server" };
  }
}

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
}

