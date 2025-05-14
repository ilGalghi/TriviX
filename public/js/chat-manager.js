// Usiamo la libreria Socket.IO per la chat che fornisce retrocompatibilità con tutti i browser (ajax)
// Connessione stabilita in TCP
class ChatManager {
    constructor() {
        this.hasJoinedRoom = false; // Indica se l'utente ha già partecipato a una stanza di chat
        this.socket = io('/', { // Inizializza la connessione Socket.IO
            transports: ['websocket'], // Usa solo il trasporto WebSocket
            upgrade: false // Disabilita l'upgrade a altri trasporti
        });
        this.unreadMessages = 0; // Contatore per i messaggi non letti
        this.chatButton = document.querySelector('.chat-button'); // Seleziona il pulsante della chat
        this.messages = []; // Array per mantenere i messaggi
        this.initializeWhenGameDataAvailable(); // Inizializza la chat quando i dati del gioco sono disponibili
    }

    // Inizializza la chat quando il Game ID è disponibile
    async initializeWhenGameDataAvailable() {
        let attempts = 0; // Contatore per i tentativi di recupero del Game ID
        const maxAttempts = 10; // Numero massimo di tentativi
        const checkInterval = setInterval(async () => {
            this.gameId = await this.getGameId(); // Recupera il Game ID
            attempts++;

            if (this.gameId) {
                clearInterval(checkInterval); // Ferma il controllo se il Game ID è trovato
                console.log('Game ID trovato:', this.gameId);
                
                // Inizializza gli elementi della chat
                this.messageInput = document.querySelector('.message-input'); // Seleziona l'input per i messaggi
                this.sendButton = document.querySelector('.send-button'); // Seleziona il pulsante di invio
                this.chatMessages = document.querySelector('.chat-messages'); // Seleziona il contenitore dei messaggi
                
                // Carica i messaggi salvati
                this.loadSavedMessages();
                
                this.setupSocketListeners(); // Imposta i listener per i socket
                this.setupEventListeners(); // Imposta i listener per gli eventi
                this.joinRoom(); // Unisciti alla stanza di chat
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval); // Ferma il controllo dopo il numero massimo di tentativi
                console.error('Game ID not found after several attempts');
            }
        }, 500); // Controlla ogni 500 ms
    }

    // Recupera il Game ID dalla query string o dal DOM
    async getGameId() {
        try {
            const urlParams = new URLSearchParams(window.location.search); // Ottiene i parametri della query
            let gameId = urlParams.get('code'); // Recupera il codice del gioco dalla query string

            if (!gameId) {
                const matchCodeElement = document.querySelector('[data-match-code]'); // Cerca un elemento con il codice partita
                if (matchCodeElement) {
                    gameId = matchCodeElement.dataset.matchCode; // Ottiene il codice dal dataset
                }
            }

            return gameId; // Restituisce il Game ID
        } catch (error) {
            console.error('Error retrieving Game ID:', error); // Log dell'errore
            return null; // Restituisce null in caso di errore
        }
    }

    // Imposta i listener per gli eventi Socket.IO
    setupSocketListeners() {
        this.socket.off('new-message'); // Rimuove eventuali listener esistenti per 'new-message'
        this.socket.off('connect'); // Rimuove listener per 'connect'
        this.socket.off('disconnect'); // Rimuove listener per 'disconnect'
        this.socket.off('error'); // Rimuove listener per 'error'
    
        this.socket.on('connect', () => {
            console.log('Connesso al server Socket.IO'); // Log per confermare la connessione
        });
    
        this.socket.on('disconnect', () => {
            console.log('Disconnesso dal server Socket.IO'); // Log per confermare la disconnessione
        });
    
        this.socket.on('new-message', (message) => {
            console.log('Nuovo messaggio ricevuto:', message); // Log per un nuovo messaggio ricevuto
            this.addMessageToChat(message); // Aggiunge il messaggio alla chat
            this.saveMessage(message); // Salva il messaggio

            // Solo incrementa se il messaggio NON è stato inviato dall'utente corrente
            const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Ottiene i dati dell'utente corrente
            if (currentUser && message.sender !== currentUser.username) {
                const chatSidebar = document.querySelector('.chat-sidebar'); // Seleziona la sidebar della chat
                if (chatSidebar && chatSidebar.classList.contains('active')) {
                    this.resetUnreadMessages(); // Resetta il contatore dei messaggi non letti se la chat è aperta
                } else {
                    this.incrementUnreadMessages(); // Incrementa il contatore dei messaggi non letti
                }
            }
        });
    
        this.socket.on('error', (error) => {
            console.error('Errore Socket.IO:', error); // Log dell'errore
        });
    }

    // Imposta i listener per gli eventi del DOM
    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage()); // Listener per il pulsante di invio
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(); // Invia il messaggio se viene premuto 'Enter'
                }
            });
        }

        const chatSidebar = document.querySelector('.chat-sidebar'); // Seleziona la sidebar della chat
        const closeButton = document.getElementById('closeChatButton'); // Seleziona il pulsante di chiusura
        const chatButton = document.querySelector('.chat-button'); // Seleziona il pulsante della chat
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (chatSidebar) {
                    chatSidebar.classList.remove('active'); // Nasconde la sidebar della chat
                    this.resetUnreadMessages(); // Resetta il contatore dei messaggi non letti
                }
            });
        }
        
        if (chatButton) {
            chatButton.addEventListener('click', () => {
                if (chatSidebar) {
                    chatSidebar.classList.add('active'); // Mostra la sidebar della chat
                    this.resetUnreadMessages(); // Resetta il contatore dei messaggi non letti
                }
            });
        }
    }

    // Unisciti alla stanza di chat
    joinRoom() {
        if (this.gameId && !this.hasJoinedRoom) {
            console.log('Entrando nella stanza:', this.gameId); // Log per indicare l'ingresso nella stanza
            this.socket.emit('join-room', this.gameId); // Invia un evento per unirsi alla stanza
            this.hasJoinedRoom = true; // Imposta il flag per indicare che l'utente ha già partecipato
        }
    }

    // Invia un messaggio
    async sendMessage() {
        if (!this.messageInput) return; // Esci se l'input del messaggio non esiste
        
        const content = this.messageInput.value.trim(); // Ottiene il contenuto del messaggio
        if (!content) return; // Esci se il contenuto è vuoto
    
        const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Ottiene i dati dell'utente corrente
        if (!currentUser) {
            console.error('Utente non autenticato'); // Log se l'utente non è autenticato
            return;
        }
    
        const message = {
            sender: currentUser.username, // Nome dell'utente che invia il messaggio
            content: content, // Contenuto del messaggio
            roomId: this.gameId, // ID della stanza
            timestamp: new Date().toISOString() // Aggiungi timestamp per ordinare i messaggi
        };
    
        console.log('Invio messaggio:', message); // Log per il messaggio in fase di invio
        this.socket.emit('send-message', message); // Invia il messaggio al server
        // Non aggiungiamo più il messaggio qui, perché sarà ricevuto dall'evento 'new-message'
        // this.addMessageToChat(message);
        // this.saveMessage(message);
        this.messageInput.value = ''; // Pulisce l'input del messaggio
    }

    // Aggiunge un messaggio alla chat
    addMessageToChat(message) {
        if (!this.chatMessages) return; // Esci se il contenitore dei messaggi non esiste
    
        const currentUser = JSON.parse(localStorage.getItem("currentUser")); // Ottiene i dati dell'utente corrente
        if (!currentUser) return; // Esci se l'utente non è autenticato
    
        const messageElement = document.createElement('div'); // Crea un nuovo elemento per il messaggio
        messageElement.className = `message ${message.sender === currentUser.username ? 'sent' : 'received'}`; // Imposta la classe in base al mittente
    
        const senderElement = document.createElement('div'); // Crea un elemento per il mittente
        senderElement.className = 'message-sender'; // Imposta la classe per il mittente
        senderElement.textContent = message.sender; // Imposta il nome del mittente
        
        const contentElement = document.createElement('div'); // Crea un elemento per il contenuto del messaggio
        contentElement.className = 'message-content'; // Imposta la classe per il contenuto
        contentElement.textContent = message.content; // Imposta il contenuto del messaggio
        
        messageElement.appendChild(senderElement); // Aggiunge il mittente all'elemento del messaggio
        messageElement.appendChild(contentElement); // Aggiunge il contenuto all'elemento del messaggio
        
        this.chatMessages.appendChild(messageElement); // Aggiunge il messaggio al contenitore dei messaggi
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight; // Scorre verso il basso per mostrare l'ultimo messaggio
    }
    
    // Salva un messaggio nel localStorage
    saveMessage(message) {
        if (!this.gameId) return; // Esci se non c'è un Game ID
        
        // Aggiungi il messaggio all'array
        this.messages.push(message);
        
        // Salva l'array aggiornato nel localStorage
        localStorage.setItem(`chat_messages_${this.gameId}`, JSON.stringify(this.messages));
    }
    
    // Carica i messaggi dal localStorage
    loadSavedMessages() {
        if (!this.gameId || !this.chatMessages) return; // Esci se non c'è un Game ID o il contenitore dei messaggi non esiste
        
        try {
            // Recupera i messaggi salvati
            const savedMessages = localStorage.getItem(`chat_messages_${this.gameId}`);
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages); // Converte i messaggi salvati in un array
                
                // Ordina i messaggi per timestamp (se presente)
                this.messages.sort((a, b) => {
                    if (a.timestamp && b.timestamp) {
                        return new Date(a.timestamp) - new Date(b.timestamp); // Ordina i messaggi in base al timestamp
                    }
                    return 0; // Se non ci sono timestamp, non cambia l'ordine
                });
                
                // Pulisci il contenitore dei messaggi
                this.chatMessages.innerHTML = ''; // Pulisce il contenitore dei messaggi
                
                // Aggiungi i messaggi alla UI
                this.messages.forEach(message => {
                    this.addMessageToChat(message); // Aggiunge ogni messaggio alla chat
                });
                
                console.log(`Caricati ${this.messages.length} messaggi salvati per la partita ${this.gameId}`); // Log per confermare il caricamento dei messaggi
            }
        } catch (error) {
            console.error('Errore nel caricamento dei messaggi salvati:', error); // Log dell'errore
        }
    }
    
    // Incrementa il contatore dei messaggi non letti
    incrementUnreadMessages() {
        this.unreadMessages++; // Incrementa il contatore
        this.updateUnreadBadge(); // Aggiorna il badge dei messaggi non letti
    }

    // Resetta il contatore dei messaggi non letti
    resetUnreadMessages() {
        this.unreadMessages = 0; // Resetta il contatore
        this.updateUnreadBadge(); // Aggiorna il badge dei messaggi non letti
    }

    // Aggiorna il badge dei messaggi non letti
    updateUnreadBadge() {
        if (!this.chatButton) return; // Esci se il pulsante della chat non esiste

        let badge = this.chatButton.querySelector('.unread-badge'); // Seleziona il badge dei messaggi non letti
        
        if (this.unreadMessages > 0) {
            if (!badge) {
                badge = document.createElement('span'); // Crea un nuovo badge se non esiste
                badge.className = 'unread-badge'; // Imposta la classe per il badge
                this.chatButton.appendChild(badge); // Aggiunge il badge al pulsante della chat
            }
            badge.textContent = this.unreadMessages; // Imposta il testo del badge
        } else if (badge) {
            badge.remove(); // Rimuove il badge se non ci sono messaggi non letti
        }
    }
    
    // Metodo per pulire la chat (da chiamare quando la partita termina)
    clearChat() {
        if (this.gameId) {
            localStorage.removeItem(`chat_messages_${this.gameId}`); // Rimuove i messaggi salvati dal localStorage
            this.messages = []; // Resetta l'array dei messaggi
            if (this.chatMessages) {
                this.chatMessages.innerHTML = ''; // Pulisce il contenitore dei messaggi
            }
        }
    }
}

// Inizializza il gestore della chat quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatManager) {
        window.chatManager = new ChatManager(); // Crea una nuova istanza di ChatManager se non esiste già
    }
});
  