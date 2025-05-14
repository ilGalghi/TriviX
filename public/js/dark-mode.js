// Dark mode toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Seleziona il pulsante di attivazione/disattivazione della modalità scura
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Controlla se esiste una preferenza di tema salvata o utilizza la preferenza di colore del sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        // Abilita la modalità scura se la preferenza è 'dark'
        enableDarkMode();
    } else {
        // Disabilita la modalità scura se non è impostata
        disableDarkMode();
    }
    
    // Aggiunge un evento al pulsante per attivare/disattivare la modalità scura al clic
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            // Controlla se la modalità scura è già attiva
            if (body.classList.contains('dark-mode')) {
                disableDarkMode(); // Disabilita la modalità scura
            } else {
                enableDarkMode(); // Abilita la modalità scura
            }
        });
    }
    
    // Funzione per abilitare la modalità scura
    function enableDarkMode() {
        body.classList.add('dark-mode'); // Aggiunge la classe 'dark-mode' al body
        localStorage.setItem('theme', 'dark'); // Salva la preferenza nel localStorage
        updateToggleButton(true); // Aggiorna l'aspetto del pulsante
    }
    
    // Funzione per disabilitare la modalità scura
    function disableDarkMode() {
        body.classList.remove('dark-mode'); // Rimuove la classe 'dark-mode' dal body
        localStorage.setItem('theme', 'light'); // Salva la preferenza nel localStorage
        updateToggleButton(false); // Aggiorna l'aspetto del pulsante
    }
    
    // Funzione per aggiornare l'aspetto del pulsante di attivazione/disattivazione
    function updateToggleButton(isDark) {
        if (!darkModeToggle) return; // Se il pulsante non esiste, esci dalla funzione
        
        // Cambia il contenuto del pulsante in base allo stato della modalità
        if (isDark) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode'; // Modalità scura attiva
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode'; // Modalità scura disattivata
        }
    }
    
    // Ascolta i cambiamenti del tema del sistema operativo
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Se il tema del sistema è scuro, abilita la modalità scura
        if (e.matches) {
            enableDarkMode();
        } else {
            // Altrimenti, disabilita la modalità scura
            disableDarkMode();
        }
    });
});
  
  