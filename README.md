# 🎮 TriviX - Quiz a Sfide
**Progetto di Leonardo Galgano e Daniele D'Alonzo** per il corso di [Tecnologie e Sistemi Web](https://sites.google.com/uniroma1.it/lorenzomarconi/corsi#h.hel2jsy2h8y1) dell'Università La Sapienza di Roma.

> *Metti alla prova le tue conoscenze e sfida i tuoi amici in tempo reale!*

## 📝 Descrizione
TriviX è una piattaforma interattiva di quiz tematici ispirata a Trivia Crack, sviluppata con tecnologie web moderne. Offre un'esperienza di gioco coinvolgente dove gli utenti possono:

- Rispondere a domande in **sei diverse categorie**: scienza, intrattenimento, sport, arte, geografia e storia
- Sfidarsi in **modalità multiplayer** in tempo reale con amici o altri giocatori online
- Allenarsi in **modalità singolo giocatore** per migliorare le proprie conoscenze
- Utilizzare **power-up speciali** per ottenere vantaggi strategici durante le partite
- **Comunicare tramite chat** con gli avversari mentre si gioca
- Tenere traccia delle proprie **statistiche e progressi** per ogni categoria

Il gioco combina apprendimento e divertimento in un'interfaccia intuitiva e accattivante, accessibile da qualsiasi dispositivo.

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
├── question_images/     # Immagini per le domande
├── server.js            # Entry point del server
├── package.json         # Dipendenze e configurazione npm
└── README.md            # Questo file README
```

## 🚀 Installazione e utilizzo
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
   Crea un file `.env` nella root del progetto con l'API KEY per (Gemini AI)[]

4. **Avvia il server**
   ```
   npm start
   ```

5. **Accedi all'applicazione**
   Apri il browser e naviga a `http://localhost:3000`
