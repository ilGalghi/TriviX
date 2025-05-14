# TriviX
**Progetto di Leonardo Galgano e Daniele D'Alonzo** per il corso di [Tecnologie e Sistemi Web](https://sites.google.com/uniroma1.it/lorenzomarconi/corsi#h.hel2jsy2h8y1). Applicazione web interattiva che permette agli utenti di giocare a quiz tematici in diverse categorie come scienza, intrattenimento, sport, arte, geografia e storia. Gli utenti possono sfidare altri giocatori, rispondere a domande, utilizzare powerup speciali e chattare durante le partite.

## Descrizione
TriviX è un gioco di trivia online ispirato a Trivia Crack, dove gli utenti possono mettere alla prova le proprie conoscenze rispondendo a domande di varie categorie. Il gioco offre sia modalità singolo giocatore che multiplayer, permettendo agli utenti di sfidare amici o altri giocatori in tempo reale.

## Funzionalità principali
- **Autenticazione utenti**: Registrazione, login e gestione del profilo
- **Modalità di gioco**: Single player (allenamento) e multiplayer
- **Chat in tempo reale**: Comunicazione tra giocatori durante le partite
- **Sistema di domande e risposte**: Vasto database di domande di diverse categorie
- **Tracciamento statistiche**: Monitoraggio dei progressi e delle performance del giocatore
- **Interfaccia responsive**: Esperienza di gioco ottimizzata su diversi dispositivi

## Tecnologie utilizzate
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON (per utenti, QA, matches), MongoDB con Mongoose (per la chat)
- **Autenticazione**: Express-session, bcryptjs (hashing della password)
- **Comunicazione in tempo reale**: Socket.IO
- **Altri strumenti**: 
  - Tailwind CSS per lo styling
  - Dotenv per la gestione delle variabili d'ambiente (API KEY)
  - UUID per la generazione di identificatori unici

## Struttura del progetto
```
TriviX/
├── public/              # File statici (HTML, CSS, JavaScript)
│   ├── css/             # Fogli di stile
│   ├── js/              # Script front-end
│   └── img/             # Immagini e risorse grafiche
├── routes/              # Route API dell'applicazione
├── models/              # Modelli dati Mongoose
├── data/                # Dati statici dell'applicazione
├── question_images/     # Immagini per le domande
├── server.js            # Entry point del server
├── package.json         # Dipendenze e configurazione npm
└── README.md            # Questo file
```

## Installazione e utilizzo
1. **Clona il repository**
   ```
   git clone https://github.com/tuousername/TriviX.git
   cd TriviX
   ```

2. **Installa le dipendenze**
   ```
   npm install
   ```

3. **Configura le variabili d'ambiente**
   Crea un file `.env` nella root del progetto con le seguenti variabili (API KEY per Gemini)

4. **Avvia il server**
   ```
   npm start
   ```

5. **Accedi all'applicazione**
   Apri il browser e naviga a `http://localhost:3000`
