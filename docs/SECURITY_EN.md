# 🛡️ Security for TriviX
If you have identified a vulnerability or a security issue in TriviX, please follow the guidelines below.

## 📢 Reporting Vulnerabilities

If you discover a vulnerability, **do not open a public issue**. Instead, follow these steps:

1. **Send a private report** to the developers via email:
   - Leonardo Galgano: `ilgalghi(dot)developer(at)gmail(dot)com`

2. In your report, include:
   - A detailed description of the vulnerability.
   - Steps to reproduce it.
   - The potential impact.
   - Any suggestions for resolution.

3. You will receive a response as soon as possible.

## 🔒 Security Guidelines
- User passwords are managed using secure hashing (bcrypt).
- Sessions are protected using `httpOnly` cookies and, in production, `secure` and `sameSite=none`.
- Sensitive data is never exposed in API responses.
- Access to protected APIs requires session-based authentication.
- Client and server code is subject to periodic review to identify potential vulnerabilities.

## 🛡️ Best Practices for Contributors
- Never include credentials, secret keys, or sensitive data in the code or commits.
- Follow OWASP guidelines for web application security.
- Before submitting a pull request, ensure it does not introduce XSS, CSRF, or injection risks.
- If you have doubts about a change that may impact security, contact the maintainers.

## 📚 Useful Resources
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

Thank you for your contribution to security!
