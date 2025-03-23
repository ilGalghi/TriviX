// Bootstrap utility functions
const BootstrapUtil = {
    // Get Bootstrap modal instance
    getModalInstance(modalElement) {
      if (!modalElement) return null
  
      // Check if Bootstrap is available
      let bootstrap
      if (typeof window !== "undefined") {
        bootstrap = window.bootstrap
      }
      if (typeof bootstrap !== "undefined") {
        return bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
      }
  
      // Fallback for when Bootstrap is not available
      return {
        show() {
          modalElement.style.display = "block"
          modalElement.classList.add("show")
          document.body.classList.add("modal-open")
  
          // Create backdrop
          const backdrop = document.createElement("div")
          backdrop.className = "modal-backdrop fade show"
          document.body.appendChild(backdrop)
        },
        hide() {
          modalElement.style.display = "none"
          modalElement.classList.remove("show")
          document.body.classList.remove("modal-open")
  
          // Remove backdrop
          const backdrop = document.querySelector(".modal-backdrop")
          if (backdrop) {
            backdrop.remove()
          }
        },
      }
    },
  }
  
  