# Migrazione a MongoDB - TriviX

## 📋 Panoramica

Il progetto TriviX è stato aggiornato per utilizzare MongoDB per la gestione di:
- ✅ **Utenti** (profili, autenticazione, statistiche)
- ✅ **Chat** (messaggi in tempo reale)

I seguenti dati rimangono in **file JSON**:
- 📝 **Domande** (`QA.json`)
- 🎮 **Partite** (`data/matches.json`)

## 🚀 Setup MongoDB

### Opzione 1: MongoDB Locale

1. **Installa MongoDB** (se non già installato):
   - Scarica da: https://www.mongodb.com/try/download/community
   - Segui la procedura di installazione per Windows

2. **Avvia MongoDB**:
   ```powershell
   # Avvia il servizio MongoDB
   net start MongoDB
   
   # Oppure avvia manualmente (se non configurato come servizio)
   mongod --dbpath C:\data\db
   ```

3. **Verifica la connessione**:
   ```powershell
   mongo
   # Oppure con mongosh (nuova versione)
   mongosh
   ```

### Opzione 2: MongoDB Atlas (Cloud)

1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un account gratuito
3. Crea un nuovo cluster (tier gratuito)
4. Ottieni la stringa di connessione
5. Aggiorna il file `.env`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/trivix?retryWrites=true&w=majority
   ```

## 📦 Migrazione dei Dati Esistenti

Il file `users.json` contiene già 11 utenti. Per importarli in MongoDB:

```powershell
# Assicurati che MongoDB sia in esecuzione
# Poi esegui lo script di migrazione:
node migrate-users.js
```

Lo script:
- ✅ Legge gli utenti da `data/users.json`
- ✅ Importa solo gli utenti che non esistono già
- ✅ Mantiene le password già hashate
- ✅ Preserva tutte le statistiche e i profili

## 🔧 Configurazione

Il file `.env` è già configurato con:

```env
# MongoDB locale
MONGODB_URI=mongodb://localhost:27017/trivix

# Per MongoDB Atlas, sostituisci con la tua stringa di connessione
# MONGODB_URI=mongodb+srv://...
```

## 🏃 Avvio dell'Applicazione

```powershell
# Installa le dipendenze (se non già fatto)
npm install

# Avvia il server
npm start

# Oppure in modalità sviluppo
npm run dev
```

## 📊 Struttura Dati MongoDB

### Collection: users

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  profile: {
    avatar: String,
    stats: {
      gamesPlayed: Number,
      gamesWon: Number,
      correctAnswers: Number,
      points: Number
    },
    categoryPerformance: {
      science: { correct: Number, total: Number },
      entertainment: { correct: Number, total: Number },
      sports: { correct: Number, total: Number },
      art: { correct: Number, total: Number },
      geography: { correct: Number, total: Number },
      history: { correct: Number, total: Number }
    }
  },
  createdAt: Date
}
```

### Collection: messages

```javascript
{
  _id: ObjectId,
  sender: String,
  content: String,
  roomId: String,
  timestamp: Date
}
```

## 🔄 Compatibilità

Il nuovo sistema è **completamente retrocompatibile** con l'API esistente:
- Tutti gli endpoint rimangono invariati
- Le route `/api/auth/*` e `/api/users/*` funzionano come prima
- Gli ID utente sono ora ObjectId MongoDB invece di UUID

## ⚠️ Note Importanti

1. **Backup**: Il file `data/users.json` rimane intatto come backup
2. **Password**: Le password sono già hashate e vengono migrate correttamente
3. **Sessioni**: Le sessioni continuano a funzionare normalmente
4. **Matches e Questions**: Rimangono in JSON come richiesto

## 🐛 Troubleshooting

### MongoDB non si avvia
```powershell
# Verifica se il servizio è attivo
sc query MongoDB

# Avvia il servizio
net start MongoDB
```

### Errore di connessione
- Verifica che MongoDB sia in esecuzione
- Controlla la stringa di connessione in `.env`
- Per MongoDB Atlas, verifica le credenziali e l'IP whitelist

### Gli utenti non vengono importati
```powershell
# Verifica il contenuto del database
mongosh
use trivix
db.users.find()
db.users.countDocuments()
```

## 📚 Risorse

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✅ Checklist Setup

- [ ] MongoDB installato e in esecuzione
- [ ] File `.env` configurato
- [ ] Dipendenze installate (`npm install`)
- [ ] Dati migrati (`node migrate-users.js`)
- [ ] Server avviato (`npm start`)
- [ ] Test login con un utente esistente
