# 🚀 Installazione MongoDB su Windows

## Opzione 1: Installazione Locale (Raccomandata per sviluppo)

### Passo 1: Download MongoDB Community Server

1. Vai su: https://www.mongodb.com/try/download/community
2. Seleziona:
   - **Version**: Ultima versione disponibile
   - **Platform**: Windows
   - **Package**: MSI
3. Clicca **Download**

### Passo 2: Installazione

1. Esegui il file `.msi` scaricato
2. Scegli **Complete** installation
3. **IMPORTANTE**: Durante l'installazione:
   - ✅ Seleziona "Install MongoDB as a Service"
   - ✅ Service Name: `MongoDB`
   - ✅ Data Directory: `C:\Program Files\MongoDB\Server\7.0\data\`
   - ✅ Log Directory: `C:\Program Files\MongoDB\Server\7.0\log\`

### Passo 3: Verifica Installazione

Apri PowerShell come **Amministratore** e esegui:

```powershell
# Verifica se il servizio MongoDB è installato
Get-Service MongoDB

# Se il servizio esiste, avvialo
Start-Service MongoDB

# Oppure
net start MongoDB
```

### Passo 4: Testa la Connessione

```powershell
# Apri MongoDB Shell (se installato)
mongosh

# Oppure usa il vecchio client mongo
mongo
```

Se vedi il prompt `test>` o `>`, MongoDB è installato correttamente! 🎉

---

## Opzione 2: MongoDB Atlas (Cloud - GRATUITO)

Se non vuoi installare MongoDB localmente, usa MongoDB Atlas:

### Setup Atlas (5 minuti):

1. **Registrati**: https://www.mongodb.com/cloud/atlas/register
2. **Crea un Cluster**:
   - Scegli il piano **FREE** (M0)
   - Seleziona la regione più vicina
   - Clicca **Create Cluster**

3. **Configura Accesso**:
   - **Database Access**: Crea un utente (username + password)
   - **Network Access**: Aggiungi `0.0.0.0/0` (permetti tutti gli IP)

4. **Ottieni Stringa di Connessione**:
   - Clicca su **Connect**
   - Scegli **Connect your application**
   - Copia la stringa (sarà tipo: `mongodb+srv://username:password@cluster...`)

5. **Aggiorna `.env`**:
   ```env
   MONGODB_URI=mongodb+srv://TUO_USERNAME:TUA_PASSWORD@cluster0.xxxxx.mongodb.net/trivix?retryWrites=true&w=majority
   ```

---

## 🔧 Troubleshooting

### Errore: "Nome di servizio non valido"

MongoDB non è installato come servizio. Opzioni:

#### A) Avvia Manualmente

```powershell
# Crea la cartella per i dati (se non esiste)
New-Item -ItemType Directory -Force -Path C:\data\db

# Avvia MongoDB manualmente
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
```

Lascia questa finestra aperta e apri un nuovo terminale per eseguire `node migrate-users.js`

#### B) Installa come Servizio

```powershell
# Esegui PowerShell come AMMINISTRATORE

# Crea le directory
New-Item -ItemType Directory -Force -Path C:\data\db
New-Item -ItemType Directory -Force -Path C:\data\log

# Installa il servizio
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --install --serviceName MongoDB --dbpath C:\data\db --logpath C:\data\log\mongod.log

# Avvia il servizio
net start MongoDB
```

#### C) Usa MongoDB Atlas (nessuna installazione richiesta)

Segui l'**Opzione 2** sopra.

---

## ✅ Verifica che MongoDB Funzioni

```powershell
# Test 1: Servizio attivo
Get-Service MongoDB

# Test 2: Connessione
mongosh

# Test 3: Migrazione
node migrate-users.js
```

---

## 📝 Comandi Utili

```powershell
# Avvia MongoDB
net start MongoDB

# Ferma MongoDB
net stop MongoDB

# Stato del servizio
Get-Service MongoDB

# Connetti con MongoDB Shell
mongosh

# Verifica database
mongosh
> show dbs
> use trivix
> db.users.find()
```

---

## 🆘 Ancora Problemi?

### Se MongoDB non si installa:

Usa **MongoDB Atlas** (cloud gratuito):
1. Vai su https://www.mongodb.com/cloud/atlas
2. Registrati (gratis)
3. Crea cluster FREE
4. Copia stringa di connessione
5. Incolla in `.env` come `MONGODB_URI`
6. Esegui `node migrate-users.js`

**Nessuna installazione locale necessaria!** ☁️
