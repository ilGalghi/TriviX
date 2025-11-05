# 🎮 TriviX - Quiz a Sfide
**Progetto di Leonardo Galgano e Daniele D'Alonzo** per il corso di [Tecnologie e Sistemi Web](https://sites.google.com/uniroma1.it/lorenzomarconi/corsi#h.hel2jsy2h8y1) dell'Università La Sapienza di Roma.

> *Metti alla prova le tue conoscenze e sfida i tuoi amici in tempo reale!*

- [English version](/docs/README_EN.md)

## 📝 Descrizione
TriviX è una piattaforma interattiva di quiz tematici ispirata a Trivia Crack, sviluppata con tecnologie web moderne. Offre un'esperienza di gioco coinvolgente dove gli utenti possono:

- Rispondere a domande in **sei diverse categorie**: scienza, intrattenimento, sport, arte, geografia e storia
- Sfidarsi in **modalità multiplayer** in tempo reale con amici o altri giocatori online
- Allenarsi in **modalità singolo giocatore** per migliorare le proprie conoscenze
- Utilizzare **power-up speciali** per ottenere vantaggi strategici durante le partite
- **Comunicare tramite chat** con gli avversari mentre si gioca
- Tenere traccia delle proprie **statistiche e progressi** per ogni categoria

Il gioco combina apprendimento e divertimento in un'interfaccia intuitiva e accattivante, accessibile da qualsiasi dispositivo.


## 🖼️ Anteprima
Disponibile sia in versione desktop che mobile:

![Desktop](/docs/TOT.png)



## ✨ Funzionalità principali
- **Autenticazione utenti**: Registrazione, login e gestione del profilo
- **Modalità di gioco**: Single player (allenamento) e multiplayer
- **Chat in tempo reale**: Comunicazione tra giocatori durante le partite
- **Sistema di domande e risposte**: Vasto database di domande di diverse categorie
- **Tracciamento statistiche**: Monitoraggio dei progressi e delle performance del giocatore
- **Interfaccia responsive**: Esperienza di gioco ottimizzata su diversi dispositivi

## 🛠️ Tecnologie utilizzate
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON (per utenti, QA, matches), MongoDB con Mongoose (per la chat)
- **Autenticazione**: Express-session, bcryptjs (hashing della password)
- **Comunicazione in tempo reale**: Socket.IO
- **Altri strumenti**: 
  - Tailwind CSS per lo styling
  - Dotenv per la gestione delle variabili d'ambiente (API KEY)
  - UUID per la generazione di identificatori unici

## 📂 Struttura del progetto
```
TriviX/
├── public/              # File statici (HTML, CSS, JavaScript)
│   ├── css/             # Fogli di stile
│   ├── js/              # Script front-end
│   └── img/             # Immagini e risorse grafiche
├── routes/              # Route API dell'applicazione
├── models/              # Modelli dati
├── data/                # Dati statici dell'applicazione (JSON)
├── docs/                # Documenti e immagini del progetto
├── question_images/     # Immagini per le domande
├── server.js            # Entry point del server
├── package.json         # Dipendenze e configurazione npm
└── README.md            # Questo file README
```

## 🚀 Installazione e utilizzo
**Nota:** si possono utilizzare strumenti come [ngrok](https://ngrok.com/) per esporre in modo sicuro il programma in esecuzione sul PC locale, rendendolo accessibile anche ad altri dispositivi o utenti esterni.
1. **Clona il repository**
   ```
   git clone https://github.com/ilGalghi/TriviX
   cd TriviX
   ```

2. **Installa le dipendenze**
   ```
   npm install
   ```

3. **Configura le variabili d'ambiente**

   Copia il file `.env.example` in `.env` e configura le variabili necessarie:
   ```bash
   cp .env.example .env
   ```
   
   Modifica il file `.env` con i tuoi valori:
   ```env
   # Modalità ambiente (development o production)
   NODE_ENV=development
   
   # Porta del server
   PORT=3000
   
   # Chiave segreta per le sessioni (GENERARE UNA NUOVA IN PRODUZIONE!)
   SESSION_SECRET=your_random_secret_key_here
   
   # Domini autorizzati per CORS (separati da virgola)
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   
   # API KEY per Gemini AI (opzionale)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **⚠️ IMPORTANTE per la produzione:**
   ```bash
   # Genera una chiave segreta forte:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Avvia il server**
   ```bash
   npm start
   ```
   
   Per sviluppo con auto-reload:
   ```bash
   npm run dev
   ```

5. **Accedi all'applicazione**

   Apri il browser e naviga a `http://localhost:3000`
