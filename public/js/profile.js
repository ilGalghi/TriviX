// Profile page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = localStorage.getItem("currentUser")

  if (!currentUser) {
    // Redirect to login page if not logged in
    window.location.href = "index.html"
    return
  }

  // Parse user data
  const userData = JSON.parse(currentUser)

  // Load user profile data
  loadProfileData(userData)

  // Set up event listeners
  setupProfileListeners()
})

// Load profile data
function loadProfileData(userData) {
  // Update profile elements
  document.getElementById("profileUsername").textContent = userData.username
  document.getElementById("profileEmail").textContent = userData.email

  // Update avatar if available
  if (userData.profile && userData.profile.avatar) {
    document.getElementById("profileAvatar").src = userData.profile.avatar
  }

  // Update stats
  if (userData.profile && userData.profile.stats) {
    const stats = userData.profile.stats
    document.getElementById("gamesPlayed").textContent = stats.gamesPlayed || 0
    document.getElementById("gamesWon").textContent = stats.gamesWon || 0
    document.getElementById("correctAnswers").textContent = stats.correctAnswers || 0
  }

  // Update category performance
  if (userData.profile && userData.profile.categoryPerformance) {
    updateCategoryStats(userData.profile.categoryPerformance)
  }
}

// Update category statistics
function updateCategoryStats(categoryPerformance) {
  const categoryStatsContainer = document.getElementById("categoryStats")
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

  categoryStatsContainer.innerHTML = categoryStatsHTML
}

// Set up profile page event listeners
function setupProfileListeners() {
  // Edit profile button
  const editProfileBtn = document.getElementById("editProfileBtn")
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"))

      // Populate edit form with current user data
      document.getElementById("editUsername").value = currentUser.username
      document.getElementById("editEmail").value = currentUser.email
      document.getElementById("editPassword").value = ""

      // Update avatar preview
      if (currentUser.profile && currentUser.profile.avatar) {
        document.getElementById("editProfileAvatar").src = currentUser.profile.avatar
      }

      // Show edit profile modal
      const editProfileModal = new bootstrap.Modal(document.getElementById("editProfileModal"))
      editProfileModal.show()
    })
  }

  // Avatar upload
  const avatarUpload = document.getElementById("avatarUpload")
  if (avatarUpload) {
    avatarUpload.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (!file) return

      // Check file type
      if (!file.type.match("image.*")) {
        alert("Please select an image file")
        return
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB")
        return
      }

      // Read file as data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataURL = e.target.result

        // Update avatar preview
        document.getElementById("editProfileAvatar").src = dataURL
      }

      reader.readAsDataURL(file)
    })
  }

  // Edit profile form submission
  const editProfileForm = document.getElementById("editProfileForm")
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("editUsername").value
      const email = document.getElementById("editEmail").value
      const password = document.getElementById("editPassword").value
      const avatar = document.getElementById("editProfileAvatar").src

      updateUserProfile(username, email, password, avatar)
    })
  }
}

// Update user profile
function updateUserProfile(username, email, password, avatar) {
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
    profile: {
      ...currentUser.profile,
      avatar,
    },
  }

  // Add password if provided
  if (password) {
    profileData.password = password
  }

  // Mock DB and bootstrap for demonstration purposes
  const DB = {
    updateUserProfile: (id, data) => {
      // Simulate updating user profile in a database
      const users = JSON.parse(localStorage.getItem("users")) || []
      const userIndex = users.findIndex((user) => user.id === id)

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data }
        localStorage.setItem("users", JSON.stringify(users))
        localStorage.setItem("currentUser", JSON.stringify(users[userIndex]))
        return { success: true, user: users[userIndex] }
      } else {
        return { success: false, message: "User not found. Reload the page." }
      }
    },
  }

  const bootstrap = {
    Modal: class Modal {
      constructor(element) {
        this._element = element
      }
      show() {
        // Simulate showing the modal
        this._element.style.display = "block"
      }
      hide() {
        // Simulate hiding the modal
        this._element.style.display = "none"
      }
      static getInstance(element) {
        return new Modal(element)
      }
    },
  }

  // Update profile
  const result = DB.updateUserProfile(currentUser.id, profileData)

  if (result.success) {
    // Update stored user data
    localStorage.setItem("currentUser", JSON.stringify(result.user))

    // Close modal
    const editProfileModal = bootstrap.Modal.getInstance(document.getElementById("editProfileModal"))
    if (editProfileModal) {
      editProfileModal.hide()
    }

    // Reload profile data
    loadProfileData(result.user)

    // Show success message
    alert("Profile updated successfully!")
  } else {
    showError(editProfileError, result.message || "Failed to update profile. Please try again.")
  }
}

// Helper function to show error messages
function showError(element, message) {
  if (element) {
    element.textContent = message
    element.classList.remove("d-none")
  }
}

