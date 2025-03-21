// API client for making requests to the server
const API = {
    // Base URL for API requests (empty for relative URLs)
    baseUrl: "",
  
    // Generic request method
    async request(endpoint, options = {}) {
      const url = `${this.baseUrl}/api/${endpoint}`
  
      // Default headers
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      }
  
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          credentials: "include", // Important for cookies/sessions
        })
  
        const data = await response.json()
        return data
      } catch (error) {
        console.error(`API error for ${endpoint}:`, error)
        throw error
      }
    },
  
    // Auth methods
    auth: {
      // Register a new user
      async register(userData) {
        return API.request("auth/register", {
          method: "POST",
          body: JSON.stringify(userData),
        })
      },
  
      // Login a user
      async login(credentials) {
        return API.request("auth/login", {
          method: "POST",
          body: JSON.stringify(credentials),
        })
      },
  
      // Get current user
      async getCurrentUser() {
        return API.request("auth/me")
      },
  
      // Logout
      async logout() {
        return API.request("auth/logout", {
          method: "POST",
        })
      },
  
      // Update profile
      async updateProfile(profileData) {
        return API.request("auth/profile", {
          method: "PUT",
          body: JSON.stringify(profileData),
        })
      },
  
      // Update game stats
      async updateStats(statsData) {
        return API.request("auth/stats", {
          method: "PUT",
          body: JSON.stringify(statsData),
        })
      },
    },
  }
  
  export { API }
  
  