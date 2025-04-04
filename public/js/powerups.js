// Classe per gestire i powerup del gioco
// Ogni powerup può essere utilizzato una sola volta per partita
class PowerupManager {
    constructor() {
        this.extraTimeUsed = false;
        this.bombUsed = false;
        this.doubleChanceUsed = false;
        this.skipUsed = false;
        this.aiHintUsed = false;
        
        // Recupera lo stato salvato dei powerup per questa partita
        this.gameCode = this.getGameCode();
        this.loadPowerupState();
        
        this.initializePowerups();
    }

    // Ottieni il codice della partita attuale dall'URL
    getGameCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("code");
    }
    
    // Salva lo stato dei powerup nel localStorage
    savePowerupState() {
        if (!this.gameCode) return;
        
        const state = {
            extraTimeUsed: this.extraTimeUsed,
            bombUsed: this.bombUsed,
            doubleChanceUsed: this.doubleChanceUsed,
            skipUsed: this.skipUsed,
            aiHintUsed: this.aiHintUsed
        };
        
        localStorage.setItem(`powerupState_${this.gameCode}`, JSON.stringify(state));
    }
    
    // Carica lo stato dei powerup dal localStorage
    loadPowerupState() {
        if (!this.gameCode) return;
        
        const savedState = localStorage.getItem(`powerupState_${this.gameCode}`);
        if (savedState) {
            const state = JSON.parse(savedState);
            this.extraTimeUsed = state.extraTimeUsed;
            this.bombUsed = state.bombUsed;
            this.doubleChanceUsed = state.doubleChanceUsed;
            this.skipUsed = state.skipUsed;
            this.aiHintUsed = state.aiHintUsed || false;
            
            // Dopo aver caricato lo stato, aggiorna visivamente i powerup
            setTimeout(() => this.updatePowerupVisuals(), 100);
        }
    }
    
    // Aggiorna visivamente lo stato dei powerup
    updatePowerupVisuals() {
        if (this.extraTimeUsed) this.disablePowerup('extraTimePowerup');
        if (this.bombUsed) this.disablePowerup('bombPowerup');
        if (this.doubleChanceUsed) this.disablePowerup('doubleChancePowerup');
        if (this.skipUsed) this.disablePowerup('skipPowerup');
        if (this.aiHintUsed) this.disablePowerup('aiHintPowerup');
    }

    initializePowerups() {
        // Extra Time Powerup
        const extraTimeBtn = document.getElementById('extraTimePowerup');
        if (extraTimeBtn) {
            extraTimeBtn.addEventListener('click', () => this.useExtraTime());
        }

        // Bomb Powerup
        const bombBtn = document.getElementById('bombPowerup');
        if (bombBtn) {
            bombBtn.addEventListener('click', () => this.useBomb());
        }

        // Double Chance Powerup
        const doubleChanceBtn = document.getElementById('doubleChancePowerup');
        if (doubleChanceBtn) {
            doubleChanceBtn.addEventListener('click', () => this.useDoubleChance());
        }

        // Skip Powerup
        const skipBtn = document.getElementById('skipPowerup');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.useSkip());
        }

        // AI Hint Powerup
        const aiHintBtn = document.getElementById('aiHintPowerup');
        if (aiHintBtn) {
            aiHintBtn.addEventListener('click', () => this.useAiHint());
        }
    }

    useExtraTime() {
        if (this.extraTimeUsed) return;
        
        // Aggiungi 10 secondi al timer
        if (window.questionTimer) {
            const currentTime = window.questionTimer.getTimeLeft();
            window.questionTimer.updateTime(currentTime + 10);
        }
        
        this.extraTimeUsed = true;
        this.disablePowerup('extraTimePowerup');
        this.savePowerupState();
    }

    useBomb() {
        if (this.bombUsed) return;

        const answersContainer = document.getElementById('answersContainer');
        const answers = answersContainer.querySelectorAll('.answer-option');
        
        // Ottieni l'indice della risposta corretta dalla domanda corrente
        const correctIndex = window.currentQuestion.correctIndex;
        
        // Filtra solo le risposte sbagliate (quelle con indice diverso da correctIndex)
        let incorrectAnswers = Array.from(answers).filter(answer => {
            const answerIndex = parseInt(answer.dataset.index);
            return answerIndex !== correctIndex && !answer.classList.contains('selected');
        });

        // Elimina due risposte sbagliate casuali
        for (let i = 0; i < 2 && incorrectAnswers.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * incorrectAnswers.length);
            incorrectAnswers[randomIndex].style.display = 'none';
            incorrectAnswers.splice(randomIndex, 1);
        }

        this.bombUsed = true;
        this.disablePowerup('bombPowerup');
        this.savePowerupState();
    }

    useDoubleChance() {
        if (this.doubleChanceUsed) return;

        const answersContainer = document.getElementById('answersContainer');
        const answers = answersContainer.querySelectorAll('.answer-option');
        let attempts = 0;
        const maxAttempts = 2;
        
        // Aggiungi un indicatore visivo che il Double Chance è attivo
        const powerupMessage = document.getElementById('powerupMessage');
        powerupMessage.textContent = "Double Chance attivo! Hai 2 tentativi";
        powerupMessage.className = 'powerup-message active';
        
        // Rimuovi gli event listener precedenti
        answers.forEach(answer => {
            const newAnswer = answer.cloneNode(true);
            answer.parentNode.replaceChild(newAnswer, answer);
        });

        // Aggiungi i nuovi event listener per gestire i due tentativi
        answersContainer.querySelectorAll('.answer-option').forEach(answer => {
            answer.addEventListener('click', () => {
                if (!answer.classList.contains('selected')) {
                    attempts++;
                    answer.classList.add('selected');
                    
                    // Controlla se la risposta è corretta
                    const selectedIndex = parseInt(answer.dataset.index);
                    const isCorrect = selectedIndex === window.currentQuestion.correctIndex;
                    
                    if (isCorrect) {
                        // Se la risposta è corretta, mostra il risultato
                        stopTimer();
                        checkAnswer(selectedIndex, window.currentQuestion.correctIndex, window.currentQuestion.explanation);
                    } else if (attempts >= maxAttempts) {
                        // Se abbiamo esaurito i tentativi, mostra il risultato
                        stopTimer();
                        checkAnswer(selectedIndex, window.currentQuestion.correctIndex, window.currentQuestion.explanation);
                    } else {
                        // Se è il primo tentativo e non è corretto
                        answer.classList.add('wrong-answer');
                        answer.style.backgroundColor = '#ffebee'; // Sfondo rosso chiaro
                        answer.style.color = '#d32f2f'; // Testo rosso
                        answer.style.border = '2px solid #d32f2f'; // Bordo rosso
                        
                        // Aggiorna il messaggio di stato
                        powerupMessage.textContent = "Primo tentativo sbagliato! Hai ancora 1 possibilità";
                        powerupMessage.className = 'powerup-message warning';
                        
                        // Rimuovi la classe selected per permettere una nuova selezione
                        answer.classList.remove('selected');
                    }
                }
            });
        });

        this.doubleChanceUsed = true;
        this.disablePowerup('doubleChancePowerup');
        this.savePowerupState();
    }

    useSkip() {
        if (this.skipUsed) return;

        // Ferma il timer corrente
        if (window.questionTimer) {
            stopTimer();
        }

        // Salta la domanda corrente e mostra una nuova domanda
        const currentCategory = document.getElementById('questionCategory').textContent.toLowerCase();
        showQuestion(currentCategory);

        this.skipUsed = true;
        this.disablePowerup('skipPowerup');
        this.savePowerupState();
    }

    useAiHint() {
        if (this.aiHintUsed) return;

        // Ottieni la domanda corrente
        const questionText = document.getElementById('questionText').textContent.trim();
        
        // Mostra un messaggio di caricamento
        const powerupMessage = document.getElementById('powerupMessage');
        powerupMessage.textContent = "Sto chiedendo all'AI un suggerimento...";
        powerupMessage.className = 'powerup-message hint-active';
        
        // Richiesta all'API di Gemini
        // L'API genererà un suggerimento utile senza rivelare la risposta esatta
        // Il server formatta il prompt per assicurarsi che il suggerimento sia utile ma non diretto
        this.getAiHint(questionText)
            .then(hint => {
                // Aggiorna il messaggio con il suggerimento
                powerupMessage.innerHTML = `<strong>Suggerimento AI:</strong> ${hint}`;
                powerupMessage.className = 'powerup-message hint-active';
            })
            .catch(error => {
                console.error('Errore nel recupero del suggerimento AI:', error);
                powerupMessage.textContent = "Errore nel recupero del suggerimento. Riprova più tardi.";
                powerupMessage.className = 'powerup-message warning';
                
                // Ripristina il powerup (solo in caso di errore)
                return;
            });
        
        this.aiHintUsed = true;
        this.disablePowerup('aiHintPowerup');
        this.savePowerupState();
    }
    
    async getAiHint(question) {
        try {
            const response = await fetch('/api/ai/hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: question
                })
            });
            
            if (!response.ok) {
                throw new Error('Errore nella risposta del server');
            }
            
            const data = await response.json();
            return data.hint;
        } catch (error) {
            console.error('Errore nella richiesta AI hint:', error);
            throw error;
        }
    }

    disablePowerup(powerupId) {
        const powerup = document.getElementById(powerupId);
        if (powerup) {
            powerup.style.opacity = '0.35';
            powerup.style.pointerEvents = 'none';
            powerup.style.position = 'relative';
            powerup.style.backgroundColor = '#444';
            powerup.style.filter = 'grayscale(100%)';
            powerup.style.border = '1px solid #666';
        }
    }

    resetPowerups() {
        this.extraTimeUsed = false;
        this.bombUsed = false;
        this.doubleChanceUsed = false;
        this.skipUsed = false;
        this.aiHintUsed = false;

        // Reset del messaggio del powerup
        const powerupMessage = document.getElementById('powerupMessage');
        if (powerupMessage) {
            powerupMessage.textContent = '';
            powerupMessage.className = 'powerup-message';
        }

        // Riabilita tutti i powerup
        ['extraTimePowerup', 'bombPowerup', 'doubleChancePowerup', 'skipPowerup', 'aiHintPowerup'].forEach(id => {
            const powerup = document.getElementById(id);
            if (powerup) {
                // Rimuove gli stili inline
                powerup.style = '';
            }
        });
        
        // Cancella lo stato salvato nel localStorage
        if (this.gameCode) {
            localStorage.removeItem(`powerupState_${this.gameCode}`);
        }
    }
}

// Inizializza il PowerupManager quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
    window.powerupManager = new PowerupManager();
}); 