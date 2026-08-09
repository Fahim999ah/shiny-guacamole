// wingo-game / server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

// Basic Route for Server Check
app.get('/', (req, res) => {
    res.send('WinGo Game Server is Running Live 24/7!');
});

// WinGo 1-Min Game Timer Logic
let timer = 60;
let currentRound = Date.now();

setInterval(() => {
    timer--;
    
    // Broadcast live timer to all connected users
    io.emit('timer_update', { timer, round: currentRound });

    if (timer <= 0) {
        // Generate Result (0-9 Number, Color & Big/Small)
        const winningNumber = Math.floor(Math.random() * 10);
        const bigOrSmall = winningNumber >= 5 ? 'Big' : 'Small';
        let color = 'Red';
        if (winningNumber === 0 || winningNumber === 5) color = 'Violet';
        else if ([1, 3, 7, 9].includes(winningNumber)) color = 'Green';

        const result = {
            round: currentRound,
            number: winningNumber,
            bigOrSmall: bigOrSmall,
            color: color,
            timestamp: new Date()
        };

        // Broadcast game result
        io.emit('game_result', result);

        // Reset Timer for Next Round
        timer = 60;
        currentRound = Date.now();
    }
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
      
