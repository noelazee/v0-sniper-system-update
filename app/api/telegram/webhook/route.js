const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const SIGNAL_APPROVAL_COMMAND = '/approve';
const TRANSACTION_TRIGGER_COMMAND = '/transaction';

app.post('/webhook', (req, res) => {
    const chatId = req.body.message.chat.id;
    const command = req.body.message.text;
    
    if (command.includes(SIGNAL_APPROVAL_COMMAND)) {
        const response = 'Signal approved';
        sendMessage(chatId, response);
    } else if (command.includes(TRANSACTION_TRIGGER_COMMAND)) {
        const response = 'Transaction triggered';
        sendMessage(chatId, response);
    }
    res.sendStatus(200);
});

function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text
    };
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

app.listen(3000, () => {
    console.log('Webhook is listening on port 3000');
});