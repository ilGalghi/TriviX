require('dotenv').config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const chatRoutes = require("./routes/chat");
const questionsRoutes = require("./routes/questions");
const userRoutes = require("./routes/user");
const aiRoutes = require("./routes/ai");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(express.json({ limit: "10mb" })); // Per analizzare application/json con payload più grandi per gli upload di avatar
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Configurazione della sessione
app.use(
  session({
    secret: process.env.SESSION_SECRET || "trivia_crack_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 giorni (aumentato da 1 giorno)
      sameSite: isProduction ? "none" : "lax", // Necessario per i cookie cross-site in produzione
      httpOnly: true, // Il cookie è accessibile solo dal server
    },
    name: "trivia_crack_session", // Nome personalizzato per il cookie di sessione
  })
);

// Middleware per il logging delle richieste (per debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Session ID:", req.session.id);
  console.log("User ID:", req.session.userId);
  next();
});

// Abilita CORS per lo sviluppo
if (!isProduction) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// Gestione delle connessioni Socket.IO
io.on('connection', (socket) => {
    console.log('Nuovo utente connesso:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Utente ${socket.id} entrato nella stanza ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`Utente ${socket.id} uscito dalla stanza ${roomId}`);
    });

    
    socket.on('send-message', (message) => {
      try {
        console.log('Messaggio ricevuto:', message);
        
        // Invia il messaggio a TUTTI gli utenti nella stanza, incluso il mittente
        io.to(message.roomId).emit('new-message', {
            sender: message.sender,
            content: message.content,
            timestamp: new Date()
        });
        
        console.log(`Messaggio inviato alla stanza ${message.roomId}, incluso il mittente`);
      } catch (error) {
        console.error('Errore nell\'invio del messaggio:', error);
        socket.emit('error', { message: 'Errore nell\'invio del messaggio' });
      }
    });

    socket.on('disconnect', () => {
        console.log('Utente disconnesso:', socket.id);
    });
});

// API health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// Servi i file HTML specifici
app.get("*.html", (req, res) => {
  const htmlFile = path.basename(req.url);
  res.sendFile(path.join(__dirname, "public", htmlFile));
});

// Servi il file HTML principale per tutte le altre route (per SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avvia il server
server.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT} in modalità ${process.env.NODE_ENV || "development"}`);
});
