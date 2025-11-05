# CHANGELOG

## [Security Update] - 05 Novembre 2025

### 🔒 Miglioramenti Critici alla Sicurezza

Questa versione implementa tutti i miglioramenti di sicurezza raccomandati dall'analisi del Capitolo 2 sulla Sicurezza e Autenticazione.

---

### ✅ 1. Header di Sicurezza HTTP (Helmet.js)

**Implementazione**: `server.js`

- ✅ Integrato middleware **Helmet.js** per configurare automaticamente header HTTP di sicurezza
- ✅ **Content Security Policy (CSP)**: Previene attacchi XSS limitando le fonti di contenuti
- ✅ **X-Content-Type-Options**: Impostato su `nosniff` per prevenire MIME type sniffing
- ✅ **X-XSS-Protection**: Abilita protezione XSS integrata nei browser
- ✅ **HSTS (HTTP Strict Transport Security)**: Forza connessioni HTTPS in produzione (1 anno)
- ✅ **Hide X-Powered-By**: Nasconde informazioni sul framework utilizzato

**Impatto**: Protezione contro attacchi XSS, clickjacking, MIME sniffing e information disclosure.

---

### ✅ 2. Rate Limiting (Prevenzione Brute-Force)

**Implementazione**: `server.js`

- ✅ **Rate limiter specifico per autenticazione**: Massimo 5 tentativi ogni 15 minuti su `/api/auth/*`
- ✅ **Rate limiter generale**: Massimo 100 richieste ogni 15 minuti per tutte le altre route
- ✅ Messaggi di errore informativi con header standardizzati `RateLimit-*`
- ✅ Protezione contro attacchi automatizzati di credential stuffing

**Impatto**: Blocca efficacemente attacchi brute-force e DDoS di basso livello.

---

### ✅ 3. CORS Sicuro per Produzione

**Implementazione**: `server.js`

- ✅ **Whitelist domini**: In produzione, solo domini specificati in `ALLOWED_ORIGINS` sono autorizzati
- ✅ **Credentials support**: Abilitato `Access-Control-Allow-Credentials` in produzione
- ✅ **Gestione preflight**: Risposta corretta alle richieste OPTIONS
- ✅ **Socket.IO CORS**: Configurazione differenziata per WebSocket in sviluppo/produzione
- ✅ Modalità permissiva mantenuta solo in sviluppo per facilitare testing

**Impatto**: Previene richieste cross-origin non autorizzate e furto di dati da siti malevoli.

---

### ✅ 4. Validazione e Sanitizzazione Input (Validator.js)

**Implementazione**: `routes/auth.js`

#### Registrazione e Login:
- ✅ Validazione formato **email** con `validator.isEmail()`
- ✅ Validazione **username**: alfanumerico, 3-20 caratteri, permessi `_` e `-`
- ✅ Sanitizzazione con `validator.escape()` e `validator.trim()`
- ✅ Normalizzazione email con `validator.normalizeEmail()`

#### Password:
- ✅ Requisiti di complessità con `validator.isStrongPassword()`:
  - Minimo 8 caratteri
  - Almeno 1 lettera maiuscola
  - Almeno 1 lettera minuscola
  - Almeno 1 numero
- ✅ Validazione durante registrazione e aggiornamento profilo

#### Aggiornamento Profilo:
- ✅ Sanitizzazione percorso avatar per prevenire **path traversal**
- ✅ Verifica che avatar inizi con `/img/`
- ✅ Rimozione caratteri pericolosi (`../`, caratteri speciali)

#### Statistiche Gioco:
- ✅ Validazione valori numerici (interi non negativi)
- ✅ Controllo type safety per `gamesPlayed`, `gamesWon`, `correctAnswers`

**Impatto**: Previene XSS, SQL/NoSQL injection, path traversal e validazione dati corrotta.

---

### ✅ 5. Protezione Session Fixation

**Implementazione**: `routes/auth.js`

- ✅ **Rigenerazione ID sessione** con `req.session.regenerate()` dopo login
- ✅ **Rigenerazione ID sessione** dopo registrazione
- ✅ Pulizia cookie con `res.clearCookie()` durante logout e eliminazione account
- ✅ Prevenzione riutilizzo session ID rubati

**Impatto**: Elimina vulnerabilità di session fixation e riduce rischio di session hijacking.

---

### ✅ 6. Messaggi di Errore Sicuri

**Implementazione**: `routes/auth.js`

#### Login:
- ✅ Messaggio generico **"Credenziali non valide"** invece di distinguere tra "Utente non trovato" e "Password errata"
- ✅ Codice HTTP 401 (Unauthorized) invece di 400

#### Altri Endpoint:
- ✅ Messaggi in italiano per migliore UX
- ✅ Nessuna rivelazione di dettagli implementativi
- ✅ Log dettagliati lato server mantenuti per debugging

**Impatto**: Previene information disclosure e user enumeration attacks.

---

### ✅ 7. NoSQL Injection Prevention

**Implementazione**: `server.js`

- ✅ Integrato middleware **express-mongo-sanitize**
- ✅ Rimozione automatica caratteri `$` e `.` dai dati utente
- ✅ Protezione query su database JSON-based

**Impatto**: Previene manipolazione query attraverso input malevoli.

---

### ✅ 8. Configurazione Ambiente Sicura

**Creazione file**: `.env.example`

- ✅ Template variabili d'ambiente con documentazione completa
- ✅ Separazione configurazione sviluppo/produzione
- ✅ Guida generazione chiave segreta sicura con `crypto.randomBytes()`
- ✅ Configurazioni rate limiting parametrizzabili
- ✅ CORS whitelist configurabile via variabile d'ambiente

**Impatto**: Facilita deployment sicuro e previene errori configurazione.

---

## 📊 Riepilogo Vulnerabilità Risolte

| Vulnerabilità OWASP Top 10 | Stato Pre-Fix | Stato Post-Fix | Mitigazione |
|---|---|---|---|
| **A01:2021 – Broken Access Control** | ⚠️ Parziale | ✅ Risolto | Session regeneration, CORS whitelist |
| **A02:2021 – Cryptographic Failures** | ✅ Già sicuro | ✅ Confermato | bcrypt già implementato correttamente |
| **A03:2021 – Injection** | ⚠️ Vulnerabile | ✅ Risolto | Sanitizzazione input, mongo-sanitize |
| **A04:2021 – Insecure Design** | ⚠️ Parziale | ✅ Migliorato | Rate limiting, validazione robusta |
| **A05:2021 – Security Misconfiguration** | ❌ Critico | ✅ Risolto | Helmet, CORS produzione, .env.example |
| **A06:2021 – Vulnerable Components** | ⚠️ Da monitorare | ✅ Risolto | Dipendenze aggiornate, audit NPM risolto |
| **A07:2021 – Auth Failures** | ❌ Critico | ✅ Risolto | Rate limiting, session regeneration |
| **A08:2021 – Software Integrity** | ✅ Non applicabile | ✅ N/A | - |
| **A09:2021 – Logging Failures** | ✅ Già implementato | ✅ Confermato | Log errori già presenti |
| **A10:2021 – SSRF** | ✅ Non applicabile | ✅ N/A | - |

---

## 🔧 Modifiche Tecniche Dettagliate

### File Modificati:

1. **`server.js`**
   - Aggiunti import: `helmet`, `express-rate-limit`, `express-mongo-sanitize`
   - Configurata sezione sicurezza con commenti esplicativi
   - Implementato CORS differenziato sviluppo/produzione
   - Configurato Socket.IO con CORS sicuro
   - Applicato rate limiter alle rotte autenticazione

2. **`routes/auth.js`**
   - Aggiunto import `validator`
   - Refactoring endpoint `/register` con validazione completa
   - Refactoring endpoint `/login` con sanitizzazione e session regeneration
   - Migliorata validazione endpoint `/profile` e `/stats`
   - Aggiunto `clearCookie` in logout ed eliminazione account
   - Messaggi errore unificati e in italiano

3. **`routes/questions.js`**
   - ✅ **CRITICO**: Correzione vulnerabilità path traversal nella route `/image/:filename`
   - Sanitizzazione filename con `path.basename()`
   - Validazione caratteri permessi (regex whitelist)
   - Whitelist estensioni file (jpg, jpeg, png, gif, webp)
   - Verifica che il path risolto sia dentro la directory `question_images`
   - Validazione categoria con whitelist predefinita

4. **`routes/user.js`**
   - Migrazione da array in-memory a database JSON tramite `userModel`
   - Aggiunto import `validator` per validazione input
   - Validazione UUID per `userId` in tutti gli endpoint
   - Controllo autorizzazioni: utenti possono modificare solo i propri dati
   - Sanitizzazione e validazione per tutti gli input (username, email, password)
   - Validazione categorie con whitelist
   - Validazione valori numerici e booleani
   - Messaggi errore in italiano

5. **`.env.example`** (NUOVO)
   - Template configurazione con documentazione inline
   - Sezioni organizzate per categoria
   - Istruzioni generazione chiavi sicure

### Dipendenze Aggiunte:

```json
{
  "helmet": "^7.x.x",
  "express-rate-limit": "^7.x.x",
  "validator": "^13.x.x",
  "express-mongo-sanitize": "^2.x.x"
}
```

---

## 🚀 Raccomandazioni Deployment Produzione

### Prima del Deploy:

1. ✅ Generare una `SESSION_SECRET` forte e casuale
2. ✅ Configurare `ALLOWED_ORIGINS` con i domini reali dell'applicazione
3. ✅ Impostare `NODE_ENV=production`
4. ✅ Verificare che il certificato SSL/TLS sia valido
5. ✅ Eseguire `npm audit` e risolvere vulnerabilità note
6. ✅ Testare rate limiting in ambiente staging
7. ✅ Configurare log aggregation per monitoraggio attacchi

---