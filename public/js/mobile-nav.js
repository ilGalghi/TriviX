// Mobile navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Gestione dei link nella navbar mobile
    setupMobileNavLinks();
    // Aggiorna l'aspetto del link Profile/Login in base allo stato di autenticazione
    updateProfileLoginLink();
});

// Configura i link della navbar mobile
function setupMobileNavLinks() {
    // Trova tutti i link nella navbar mobile
    const mobileProfileLinks = document.querySelectorAll('.mobile-nav a[href="profile.html"]');
    const mobileStatsLinks = document.querySelectorAll('.mobile-nav a[href="matches.html"]');
    
    // Aggiungi event listener a ciascun link del profilo
    mobileProfileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Verifica se l'utente è autenticato
            const isLoggedIn = !!localStorage.getItem('currentUser');
            
            // Se l'utente non è autenticato, impedisci il comportamento predefinito
            if (!isLoggedIn) {
                e.preventDefault();
                
                // Reindirizza alla pagina di login (tramite il modal di login nella homepage)
                window.location.href = 'index.html';
                
                // Memorizza un flag per aprire il modal di login
                sessionStorage.setItem('openLoginModal', 'true');
                sessionStorage.setItem('loginReason', 'profile');
            }
            // Se l'utente è autenticato, lascia che la navigazione prosegua normalmente
        });
    });
    
    // Aggiungi event listener a ciascun link delle statistiche
    mobileStatsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Verifica se l'utente è autenticato
            const isLoggedIn = !!localStorage.getItem('currentUser');
            
            // Se l'utente non è autenticato, impedisci il comportamento predefinito
            if (!isLoggedIn) {
                e.preventDefault();
                
                // Reindirizza alla pagina di login (tramite il modal di login nella homepage)
                window.location.href = 'index.html';
                
                // Memorizza un flag per aprire il modal di login
                sessionStorage.setItem('openLoginModal', 'true');
                sessionStorage.setItem('loginReason', 'stats');
            }
            // Se l'utente è autenticato, lascia che la navigazione prosegua normalmente
        });
    });
}

// Aggiorna l'aspetto del link Profile/Login nella navbar mobile
function updateProfileLoginLink() {
    // Verifica se l'utente è autenticato
    const isLoggedIn = !!localStorage.getItem('currentUser');
    
    // Trova tutti i link del profilo nella navbar mobile
    const mobileProfileLinks = document.querySelectorAll('.mobile-nav a[href="profile.html"]');
    
    mobileProfileLinks.forEach(link => {
        // Seleziona l'icona e il testo all'interno del link
        const icon = link.querySelector('i');
        const text = link.querySelector('span');
        
        if (isLoggedIn) {
            // Se autenticato, mostra il link del profilo
            if (icon) icon.className = 'fas fa-user';
            if (text) text.textContent = 'Profile';
        } else {
            // Se non autenticato, mostra il link del login
            if (icon) icon.className = 'fas fa-sign-in-alt';
            if (text) text.textContent = 'Login';
        }
    });
}

// Ascolta gli eventi di autenticazione per aggiornare l'interfaccia
document.addEventListener('authStateChanged', function() {
    updateProfileLoginLink();
});

// Esporre la funzione updateProfileLoginLink per permettere ad altri script di chiamarla
window.updateMobileNavUI = updateProfileLoginLink; 