// Dark Mode functionality
document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("darkModeToggle")
  
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  
    // Apply the saved theme or use the preferred color scheme
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.body.classList.add("dark-mode")
      updateToggleButton(true)
    } else {
      document.body.classList.remove("dark-mode")
      updateToggleButton(false)
    }
  
    // Toggle dark mode when button is clicked
    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode")
        localStorage.setItem("theme", isDarkMode ? "dark" : "light")
        updateToggleButton(isDarkMode)
      })
    }
  
    // Update button text and icon based on current mode
    function updateToggleButton(isDarkMode) {
      if (darkModeToggle) {
        if (isDarkMode) {
          darkModeToggle.innerHTML = "☀️ Light Mode"
          darkModeToggle.classList.remove("btn-dark")
          darkModeToggle.classList.add("btn-light")
        } else {
          darkModeToggle.innerHTML = "🌙 Dark Mode"
          darkModeToggle.classList.remove("btn-light")
          darkModeToggle.classList.add("btn-dark")
        }
      }
    }
  })
  
  