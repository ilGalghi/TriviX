// Authentication module for client-side
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  initAuthUI()

  // Check if user is logged in
  checkAuthStatus()

  // Add event listeners for login and register forms
  setupAuthListeners()
})

// Initialize UI elements based on auth status
function initAuthUI() {
  const loginNavItem = document.getElementById("loginNavItem")
  const registerNavItem = document.getElementById("registerNavItem")
  const profileNavItem = document.getElementById("profileNavItem")
  const logoutNavItem = document.getElementById("logoutNavItem")

  // Show/hide nav items based on login status
  const isLoggedIn = !!localStorage.getItem("currentUser")

  if (loginNavItem && registerNavItem) {
    loginNavItem.classList.toggle("d-none", isLoggedIn)
    registerNavItem.classList.toggle("d-none", isLoggedIn)
  }

  if (profileNavItem && logoutNavItem) {
    profileNavItem.classList.toggle("d-none", !isLoggedIn)
    logoutNavItem.classList.toggle("d-none", !isLoggedIn)
  }

  // Log the current authentication state for debugging
  console.log("Auth state:", isLoggedIn ? "Logged in" : "Not logged in")
  if (isLoggedIn) {
    console.log("Current user:", JSON.parse(localStorage.getItem("currentUser")))
  }
}

// Check if user is logged in
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include"
    });
    const data = await response.json();

    if (data.success) {
      // User is logged in
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      return true;
    } else {
      // User is not logged in
      localStorage.removeItem("currentUser");
      return false;
    }
  } catch (error) {
    console.error("Error checking auth status:", error);
    localStorage.removeItem("currentUser");
    return false;
  }
}

// Login function
async function login(username, password, actionType = null) {
  const loginError = document.getElementById("loginError")

  // Validate inputs
  if (!username || !password) {
    showError(loginError, "Please enter both username and password")
    return
  }

  try {
    // Send login request to server
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include", // Important for cookies/sessions
    })

    const data = await response.json()

    if (data.success) {
      console.log("Login successful:", data.user)

      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Close modal
      const loginModalElement = document.getElementById("loginModal")
      if (loginModalElement) {
        const bootstrap = window.bootstrap
        const loginModal = bootstrap.Modal.getInstance(loginModalElement) || new bootstrap.Modal(loginModalElement)
        
        // Nascondi il messaggio di login
        const loginMessage = document.getElementById("loginMessage")
        if (loginMessage) {
          loginMessage.classList.add("d-none")
        }
        
        // Rimuovi eventuali backdrop esistenti
        const existingBackdrops = document.querySelectorAll('.modal-backdrop')
        existingBackdrops.forEach(backdrop => backdrop.remove())
        
        // Rimuovi la classe modal-open dal body
        document.body.classList.remove('modal-open')
        
        // Chiudi il modal
        loginModal.hide()
      }

      // Update UI
      initAuthUI()

      // Handle different action types after login
      if (actionType === "create") {
        console.log("Redirecting to game creation after login")
        setTimeout(() => {
          //showCreateGameModal()
        }, 300)
      } else if (actionType === "join") {
        console.log("Redirecting to join game after login")
        setTimeout(() => {
          openJoinGameModal()
        }, 300)
      } else if (window.location.pathname.includes("login.html")) {
        // Redirect to home page if on login page
        window.location.href = "index.html"
      } else {
        // Reload current page to update UI
        window.location.reload()
      }
    } else {
      showError(loginError, data.message || "Login failed. Please check your credentials.")
    }
  } catch (error) {
    console.error("Login error:", error)
    showError(loginError, "An error occurred. Please try again later.")
  }
}

// Register function
async function register(username, email, password, confirmPassword) {
  const registerError = document.getElementById("registerError")

  // Validate inputs
  if (!username || !email || !password || !confirmPassword) {
    showError(registerError, "Please fill in all fields")
    return
  }

  if (password !== confirmPassword) {
    showError(registerError, "Passwords do not match")
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showError(registerError, "Please enter a valid email address")
    return
  }

  try {
    // Send register request to server
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, confirmPassword }),
      credentials: "include", // Important for cookies/sessions
    })

    const data = await response.json()

    if (data.success) {
      console.log("Registration successful:", data.user)

      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Close modal
      const registerModalElement = document.getElementById("registerModal")
      if (registerModalElement) {
        const bootstrap = window.bootstrap
        const registerModal = new bootstrap.Modal(registerModalElement)
        registerModal.hide()
      }

      // Update UI
      initAuthUI()

      // Show success message or redirect
      alert("Registration successful! Welcome to TriviX.")

      // Reload current page to update UI
      window.location.reload()
    } else {
      showError(registerError, data.message || "Registration failed. Please try again.")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showError(registerError, "An error occurred. Please try again later.")
  }
}

// Logout function
async function logout() {
  try {
    // Send logout request to server
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // Important for cookies/sessions
    })

    // Clear user data from localStorage
    localStorage.removeItem("currentUser")

    // Update UI
    initAuthUI()

    // Redirect to home page
    window.location.href = "index.html"
  } catch (error) {
    console.error("Logout error:", error)
    // Still clear local storage and redirect even if server request fails
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
  }
}

// Update profile function
async function updateProfile(username, email, password, avatar) {
  const editProfileError = document.getElementById("editProfileError")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  if (!currentUser) {
    showError(editProfileError, "You must be logged in to update your profile")
    return
  }

  // Validate inputs
  if (!username || !email) {
    showError(editProfileError, "Username and email are required")
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showError(editProfileError, "Please enter a valid email address")
    return
  }

  // Prepare profile data
  const profileData = {
    username,
    email,
    avatar,
  }

  // Add password if provided
  if (password) {
    profileData.password = password
  }

  try {
    // Send update profile request to server
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
      credentials: "include", // Important for cookies/sessions
    })

    const data = await response.json()

    if (data.success) {
      // Update stored user data
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      // Close modal safely
      const editProfileModalElement = document.getElementById("editProfileModal")
      if (editProfileModalElement) {
        const editProfileModal = bootstrap.Modal.getInstance(editProfileModalElement) || new bootstrap.Modal(editProfileModalElement)
        editProfileModal.hide()
      }

      // Update UI
      updateProfileUI(data.user)

      // Show success message
      alert("Profile updated successfully!")
      location.reload()
    } else {
      showError(editProfileError, data.message || "Failed to update profile. Please try again.")
    }
  } catch (error) {
    console.error("Update profile error:", error)
    if (editProfileError) {
      showError(editProfileError, "An error occurred. Please try again later.")
    }
  }
}


// Handle avatar upload
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) return alert("Seleziona un'immagine valida");

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Imposta la dimensione desiderata (es. max 200x200)
      const maxSize = 200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Converti in base64 con qualità ridotta
      const dataURL = canvas.toDataURL("image/jpeg", 0.4);

      document.getElementById("editProfileAvatar").src = dataURL;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}
// Update profile UI
function updateProfileUI(userData) {
  // Update profile elements if they exist
  const profileElements = {
    username: document.getElementById("profileUsername"),
    email: document.getElementById("profileEmail"),
    avatar: document.getElementById("profileAvatar"),
    gamesPlayed: document.getElementById("gamesPlayed"),
    gamesWon: document.getElementById("gamesWon"),
    correctAnswers: document.getElementById("correctAnswers"),
    categoryStats: document.getElementById("categoryStats"),
  }

  if (profileElements.username) {
    profileElements.username.textContent = userData.username
  }

  if (profileElements.email) {
    profileElements.email.textContent = userData.email
  }

  if (profileElements.avatar && userData.profile && userData.profile.avatar) {
    profileElements.avatar.src = userData.profile.avatar
  }

  // Update stats if they exist
  if (userData.profile && userData.profile.stats) {
    const stats = userData.profile.stats

    if (profileElements.gamesPlayed) {
      profileElements.gamesPlayed.textContent = stats.gamesPlayed || 0
    }

    if (profileElements.gamesWon) {
      profileElements.gamesWon.textContent = stats.gamesWon || 0
    }

    if (profileElements.correctAnswers) {
      profileElements.correctAnswers.textContent = stats.correctAnswers || 0
    }
  }

  // Update category performance
  if (profileElements.categoryStats && userData.profile && userData.profile.categoryPerformance) {
    const categoryPerformance = userData.profile.categoryPerformance
    let categoryStatsHTML = ""

    // Define category icons and colors
    const categories = {
      science: { icon: "flask", color: "#3498db" },
      entertainment: { icon: "film", color: "#9b59b6" },
      sports: { icon: "futbol", color: "#2ecc71" },
      art: { icon: "palette", color: "#f1c40f" },
      geography: { icon: "globe-americas", color: "#e67e22" },
      history: { icon: "landmark", color: "#e74c3c" },
    }

    // Generate HTML for each category
    Object.keys(categories).forEach((category) => {
      const performance = categoryPerformance[category] || { correct: 0, total: 0 }
      const percentage = performance.total > 0 ? Math.round((performance.correct / performance.total) * 100) : 0

      categoryStatsHTML += `
        <div class="category-item mb-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <div>
              <i class="fas fa-${categories[category].icon}" style="color: ${categories[category].color}"></i>
              <span class="ms-2">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </div>
            <span>${performance.correct}/${performance.total} (${percentage}%)</span>
          </div>
          <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${categories[category].color}" 
              aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
      `
    })

    profileElements.categoryStats.innerHTML = categoryStatsHTML
  }
}

// Helper function to show error messages
function showError(element, message) {
  if (element) {
    element.textContent = message
    element.classList.remove("d-none")
  }
}

// Set up event listeners for auth forms
function setupAuthListeners() {
  // Login form submission
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("username").value
      const password = document.getElementById("password").value

      // Check if there's a login message and determine the action type
      const loginMessage = document.getElementById("loginMessage")
      let actionType = null
      
      if (loginMessage && !loginMessage.classList.contains("d-none")) {
        if (loginMessage.textContent.includes("creare una nuova partita")) {
          actionType = "create"
        } else if (loginMessage.textContent.includes("unirti a una partita")) {
          actionType = "join"
        }
      }

      login(username, password, actionType)
    })
  }

  // Register form submission
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("registerUsername").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const confirmPassword = document.getElementById("registerConfirmPassword").value

      register(username, email, password, confirmPassword)
    })
  }

  // Logout button click
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logout()
    })
  }

  // Edit profile form
  const editProfileForm = document.getElementById("editProfileForm")
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("editUsername").value
      const email = document.getElementById("editEmail").value
      const password = document.getElementById("editPassword").value
      const avatar = document.getElementById("editProfileAvatar").src

      updateProfile(username, email, password, avatar)
    })
  }

  // Avatar upload
  const avatarUpload = document.getElementById("avatarUpload")
  if (avatarUpload) {
    avatarUpload.addEventListener("change", handleAvatarUpload)
  }

  // Edit profile button
  const editProfileBtn = document.getElementById("editProfileBtn")
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"))

      if (!currentUser) return

      // Populate edit form with current user data
      document.getElementById("editUsername").value = currentUser.username
      document.getElementById("editEmail").value = currentUser.email
      document.getElementById("editPassword").value = ""

      // Update avatar preview
      if (currentUser.profile && currentUser.profile.avatar) {
        document.getElementById("editProfileAvatar").src = currentUser.profile.avatar
      }

      // Show edit profile modal
      const editProfileModalElement = document.getElementById("editProfileModal")
      if (editProfileModalElement) {
        const bootstrap = window.bootstrap
        const editProfileModal = new bootstrap.Modal(editProfileModalElement)
        editProfileModal.show()
      }
    })
  }
}

