document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    window.location.href = "index.html";
  }

  // Get return URL and openJoinGame from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get("returnUrl");
  const openJoinGame = urlParams.get("openJoinGame");

  // Add event listener to login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Save user data to localStorage
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          
          // Se siamo nella pagina di login, reindirizza alla home
          if (window.location.pathname.includes("login.html")) {
            if (returnUrl) {
              const redirectUrl = openJoinGame === "true" 
                ? `${returnUrl}?openJoinGame=true`
                : returnUrl;
              window.location.href = redirectUrl;
            } else {
              window.location.href = "index.html";
            }
          } else {
            // Se siamo in un'altra pagina (es. game.html), ricarica la pagina
            window.location.reload();
          }
        } else {
          alert(data.message || "Errore durante il login");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Errore durante il login");
      }
    });
  }
}); 