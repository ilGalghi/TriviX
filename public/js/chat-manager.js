class ChatManager {
    constructor() {
        this.hasJoinedRoom = false; // Flag per evitare join multipli
        this.socket = io('http://localhost:3000', {
            transports: ['websocket'],
            upgrade: false
        });
        this.unreadMessages = 0;
        this.chatButton = document.querySelector('.chat-button');
        this.initializeWhenGameDataAvailable();

    }

    async initializeWhenGameDataAvailable() {
        // Attendi che i dati del gioco siano disponibili
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(async () => {
            this.gameId = await this.getGameId();
            attempts++;

            if (this.gameId) {
                clearInterval(checkInterval);
                console.log('Game ID trovato:', this.gameId);
                
                // Inizializza la chat
                this.messageInput = document.querySelector('.chat-input input');
                this.sendButton = document.querySelector('.chat-input button');
                this.chatMessages = document.querySelector('.chat-messages');
                
                this.setupSocketListeners();
                this.setupEventListeners();
                this.joinRoom();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('Game ID non trovato dopo diversi tentativi');
            }
        }, 500); // Controlla ogni 500ms
    }

    async getGameId() {
        try {
            // Prima prova a ottenere il codice partita dall'URL
            const urlParams = new URLSearchParams(window.location.search);
            let gameId = urlParams.get('matchCode');

            // Se non è nell'URL, prova a ottenerlo dall'elemento HTML
            if (!gameId) {
                const matchCodeElement = document.querySelector('[data-match-code]');
                if (matchCodeElement) {
                    gameId = matchCodeElement.dataset.matchCode;
                }
            }

            // Se ancora non lo troviamo, cerca nell'URL il pattern della partita
            if (!gameId) {
                const pathParts = window.location.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart.length === 6) {
                    gameId = lastPart;
                }
            }

            // Se ancora non lo troviamo, prova a ottenerlo dai dati del gioco
            if (!gameId) {
                const matchDataElement = document.querySelector('#matchData');
                if (matchDataElement && matchDataElement.dataset.matchCode) {
                    gameId = matchDataElement.dataset.matchCode;
                }
            }

            // Come ultima risorsa, prova a cercarlo nel localStorage
            if (!gameId) {
                const currentMatch = localStorage.getItem('currentMatch');
                if (currentMatch) {
                    const matchData = JSON.parse(currentMatch);
                    gameId = matchData.matchCode;
                }
            }

            return gameId;
        } catch (error) {
            console.error('Errore nel recupero del Game ID:', error);
            return null;
        }
    }

    setupSocketListeners() {
        // Rimuovi tutti i listener relativi agli eventi che ti interessano
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
            this.incrementUnreadMessages();
        });
    
        this.socket.on('error', (error) => {
            console.error('Errore Socket.IO:', error);
        });
    }

    setupEventListeners() {
        // Gestisci l'invio dei messaggi
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

        // Gestisci l'apertura/chiusura della chat
        const chatSidebar = document.querySelector('.chat-sidebar');
        const closeButton = document.querySelector('.close-button');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (chatSidebar) {
                    chatSidebar.classList.remove('open');
                    this.resetUnreadMessages();
                }
            });
        }
    }

    joinRoom() {
        console.log('Flag hasJoinedRoom prima del join:', this.hasJoinedRoom);
        if (this.gameId && !this.hasJoinedRoom) {
            console.log('Entrando nella stanza:', this.gameId);
            this.socket.emit('join-room', this.gameId);
            this.hasJoinedRoom = true;
            console.log('Flag hasJoinedRoom impostato a:', this.hasJoinedRoom);
        }
    }

    async sendMessage() {
        if (!this.messageInput) return;
        
        const content = this.messageInput.value.trim();
        if (!content) return;
    
        let username = '';
        const usernameElement = document.querySelector('.username') || 
                              document.querySelector('.player-name') ||
                              document.querySelector('[data-username]');
        
        if (usernameElement) {
            username = usernameElement.textContent.trim() || 
                      usernameElement.dataset.username;
        }
    
        if (!username) {
            console.error('Username non trovato');
            return;
        }
    
        const message = {
            sender: username,
            content: content,
            roomId: this.gameId
        };
    
        console.log('Invio messaggio:', message);
        this.socket.emit('send-message', message);
        this.messageInput.value = '';
    }
    

    addMessageToChat(message) {
        if (!this.chatMessages) return;
    
        let username = '';
        const usernameElement = document.querySelector('.username') || 
                              document.querySelector('.player-name') ||
                              document.querySelector('[data-username]');
        
        if (usernameElement) {
            username = usernameElement.textContent.trim() || 
                      usernameElement.dataset.username;
        }
    
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === username ? 'sent' : 'received'}`;
        messageElement.dataset.sender = message.sender;
        messageElement.dataset.content = message.content;
    
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
}

// Inizializza il gestore della chat quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
  });
  