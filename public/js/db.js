// Database module for handling user data
const DB = {
    // Initialize the database
    init() {
      // Check if localStorage is available
      if (typeof localStorage === "undefined") {
        console.error("localStorage is not available in this browser")
        return false
      }
  
      // Initialize users database if it doesn't exist
      if (!localStorage.getItem("triviacrack_users")) {
        localStorage.setItem("triviacrack_users", JSON.stringify([]))
      }
  
      return true
    },
  
    // Get all users
    getUsers() {
      try {
        return JSON.parse(localStorage.getItem("triviacrack_users") || "[]")
      } catch (error) {
        console.error("Error getting users:", error)
        return []
      }
    },
  
    // Save users to database
    saveUsers(users) {
      try {
        localStorage.setItem("triviacrack_users", JSON.stringify(users))
        return true
      } catch (error) {
        console.error("Error saving users:", error)
        return false
      }
    },
  
    // Find user by username
    findUserByUsername(username) {
      const users = this.getUsers()
      return users.find((user) => user.username.toLowerCase() === username.toLowerCase())
    },
  
    // Find user by email
    findUserByEmail(email) {
      const users = this.getUsers()
      return users.find((user) => user.email.toLowerCase() === email.toLowerCase())
    },
  
    // Add new user
    addUser(userData) {
      const users = this.getUsers()
  
      // Check if username or email already exists
      if (this.findUserByUsername(userData.username)) {
        return { success: false, message: "Username already exists" }
      }
  
      if (this.findUserByEmail(userData.email)) {
        return { success: false, message: "Email already exists" }
      }
  
      // Create user object with default profile data
      const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        password: userData.password, // In a real app, this should be hashed
        createdAt: new Date().toISOString(),
        profile: {
          avatar: "img/default-avatar.png",
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            correctAnswers: 0,
          },
          categoryPerformance: {
            science: { correct: 0, total: 0 },
            entertainment: { correct: 0, total: 0 },
            sports: { correct: 0, total: 0 },
            art: { correct: 0, total: 0 },
            geography: { correct: 0, total: 0 },
            history: { correct: 0, total: 0 },
          },
        },
      }
  
      // Add user to database
      users.push(newUser)
      this.saveUsers(users)
  
      // Return success without password
      const { password, ...userWithoutPassword } = newUser
      return { success: true, user: userWithoutPassword }
    },
  
    // Authenticate user
    authenticateUser(username, password) {
      const user = this.findUserByUsername(username)
  
      if (!user) {
        return { success: false, message: "User not found" }
      }
  
      if (user.password !== password) {
        // In a real app, compare hashed passwords
        return { success: false, message: "Incorrect password" }
      }
  
      // Return user data without password
      const { password: pwd, ...userWithoutPassword } = user
      return { success: true, user: userWithoutPassword }
    },
  
    // Update user profile
    updateUserProfile(userId, profileData) {
      const users = this.getUsers()
      const userIndex = users.findIndex((user) => user.id === userId)
  
      if (userIndex === -1) {
        return { success: false, message: "User not found" }
      }
  
      // Update profile data
      users[userIndex].profile = {
        ...users[userIndex].profile,
        ...profileData,
      }
  
      // If username or email is being updated, check for duplicates
      if (profileData.username && profileData.username !== users[userIndex].username) {
        if (this.findUserByUsername(profileData.username)) {
          return { success: false, message: "Username already exists" }
        }
        users[userIndex].username = profileData.username
      }
  
      if (profileData.email && profileData.email !== users[userIndex].email) {
        if (this.findUserByEmail(profileData.email)) {
          return { success: false, message: "Email already exists" }
        }
        users[userIndex].email = profileData.email
      }
  
      // Update password if provided
      if (profileData.password) {
        users[userIndex].password = profileData.password // Hash the password
      }
  
      this.saveUsers(users)
  
      // Return updated user without password
      const { password, ...userWithoutPassword } = users[userIndex]
      return { success: true, user: userWithoutPassword }
    },
  
    // Update game statistics
    updateGameStats(userId, gameStats) {
      const users = this.getUsers()
      const userIndex = users.findIndex((user) => user.id === userId)
  
      if (userIndex === -1) {
        return { success: false, message: "User not found" }
      }
  
      // Update game statistics
      const userStats = users[userIndex].profile.stats
      userStats.gamesPlayed = (userStats.gamesPlayed || 0) + (gameStats.gamesPlayed || 0)
      userStats.gamesWon = (userStats.gamesWon || 0) + (gameStats.gamesWon || 0)
      userStats.correctAnswers = (userStats.correctAnswers || 0) + (gameStats.correctAnswers || 0)
  
      // Update category performance if provided
      if (gameStats.categoryPerformance) {
        Object.keys(gameStats.categoryPerformance).forEach((category) => {
          if (!users[userIndex].profile.categoryPerformance[category]) {
            users[userIndex].profile.categoryPerformance[category] = { correct: 0, total: 0 }
          }
  
          users[userIndex].profile.categoryPerformance[category].correct +=
            gameStats.categoryPerformance[category].correct || 0
          users[userIndex].profile.categoryPerformance[category].total +=
            gameStats.categoryPerformance[category].total || 0
        })
      }
  
      this.saveUsers(users)
  
      return { success: true }
    },
  
    // Get user by ID
    getUserById(userId) {
      const users = this.getUsers()
      const user = users.find((user) => user.id === userId)
  
      if (!user) {
        return { success: false, message: "User not found" }
      }
  
      // Return user without password
      const { password, ...userWithoutPassword } = user
      return { success: true, user: userWithoutPassword }
    },
  }
  
  // Initialize database on load
  DB.init()