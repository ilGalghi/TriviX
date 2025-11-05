require('dotenv').config(); // Carica le variabili d'ambiente dal file .env
const express = require("express"); // Importa il modulo express per creare l'applicazione web
const session = require("express-session"); // Importa il middleware per gestire le sessioni degli utenti
const path = require("path"); // Importa il modulo path per gestire i percorsi dei file
const http = require('http'); // Importa il modulo http per creare un server HTTP
const socketIo = require('socket.io'); // Importa Socket.IO per gestire le comunicazioni in tempo reale
const helmet = require('helmet'); // Importa helmet per la sicurezza degli header HTTP
const rateLimit = require('express-rate-limit'); // Importa rate limiter per prevenire attacchi brute-force
const mongoSanitize = require('express-mongo-sanitize'); // Importa sanitizer per prevenire NoSQL injection
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

// Variabili di configurazione
const PORT = process.env.PORT || 3000; // Imposta la porta del server, utilizzando la variabile d'ambiente o 3000 come default
const isProduction = process.env.NODE_ENV === "production"; // Controlla se l'app è in modalità produzione

// Configurazione Socket.IO con CORS sicuro
const socketCorsOptions = isProduction 
  ? {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
      methods: ["GET", "POST"],
      credentials: true
    }
  : {
      origin: "*", // Permissivo solo in sviluppo
      methods: ["GET", "POST"]
    };

const io = socketIo(server, { 
    cors: socketCorsOptions
});

// ============================================
// CONFIGURAZIONE SICUREZZA
// ============================================

// Helmet: configura header HTTP di sicurezza
// In sviluppo, CSP è disabilitata per evitare problemi con hot reload e inline styles
// In produzione, CSP è attiva ma configurata per permettere le funzionalità necessarie
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Permette script inline (necessario per alcune funzionalità)
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"], // Permette connessioni WebSocket
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  } : false, // Disabilita CSP in sviluppo
  hsts: isProduction ? {
    maxAge: 31536000, // 1 anno
    includeSubDomains: true,
    preload: true
  } : false, // Disabilita HSTS in sviluppo (non ha senso senza HTTPS)
  noSniff: true, // X-Content-Type-Options: nosniff
  xssFilter: true, // X-XSS-Protection
  hidePoweredBy: true, // Nasconde X-Powered-By header
}));

// Rate limiters per prevenire attacchi brute-force
// In sviluppo: limiti molto permissivi per facilitare testing
// In produzione: limiti rigidi per sicurezza
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: isProduction ? 5 : 200, // Dev: 200 tentativi, Prod: 5 tentativi
  message: { 
    success: false, 
    message: "Troppi tentativi di accesso. Riprova tra 15 minuti." 
  },
  standardHeaders: true, // Restituisce info rate limit negli header `RateLimit-*`
  legacyHeaders: false, // Disabilita header `X-RateLimit-*`
  skipSuccessfulRequests: false, // Conta anche le richieste riuscite
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: isProduction ? 100 : 10000, // Dev: 10000 richieste, Prod: 100 richieste
  message: { 
    success: false, 
    message: "Troppi richieste. Riprova più tardi." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Applica rate limiter generale a tutte le richieste
app.use(generalLimiter);

// Middleware
app.use(express.json({ limit: "10mb" })); // Middleware per analizzare il JSON nel corpo delle richieste, con un limite di 10MB
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Middleware per analizzare i dati URL-encoded
app.use(mongoSanitize()); // Sanitizza input per prevenire NoSQL injection
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

// Configurazione CORS sicura
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (!isProduction) {
    // In sviluppo: permissivo ma controllato
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  } else {
    // In produzione: whitelist rigorosa
    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    }
  }
  
  // Gestisci richieste preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Rotte con rate limiting specifico per autenticazione
app.use("/api/auth", authLimiter, authRoutes); // Rotte per l'autenticazione con rate limiting
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