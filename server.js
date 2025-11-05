require('dotenv').config(); // Carica le variabili d'ambiente dal file .env
const express = require("express"); // Importa il modulo express per creare l'applicazione web
const session = require("express-session"); // Importa il middleware per gestire le sessioni degli utenti
const path = require("path"); // Importa il modulo path per gestire i percorsi dei file
const http = require('http'); // Importa il modulo http per creare un server HTTP
const socketIo = require('socket.io'); // Importa Socket.IO per gestire le comunicazioni in tempo reale
const Message = require('./models/Message'); // Importa il modello per i messaggi (se necessario)
const authRoutes = require("./routes/auth"); // Importa le rotte per l'autenticazione
const gameRoutes = require("./routes/game"); // Importa le rotte per il gioco
const chatRoutes = require("./routes/chat"); // Importa le rotte per la chat
const questionsRoutes = require("./routes/questions"); // Importa le rotte per le domande
const userRoutes = require("./routes/user"); // Importa le rotte per gli utenti
const aiRoutes = require("./routes/ai"); // Importa le rotte per l'AI
const surrenderRoutes = require("./routes/surrender"); // Importa le rotte per la resa
const app = express(); // Crea un'applicazione Express
const server = http.createServer(app); // Crea un server HTTP utilizzando l'app Express
const io = socketIo(server, { // Inizializza Socket.IO sul server
    cors: {
        origin: "*", // Permette le richieste CORS da qualsiasi origine
        methods: ["GET", "POST"] // Specifica i metodi HTTP consentiti
    }
});
const PORT = process.env.PORT || 3000; // Imposta la porta del server, utilizzando la variabile d'ambiente o 3000 come default
const isProduction = process.env.NODE_ENV === "production"; // Controlla se l'app è in modalità produzione

// Middleware
app.use(express.json({ limit: "10mb" })); // Middleware per analizzare il JSON nel corpo delle richieste, con un limite di 10MB
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Middleware per analizzare i dati URL-encoded
app.use(express.static(path.join(__dirname, "public"))); // Serve file statici dalla cartella "public"

// Configurazione della sessione
app.use(
  session({
    secret: process.env.SESSION_SECRET || "trivix_secret_key", // Chiave segreta per firmare i cookie di sessione
    resave: false, // Non riscrivere la sessione se non è stata modificata
    saveUninitialized: false, // Non salvare sessioni non inizializzate
    cookie: {
      secure: isProduction, // Imposta il cookie come sicuro in produzione
      maxAge: 1000 * 60 * 60 * 24 * 7, // Durata del cookie: 7 giorni
      sameSite: isProduction ? "none" : "lax", // Gestione dei cookie cross-site
      httpOnly: true, // Il cookie è accessibile solo dal server
    },
    name: "trivix_session", // Nome personalizzato per il cookie di sessione
  })
);

// Middleware per il logging delle richieste (per debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // Log del metodo e dell'URL della richiesta
  //console.log("Session ID:", req.session.id); // Log dell'ID della sessione (commentato per il debug)
  //console.log("User ID:", req.session.userId); // Log dell'ID dell'utente (commentato per il debug)
  next(); // Passa al prossimo middleware o alla rotta
});

// Abilita CORS per lo sviluppo
if (!isProduction) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Permette le richieste CORS da qualsiasi origine
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); // Specifica gli header consentiti
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // Specifica i metodi HTTP consentiti
    next(); // Passa al prossimo middleware o alla rotta
  });
}

// Rotte
app.use("/api/auth", authRoutes); // Rotte per l'autenticazione
app.use("/api/games", gameRoutes); // Rotte per il gioco
app.use("/api/chat", chatRoutes); // Rotte per la chat
app.use("/api/questions", questionsRoutes); // Rotte per le domande
app.use("/api/users", userRoutes); // Rotte per gli utenti
app.use("/api/ai", aiRoutes); // Rotte per l'AI
app.use("/api/games", surrenderRoutes); // Rotte per la resa

// Gestione delle connessioni Socket.IO
io.on('connection', (socket) => { // Gestisce le connessioni dei client
    console.log('Nuovo utente connesso:', socket.id); // Log dell'ID del nuovo socket

    socket.on('join-room', (roomId) => { // Gestisce l'evento di un utente che entra in una stanza
        socket.join(roomId); // L'utente si unisce alla stanza specificata
        console.log(`Utente ${socket.id} entrato nella stanza ${roomId}`); // Log dell'entrata nella stanza
    });

    socket.on('leave-room', (roomId) => { // Gestisce l'evento di un utente che esce da una stanza
        socket.leave(roomId); // L'utente esce dalla stanza specificata
        console.log(`Utente ${socket.id} uscito dalla stanza ${roomId}`); // Log dell'uscita dalla stanza
    });

    socket.on('send-message', (message) => { // Gestisce l'invio di un messaggio
      try {
        console.log('Messaggio ricevuto:', message); // Log del messaggio ricevuto
        
        // Invia il messaggio a TUTTI gli utenti nella stanza, incluso il mittente
        io.to(message.roomId).emit('new-message', {
            sender: message.sender, // Mittente del messaggio
            content: message.content, // Contenuto del messaggio
            timestamp: new Date() // Timestamp del messaggio
        });
        
        console.log(`Messaggio inviato alla stanza ${message.roomId}, incluso il mittente`); // Log dell'invio del messaggio
      } catch (error) {
        console.error('Errore nell\'invio del messaggio:', error); // Log degli errori
        socket.emit('error', { message: 'Errore nell\'invio del messaggio' }); // Invia un messaggio di errore al mittente
      }
    });

    socket.on('disconnect', () => { // Gestisce la disconnessione di un utente
        console.log('Utente disconnesso:', socket.id); // Log dell'uscita dell'utente
    });
});

// API health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV }); // Restituisce lo stato dell'API
});

// Servi i file HTML specifici
app.get("*.html", (req, res) => {
  const htmlFile = path.basename(req.url); // Estrae il nome del file HTML dalla richiesta
  res.sendFile(path.join(__dirname, "public", htmlFile)); // Invia il file HTML richiesto
});

// Servi il file HTML principale per tutte le altre route (per SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Invia il file HTML principale per le SPA
});

// Avvia il server
server.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT} in modalità ${process.env.NODE_ENV || "development"}`); // Log dell'avvio del server
});