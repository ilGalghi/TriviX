const express = require("express");
const session = require("express-session");
const path = require("path");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const app = express();
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
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT} in modalità ${process.env.NODE_ENV || "development"}`);
});
