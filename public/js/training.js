import * as GameCore from './game-core.js'; // Importa il modulo GameCore per la logica di gioco
import * as GameUI from './game-ui.js'; // Importa il modulo GameUI per la gestione dell'interfaccia utente

// Classe principale per gestire l'allenamento
class TrainingManager {
    constructor() {
        // Elementi del DOM
        this.categoryTitle = document.getElementById('categoryTitle'); // Titolo della categoria
        this.questionText = document.getElementById('questionText'); // Testo della domanda
        this.answersContainer = document.getElementById('answersContainer'); // Contenitore delle risposte
        this.questionCounter = document.getElementById('questionCounter'); // Contatore delle domande
        this.scoreDisplay = document.getElementById('currentScore'); // Visualizzazione del punteggio attuale
        this.resultSection = document.getElementById('resultSection'); // Sezione dei risultati
        this.resultText = document.getElementById('resultText'); // Testo del risultato
        this.resultExplanation = document.getElementById('resultExplanation'); // Spiegazione del risultato
        this.continueButton = document.getElementById('continueButton'); // Pulsante per continuare
        this.finalScoreSection = document.getElementById('finalScoreSection'); // Sezione del punteggio finale
        this.finalScoreValue = document.getElementById('finalScoreValue'); // Valore del punteggio finale
        this.finalScoreMessage = document.getElementById('finalScoreMessage'); // Messaggio del punteggio finale
        this.retryButton = document.getElementById('retryButton'); // Pulsante per riprovare
        this.timerValue = document.getElementById('timerValue'); // Valore del timer

        // Ottieni la categoria dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        this.category = urlParams.get('category'); // Categoria selezionata

        // Stato dell'allenamento
        this.currentQuestionIndex = 0; // Indice per accedere alle domande
        this.questionNumber = 1; // Numero della domanda corrente (1-5)
        this.score = 0; // Punteggio attuale
        this.questions = []; // Array per le domande
        this.timer = null; // Timer per il countdown
        this.timeLeft = 30; // Tempo rimanente per ogni domanda

        // Aggiungi listener per il pulsante di ripetizione
        this.retryButton.addEventListener('click', () => this.restartTraining());

        // Inizializza l'allenamento
        this.initializeTraining();
    }

    // Funzione per inizializzare l'allenamento
    async initializeTraining() {
        try {
            // Imposta il titolo della categoria
            this.categoryTitle.textContent = this.getCategoryTitle(this.category);

            // Ottieni gli indici già usati
            const usedIndices = this.getUsedIndices(this.category);
            console.log('Indici usati:', usedIndices);

            // Recupera le domande usando fetch
            const response = await fetch(`/api/questions/${this.category}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usedIndices: usedIndices // Invia gli indici usati al server
                })
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            // Controlla se la risposta è valida
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Errore nel recupero della domanda: ${response.status} ${errorText}`);
            }

            const data = await response.json(); // Analizza i dati JSON ricevuti
            console.log('Received data:', data);
            
            // Controlla se ci sono domande disponibili
            if (!data || !data.question) {
                console.error('Dati mancanti o invalidi:', data);
                alert('Nessuna domanda disponibile per questa categoria.');
                window.location.href = 'index.html'; // Reindirizza alla home se non ci sono domande
                return;
            }

            // Salva la domanda corrente
            this.currentQuestion = data.question;
            this.saveUsedIndex(this.category, data.index); // Salva l'indice della domanda usata

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
            window.location.href = 'index.html'; // Reindirizza alla home in caso di errore
        }
    }

    // Funzione per ottenere il titolo della categoria
    getCategoryTitle(category) {
        // Mappa delle categorie e dei loro titoli
        const titles = {
            science: 'Scienza',
            entertainment: 'Intrattenimento',
            sports: 'Sport',
            art: 'Arte',
            geography: 'Geografia',
            history: 'Storia'
        };
        return titles[category] || category; // Restituisce il titolo corrispondente o la categoria stessa
    }

    // Funzione per mostrare la domanda corrente
    showQuestion() {
        const question = this.currentQuestion; // Recupera la domanda corrente
        this.questionText.textContent = question.text; // Mostra il testo della domanda
        this.questionCounter.textContent = `Domanda ${this.questionNumber}/5`; // Aggiorna il contatore delle domande

        // Gestisci l'immagine della domanda
        const questionCard = document.querySelector('.question-card');
        // Rimuovi eventuali immagini precedenti
        const oldImg = questionCard.querySelector('.question-image');
        if (oldImg) {
            oldImg.remove(); // Rimuove l'immagine precedente
        }
        
        // Se la domanda ha un'immagine, visualizzala
        if (question.hasImage && question.imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = question.imageUrl; // Imposta l'URL dell'immagine
            imgElement.alt = 'Immagine della domanda';
            imgElement.className = 'question-image';
            // Inserisci l'immagine dopo il testo della domanda
            this.questionText.parentNode.insertBefore(imgElement, this.questionText.nextSibling);
        }

        // Pulisci le risposte precedenti
        this.answersContainer.innerHTML = '';

        // Aggiungi le nuove risposte
        question.answers.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-option'; // Classe per le opzioni di risposta
            answerElement.textContent = answer; // Imposta il testo della risposta
            answerElement.dataset.index = index; // Aggiungi l'indice come attributo
            answerElement.addEventListener('click', () => this.handleAnswer(index, question.correctIndex, question.explanation)); // Aggiungi listener per la risposta
            this.answersContainer.appendChild(answerElement); // Aggiungi l'elemento delle risposte al contenitore
        });

        // Avvia il timer
        this.startTimer();
    }

    // Funzione per gestire la risposta selezionata dall'utente
    handleAnswer(selectedIndex, correctIndex, explanation) {
        // Ferma il timer
        this.stopTimer();

        // Controlla se la risposta è corretta
        const isCorrect = selectedIndex === correctIndex;

        // Aggiorna il punteggio
        if (isCorrect) {
            this.score++; // Incrementa il punteggio se la risposta è corretta
            this.scoreDisplay.textContent = `Punteggio: ${this.score}`; // Mostra il punteggio attuale
        }

        // Aggiorna le prestazioni dell'utente per categoria
        this.updateUserCategoryPerformance(this.category, isCorrect);

        // Mostra il risultato
        this.showResult(isCorrect, explanation);
    }

    // Funzione per aggiornare le prestazioni dell'utente per categoria
    updateUserCategoryPerformance(category, isCorrect) {
        // Ottieni l'utente corrente
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        
        if (!currentUser) {
            console.error("Utente non autenticato"); // Log se l'utente non è autenticato
            return; // Esci se l'utente non è autenticato
        }
        
        // Prepara i dati da inviare al server
        const performanceData = {
            userId: currentUser.id, // ID dell'utente
            category: category, // Categoria della domanda
            isCorrect: isCorrect // Risultato della risposta
        };
        
        // Invia la richiesta al server
        fetch('/api/users/update-category-performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(performanceData), // Invia i dati come JSON
            credentials: 'include' // Includi i cookie per l'autenticazione
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nell\'aggiornamento delle prestazioni'); // Log degli errori
            }
            return response.json(); // Restituisce la risposta come JSON
        })
        .then(data => {
            console.log('Prestazioni per categoria aggiornate:', data); // Log delle prestazioni aggiornate
        })
        .catch(error => {
            console.error('Errore nell\'aggiornamento delle prestazioni per categoria:', error); // Log degli errori
        });
    }

    // Funzione per mostrare il risultato della risposta
    showResult(isCorrect, explanation) {
        // Nascondi la sezione della domanda e mostra la sezione dei risultati
        document.getElementById('questionSection').classList.add('d-none');
        this.resultSection.classList.remove('d-none');

        // Aggiorna il testo e l'icona del risultato
        this.resultText.textContent = isCorrect ? 'Corretto!' : 'Sbagliato!'; // Mostra se la risposta è corretta o sbagliata
        const resultIcon = document.getElementById('resultIcon');
        resultIcon.innerHTML = isCorrect
            ? '<i class="fas fa-check-circle text-success"></i>' // Icona per risposta corretta
            : '<i class="fas fa-times-circle text-danger"></i>'; // Icona per risposta sbagliata

        // Aggiorna la spiegazione
        this.resultExplanation.textContent = explanation || ''; // Mostra la spiegazione della risposta

        // Aggiorna il testo del pulsante di continuazione in base alle domande rimanenti
        if (this.questionNumber < 5) {
            this.continueButton.textContent = 'Domanda successiva'; // Testo per il pulsante se ci sono domande rimanenti
        } else {
            this.continueButton.textContent = 'Fine allenamento'; // Testo per il pulsante se è l'ultima domanda
        }
    }

    // Funzione per avviare il timer
    startTimer() {
        this.timeLeft = 30; // Imposta il tempo rimanente a 30 secondi
        this.timerValue.textContent = this.timeLeft; // Mostra il tempo rimanente

        if (this.timer) {
            clearInterval(this.timer); // Ferma il timer precedente se esiste
        }

        this.timer = setInterval(() => {
            this.timeLeft--; // Decrementa il tempo rimanente
            this.timerValue.textContent = this.timeLeft; // Aggiorna il display del timer

            if (this.timeLeft <= 0) {
                clearInterval(this.timer); // Ferma il timer
                this.showResult(false, 'Tempo scaduto!'); // Mostra il risultato se il tempo scade
            }
        }, 1000); // Esegui ogni secondo
    }

    // Funzione per fermare il timer
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer); // Ferma il timer se esiste
        }
    }

    // Funzione per ottenere gli indici usati per una categoria
    getUsedIndices(category) {
        const storedIndices = localStorage.getItem(`usedIndices_${category}`);
        return storedIndices ? JSON.parse(storedIndices) : []; // Restituisce gli indici usati o un array vuoto
    }

    // Funzione per salvare un nuovo indice usato
    saveUsedIndex(category, index) {
        const usedIndices = this.getUsedIndices(category); // Ottiene gli indici usati
        if (!usedIndices.includes(index)) {
            usedIndices.push(index); // Aggiunge l'indice se non è già presente
            localStorage.setItem(`usedIndices_${category}`, JSON.stringify(usedIndices)); // Salva gli indici aggiornati
        }
    }

    // Funzione per caricare la prossima domanda
    async loadNextQuestion() {
        if (this.questionNumber >= 5) {
            // Mostra il punteggio finale invece di reindirizzare alla home
            this.showFinalScore();
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
                    usedIndices: usedIndices // Invia gli indici usati al server
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Errore nel recupero della domanda: ${response.status} ${errorText}`);
            }

            const data = await response.json(); // Analizza i dati JSON ricevuti

            if (!data || !data.question) {
                alert('Nessuna domanda disponibile per questa categoria.');
                window.location.href = 'index.html'; // Reindirizza alla home se non ci sono domande
                return;
            }

            // Aggiorna la domanda corrente
            this.currentQuestion = data.question;
            this.saveUsedIndex(this.category, data.index); // Salva l'indice della domanda usata
            this.questionNumber++; // Incrementa il numero della domanda prima di mostrarla

            // Nascondi la sezione dei risultati e mostra la sezione della domanda
            this.resultSection.classList.add('d-none');
            document.getElementById('questionSection').classList.remove('d-none');

            // Mostra la prossima domanda
            this.showQuestion();
        } catch (error) {
            console.error('Error loading next question:', error);
            alert('Errore nel caricamento della prossima domanda. Riprova più tardi.');
            window.location.href = 'index.html'; // Reindirizza alla home in caso di errore
        }
    }

    // Funzione per mostrare il punteggio finale
    showFinalScore() {
        this.resultSection.classList.add('d-none'); // Nascondi la sezione dei risultati
        this.finalScoreSection.classList.remove('d-none'); // Mostra la sezione del punteggio finale
        this.finalScoreValue.textContent = this.score; // Mostra il punteggio finale
        
        // Calcola la percentuale di risposte corrette
        const percentScore = (this.score / 5) * 100;
        
        // Imposta il messaggio in base al punteggio
        let message = '';
        if (this.score === 5) {
            message = 'Perfetto! Hai risposto correttamente a tutte le domande!';
        } else if (this.score >= 3) {
            message = 'Ottimo lavoro! Continua ad allenarti per migliorare!';
        } else {
            message = 'Non preoccuparti, continua ad allenarti e migliorerai!';
        }
        
        // Aggiungi la percentuale su una nuova riga
        this.finalScoreMessage.innerHTML =  percentScore + '% risposte corrette' + '<br>' + '<br>' + message;
    }

    // Funzione per riavviare l'allenamento
    restartTraining() {
        this.currentQuestionIndex = 0; // Ripristina l'indice della domanda
        this.questionNumber = 1; // Ripristina il numero della domanda
        this.score = 0; // Ripristina il punteggio
        this.scoreDisplay.textContent = '0'; // Mostra il punteggio a zero
        this.finalScoreSection.classList.add('d-none'); // Nascondi la sezione del punteggio finale
        this.resultSection.classList.add('d-none'); // Nascondi la sezione dei risultati
        document.getElementById('questionSection').classList.remove('d-none'); // Mostra la sezione della domanda
        this.showQuestion(); // Mostra la prima domanda
    }
}

// Inizializza l'allenamento quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    const training = new TrainingManager(); // Crea un'istanza di TrainingManager

    // Aggiungi listener per il pulsante di continuazione
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            training.loadNextQuestion(); // Carica la prossima domanda
        });
    }
});