const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB Connected Successfully'))
        .catch(err => console.error('MongoDB Connection Error:', err));
}

// Serve Frontend index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API for Placing Bet
app.post('/api/bet', (req, res) => {
    const { color, amount } = req.body;
    console.log(`Bet placed: ${color} with amount ৳${amount}`);
    res.json({ success: true, message: `Successfully placed bet on ${color}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
