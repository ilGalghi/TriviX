const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Recupera i messaggi di una stanza
router.get('/:roomId', async (req, res) => {
    try {
        // Recupera i messaggi della stanza specificata dall'ID con Mongoose
        const messages = await Message.find({ roomId: req.params.roomId })
            .sort({ timestamp: 1 }) // Ordina i messaggi per data di creazione
            .limit(50); // Limita la ricerca ai 50 ultimi messaggi
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Invia un nuovo messaggio
router.post('/', async (req, res) => {
    const message = new Message({
        sender: req.body.sender,
        content: req.body.content,
        roomId: req.body.roomId
    });

    try {
        const newMessage = await message.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 