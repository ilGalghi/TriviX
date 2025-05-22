# 🛡️ Sicurezza per TriviX
Se hai individuato una vulnerabilità o un problema di sicurezza in TriviX, ti chiediamo di seguire le linee guida riportate di seguito.

## 📢 Segnalazione delle vulnerabilità

Se scopri una vulnerabilità, **non aprire una issue pubblica**. Segui invece questi passaggi:

1. **Invia una segnalazione privata** agli sviluppatori tramite email:
   - Leonardo Galgano: ilgalghi.developer@gmail.com

2. Nella segnalazione, includi:
   - Una descrizione dettagliata della vulnerabilità.
   - I passaggi per riprodurla.
   - L’impatto potenziale.
   - Eventuali suggerimenti per la risoluzione.

3. Riceverai una risposta il prima possibile.

## 🔒 Linee guida di sicurezza
- Le password degli utenti sono gestite tramite hashing sicuro (bcrypt).
- Le sessioni sono protette tramite cookie `httpOnly` e, in produzione, `secure` e `sameSite=none`.
- I dati sensibili non vengono mai esposti nelle risposte API.
- L’accesso alle API protette richiede autenticazione tramite sessione.
- Il codice client e server è soggetto a revisione periodica per individuare potenziali vulnerabilità.

## 🛡️ Best practice per chi contribuisce
- Non inserire mai credenziali, chiavi segrete o dati sensibili nel codice o nei commit.
- Segui le linee guida OWASP per la sicurezza delle applicazioni web.
- Prima di proporre una pull request, verifica che non introduca rischi di XSS, CSRF, o injection.
- Se hai dubbi su una modifica che può impattare la sicurezza, contatta i maintainer.

## 📚 Risorse utili
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

Grazie per il tuo contributo alla sicurezza di TriviX!