const mongoose = require('mongoose'); // Importa la libreria mongoose per interagire con MongoDB

// Definisce lo schema per il modello Message
const messageSchema = new mongoose.Schema({
    sender: { // Campo per il mittente del messaggio
        type: String, // Tipo di dato: Stringa
        required: true // Campo obbligatorio
    },
    content: { // Campo per il contenuto del messaggio
        type: String, // Tipo di dato: Stringa
        required: true // Campo obbligatorio
    },
    roomId: { // Campo per l'ID della stanza in cui è stato inviato il messaggio
        type: String, // Tipo di dato: Stringa
        required: true // Campo obbligatorio
    },
    timestamp: { // Campo per la data e ora di invio del messaggio
        type: Date, // Tipo di dato: Data
        default: Date.now // Valore predefinito: data e ora correnti
    }
});

// Esporta il modello Message basato sullo schema definito
module.exports = mongoose.model('Message', messageSchema); 