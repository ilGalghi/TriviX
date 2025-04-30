class ChatManager {
    constructor() {
        this.hasJoinedRoom = false;
        this.socket = io('/', {
            transports: ['websocket'],
            upgrade: false
        });
        this.unreadMessages = 0;
        this.chatButton = document.querySelector('.chat-button');
        this.messages = []; // Array per mantenere i messaggi
        this.initializeWhenGameDataAvailable();
    }

    async initializeWhenGameDataAvailable() {
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(async () => {
            this.gameId = await this.getGameId();
            attempts++;

            if (this.gameId) {
                clearInterval(checkInterval);
                console.log('Game ID trovato:', this.gameId);
                
                // Inizializza la chat
                this.messageInput = document.querySelector('.message-input');
                this.sendButton = document.querySelector('.send-button');
                this.chatMessages = document.querySelector('.chat-messages');
                
                // Carica i messaggi salvati
                this.loadSavedMessages();
                
                this.setupSocketListeners();
                this.setupEventListeners();
                this.joinRoom();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('Game ID not found after several attempts');
            }
        }, 500);
    }

    async getGameId() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let gameId = urlParams.get('code');

            if (!gameId) {
                const matchCodeElement = document.querySelector('[data-match-code]');
                if (matchCodeElement) {
                    gameId = matchCodeElement.dataset.matchCode;
                }
            }

            return gameId;
        } catch (error) {
            console.error('Error retrieving Game ID:', error);
            return null;
        }
    }

    setupSocketListeners() {
        this.socket.off('new-message');
        this.socket.off('connect');
        this.socket.off('disconnect');
        this.socket.off('error');
    
        this.socket.on('connect', () => {
            console.log('Connesso al server Socket.IO');
        });
    
        this.socket.on('disconnect', () => {
            console.log('Disconnesso dal server Socket.IO');
        });
    
        this.socket.on('new-message', (message) => {
            console.log('Nuovo messaggio ricevuto:', message);
            this.addMessageToChat(message);
            this.saveMessage(message);

            // Solo incrementa se il messaggio NON è stato inviato dall'utente corrente
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            if (currentUser && message.sender !== currentUser.username) {
                const chatSidebar = document.querySelector('.chat-sidebar');
                if (chatSidebar && chatSidebar.classList.contains('active')) {
                    this.resetUnreadMessages();
                } else {
                    this.incrementUnreadMessages();
                }
            }
        });
    
        this.socket.on('error', (error) => {
            console.error('Errore Socket.IO:', error);
        });
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        const chatSidebar = document.querySelector('.chat-sidebar');
        const closeButton = document.getElementById('closeChatButton');
        const chatButton = document.querySelector('.chat-button');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (chatSidebar) {
                    chatSidebar.classList.remove('active');
                    this.resetUnreadMessages();
                }
            });
        }
        
        if (chatButton) {
            chatButton.addEventListener('click', () => {
                if (chatSidebar) {
                    chatSidebar.classList.add('active');
                    this.resetUnreadMessages();
                }
            });
        }
    }

    joinRoom() {
        if (this.gameId && !this.hasJoinedRoom) {
            console.log('Entrando nella stanza:', this.gameId);
            this.socket.emit('join-room', this.gameId);
            this.hasJoinedRoom = true;
        }
    }

    async sendMessage() {
        if (!this.messageInput) return;
        
        const content = this.messageInput.value.trim();
        if (!content) return;
    
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) {
            console.error('Utente non autenticato');
            return;
        }
    
        const message = {
            sender: currentUser.username,
            content: content,
            roomId: this.gameId,
            timestamp: new Date().toISOString() // Aggiungi timestamp per ordinare i messaggi
        };
    
        console.log('Invio messaggio:', message);
        this.socket.emit('send-message', message);
        // Non aggiungiamo più il messaggio qui, perché sarà ricevuto dall'evento 'new-message'
        // this.addMessageToChat(message);
        // this.saveMessage(message);
        this.messageInput.value = '';
    }

    addMessageToChat(message) {
        if (!this.chatMessages) return;
    
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) return;
    
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === currentUser.username ? 'sent' : 'received'}`;
    
        const senderElement = document.createElement('div');
        senderElement.className = 'message-sender';
        senderElement.textContent = message.sender;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message.content;
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    // Salva un messaggio nel localStorage
    saveMessage(message) {
        if (!this.gameId) return;
        
        // Aggiungi il messaggio all'array
        this.messages.push(message);
        
        // Salva l'array aggiornato nel localStorage
        localStorage.setItem(`chat_messages_${this.gameId}`, JSON.stringify(this.messages));
    }
    
    // Carica i messaggi dal localStorage
    loadSavedMessages() {
        if (!this.gameId || !this.chatMessages) return;
        
        try {
            // Recupera i messaggi salvati
            const savedMessages = localStorage.getItem(`chat_messages_${this.gameId}`);
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
                
                // Ordina i messaggi per timestamp (se presente)
                this.messages.sort((a, b) => {
                    if (a.timestamp && b.timestamp) {
                        return new Date(a.timestamp) - new Date(b.timestamp);
                    }
                    return 0;
                });
                
                // Pulisci il contenitore dei messaggi
                this.chatMessages.innerHTML = '';
                
                // Aggiungi i messaggi alla UI
                this.messages.forEach(message => {
                    this.addMessageToChat(message);
                });
                
                console.log(`Caricati ${this.messages.length} messaggi salvati per la partita ${this.gameId}`);
            }
        } catch (error) {
            console.error('Errore nel caricamento dei messaggi salvati:', error);
        }
    }
    
    incrementUnreadMessages() {
        this.unreadMessages++;
        this.updateUnreadBadge();
    }

    resetUnreadMessages() {
        this.unreadMessages = 0;
        this.updateUnreadBadge();
    }

    updateUnreadBadge() {
        if (!this.chatButton) return;

        let badge = this.chatButton.querySelector('.unread-badge');
        
        if (this.unreadMessages > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'unread-badge';
                this.chatButton.appendChild(badge);
            }
            badge.textContent = this.unreadMessages;
        } else if (badge) {
            badge.remove();
        }
    }
    
    // Metodo per pulire la chat (da chiamare quando la partita termina)
    clearChat() {
        if (this.gameId) {
            localStorage.removeItem(`chat_messages_${this.gameId}`);
            this.messages = [];
            if (this.chatMessages) {
                this.chatMessages.innerHTML = '';
            }
        }
    }
}

// Inizializza il gestore della chat quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatManager) {
        window.chatManager = new ChatManager();
    }
});
  