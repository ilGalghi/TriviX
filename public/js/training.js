import * as GameCore from './game-core.js';
import * as GameUI from './game-ui.js';

class TrainingManager {
    constructor() {
        // DOM elements
        this.categoryTitle = document.getElementById('categoryTitle');
        this.questionText = document.getElementById('questionText');
        this.answersContainer = document.getElementById('answersContainer');
        this.questionCounter = document.getElementById('questionCounter');
        this.scoreDisplay = document.getElementById('currentScore');
        this.resultSection = document.getElementById('resultSection');
        this.resultText = document.getElementById('resultText');
        this.resultExplanation = document.getElementById('resultExplanation');
        this.continueButton = document.getElementById('continueButton');
        this.finalScoreSection = document.getElementById('finalScoreSection');
        this.finalScoreValue = document.getElementById('finalScoreValue');
        this.finalScoreMessage = document.getElementById('finalScoreMessage');
        this.retryButton = document.getElementById('retryButton');
        this.timerValue = document.getElementById('timerValue');

        // Get category from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.category = urlParams.get('category');

        // State
        this.currentQuestionIndex = 0; // Indice per accedere alle domande
        this.questionNumber = 1; // Numero della domanda corrente (1-5)
        this.score = 0;
        this.questions = [];
        this.timer = null;
        this.timeLeft = 30;

       
        this.retryButton.addEventListener('click', () => this.restartTraining());

        // Initialize
        this.initializeTraining();
    }

    async initializeTraining() {
        try {
            // Set category title
            this.categoryTitle.textContent = this.getCategoryTitle(this.category);

            // Ottieni gli indici già usati
            const usedIndices = this.getUsedIndices(this.category);
            console.log('Indici usati:', usedIndices);

            // Fetch questions using fetch
            const response = await fetch(`/api/questions/${this.category}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usedIndices: usedIndices
                })
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Errore nel recupero della domanda: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Received data:', data);
            
            if (!data || !data.question) {
                console.error('Dati mancanti o invalidi:', data);
                alert('Nessuna domanda disponibile per questa categoria.');
                window.location.href = 'index.html';
                return;
            }

            // Salva la domanda corrente
            this.currentQuestion = data.question;
            this.saveUsedIndex(this.category, data.index);

            // Mostra la domanda
            this.showQuestion();
        } catch (error) {
            console.error('Error initializing training:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                category: this.category
            });
            alert('Errore nel caricamento delle domande. Riprova più tardi.');
            window.location.href = 'index.html';
        }
    }

    getCategoryTitle(category) {
        const titles = {
            science: 'Scienza',
            entertainment: 'Intrattenimento',
            sports: 'Sport',
            art: 'Arte',
            geography: 'Geografia',
            history: 'Storia'
        };
        return titles[category] || category;
    }

    showQuestion() {
        const question = this.currentQuestion;
        this.questionText.textContent = question.text;
        this.questionCounter.textContent = `Domanda ${this.questionNumber}/5`;

        // Gestisci l'immagine della domanda
        const questionCard = document.querySelector('.question-card');
        // Rimuovi eventuali immagini precedenti
        const oldImg = questionCard.querySelector('.question-image');
        if (oldImg) {
            oldImg.remove();
        }
        
        // Se la domanda ha un'immagine, visualizzala
        if (question.hasImage && question.imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = question.imageUrl;
            imgElement.alt = 'Question image';
            imgElement.className = 'question-image';
            // Inserisci l'immagine dopo il testo della domanda
            this.questionText.parentNode.insertBefore(imgElement, this.questionText.nextSibling);
        }

        // Clear previous answers
        this.answersContainer.innerHTML = '';

        // Add new answers
        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-option';
            answerElement.textContent = answer;
            answerElement.dataset.index = index;
            answerElement.addEventListener('click', () => this.handleAnswer(index, question.correctIndex, question.explanation));
            this.answersContainer.appendChild(answerElement);
        });

        // Start timer
        this.startTimer();
    }

    handleAnswer(selectedIndex, correctIndex, explanation) {
        // Stop timer
        this.stopTimer();

        // Check if answer is correct
        const isCorrect = selectedIndex === correctIndex;

        // Update score
        if (isCorrect) {
            this.score++;
            this.scoreDisplay.textContent = `Punteggio: ${this.score}`;
        }

        // Aggiorna le prestazioni dell'utente per categoria
        this.updateUserCategoryPerformance(this.category, isCorrect);

        // Show result
        this.showResult(isCorrect, explanation);
    }

    // Funzione per aggiornare le prestazioni dell'utente per categoria
    updateUserCategoryPerformance(category, isCorrect) {
        // Ottieni l'utente corrente
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        
        if (!currentUser) {
            console.error("Utente non autenticato");
            return;
        }
        
        // Prepara i dati da inviare al server
        const performanceData = {
            userId: currentUser.id,
            category: category,
            isCorrect: isCorrect
        };
        
        // Invia la richiesta al server
        fetch('/api/users/update-category-performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(performanceData),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nell\'aggiornamento delle prestazioni');
            }
            return response.json();
        })
        .then(data => {
            console.log('Prestazioni per categoria aggiornate:', data);
        })
        .catch(error => {
            console.error('Errore nell\'aggiornamento delle prestazioni per categoria:', error);
        });
    }

    showResult(isCorrect, explanation) {
        // Hide question section and show result section
        document.getElementById('questionSection').classList.add('d-none');
        this.resultSection.classList.remove('d-none');

        // Update result text and icon
        this.resultText.textContent = isCorrect ? 'Corretto!' : 'Sbagliato!';
        const resultIcon = document.getElementById('resultIcon');
        resultIcon.innerHTML = isCorrect
            ? '<i class="fas fa-check-circle text-success"></i>'
            : '<i class="fas fa-times-circle text-danger"></i>';

        // Update explanation
        this.resultExplanation.textContent = explanation || '';

        // Update continue button text based on remaining questions
        if (this.questionNumber < 5) {
            this.continueButton.textContent = 'Prossima Domanda';
        } else {
            this.continueButton.textContent = 'Termina Allenamento';
        }
    }

    startTimer() {
        this.timeLeft = 30;
        this.timerValue.textContent = this.timeLeft;

        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerValue.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.showResult(false, 'Tempo scaduto!');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    // Funzione per ottenere gli indici usati per una categoria
    getUsedIndices(category) {
        const storedIndices = localStorage.getItem(`usedIndices_${category}`);
        return storedIndices ? JSON.parse(storedIndices) : [];
    }

    // Funzione per salvare un nuovo indice usato
    saveUsedIndex(category, index) {
        const usedIndices = this.getUsedIndices(category);
        if (!usedIndices.includes(index)) {
            usedIndices.push(index);
            localStorage.setItem(`usedIndices_${category}`, JSON.stringify(usedIndices));
        }
    }

    async loadNextQuestion() {
        if (this.questionNumber >= 5) {
            // End training
            window.location.href = 'index.html';
            return;
        }

        try {
            // Ottieni gli indici già usati
            const usedIndices = this.getUsedIndices(this.category);

            // Fetch next question using fetch
            const response = await fetch(`/api/questions/${this.category}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usedIndices: usedIndices
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Errore nel recupero della domanda: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            if (!data || !data.question) {
                alert('Nessuna altra domanda disponibile per questa categoria.');
                window.location.href = 'index.html';
                return;
            }

            // Aggiorna la domanda corrente
            this.currentQuestion = data.question;
            this.saveUsedIndex(this.category, data.index);
            this.questionNumber++; // Incrementa il numero della domanda prima di mostrarla

            // Hide result section and show question section
            this.resultSection.classList.add('d-none');
            document.getElementById('questionSection').classList.remove('d-none');

            // Show next question
            this.showQuestion();
        } catch (error) {
            console.error('Error loading next question:', error);
            alert('Errore nel caricamento della prossima domanda. Riprova più tardi.');
            window.location.href = 'index.html';
        }
    }

    showFinalScore() {
        this.resultSection.classList.add('d-none');
        this.finalScoreSection.classList.remove('d-none');
        this.finalScoreValue.textContent = this.score;

        // Set message based on score
        if (this.score === 5) {
            this.finalScoreMessage.textContent = 'Perfetto! Hai risposto correttamente a tutte le domande!';
        } else if (this.score >= 3) {
            this.finalScoreMessage.textContent = 'Ottimo lavoro! Continua ad allenarti per migliorare!';
        } else {
            this.finalScoreMessage.textContent = 'Non preoccuparti, continua ad allenarti e migliorerai!';
        }
    }

    restartTraining() {
        this.currentQuestionIndex = 0;
        this.questionNumber = 1;
        this.score = 0;
        this.scoreDisplay.textContent = '0';
        this.finalScoreSection.classList.add('d-none');
        this.resultSection.classList.add('d-none');
        document.getElementById('questionSection').classList.remove('d-none');
        this.showQuestion();
    }
}

// Initialize training when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const training = new TrainingManager();

    // Add event listener for continue button
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            training.loadNextQuestion();
        });
    }
}); 