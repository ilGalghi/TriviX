// Importa i moduli
import * as GameCore from './game-core.js';
import * as GameUI from './game-ui.js';

// Dichiarazione globale del gameState
let gameState = {
  pollingInterval: null,
  lastOpponentScore: 0, // Aggiungo tracciamento del punteggio dell'avversario
  currentUser: null
};


// Funzioni importate a livello globale
//game-core
window.gameState = gameState;
window.getUsedIndices = GameCore.getUsedIndices;
window.saveUsedIndex = GameCore.saveUsedIndex;
window.initGame = GameCore.initGame;
window.updatePlayerInfo = GameCore.updatePlayerInfo;
window.setupFocusDetection = GameCore.setupFocusDetection;
window.startPollingForOpponentMove = GameCore.startPollingForOpponentMove;
window.checkForOpponentMove = GameCore.checkForOpponentMove;
window.updateGameStateFromMatch = GameCore.updateGameStateFromMatch;
window.showGameResultModal = GameCore.showGameResultModal;
window.createRematch = GameCore.createRematch;
window.checkRematchStatus = GameCore.checkRematchStatus;
window.cleanupGameData = GameCore.cleanupGameData;

//game-ui
window.spinWheel = GameUI.spinWheel;
window.showQuestion = GameUI.showQuestion;
window.startTimer = GameUI.startTimer;
window.stopTimer = GameUI.stopTimer;
window.checkAnswer = GameUI.checkAnswer;
window.showPointAnimation = GameUI.showPointAnimation;
window.showResult = GameUI.showResult;
window.checkForSavedQuestion = GameUI.checkForSavedQuestion;
window.saveCurrentQuestion = GameUI.saveCurrentQuestion;
window.saveQuestionResult = GameUI.saveQuestionResult;
window.updateUserCategoryPerformance = GameUI.updateUserCategoryPerformance;
window.setupGameListeners = GameUI.setupGameListeners;
window.surrenderGame = GameUI.surrenderGame;
window.saveScoreToDatabase = GameUI.saveScoreToDatabase;
window.switchTurn = GameUI.switchTurn;



// Game functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = localStorage.getItem("currentUser")
  if (!currentUser) {
    console.error("User not authenticated, redirecting to home page")
    window.location.href = "index.html"
    return
  }
  
  console.log("User authenticated, initializing game")
  
  // Salvo l'utente corrente nel gameState
  gameState.currentUser = JSON.parse(currentUser);

  // Initialize game
  initGame()

  // Set up event listeners
  setupGameListeners()
  
  // Setup focus/blur detection
  setupFocusDetection()
})