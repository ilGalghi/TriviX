const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Recupera i messaggi di una stanza
router.get('/:roomId', async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId })
            .sort({ timestamp: 1 })
            .limit(50);
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