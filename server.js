const http = require('http');

const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WinGo Game Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 20px; text-align: center; }
        .card { background: #1e293b; max-width: 400px; margin: 20px auto; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .balance-box { background: #334155; padding: 15px; border-radius: 8px; font-size: 18px; margin-bottom: 20px; }
        .timer { font-size: 24px; font-weight: bold; color: #f59e0b; margin: 15px 0; }
        .btn-group { display: flex; justify-content: space-between; gap: 10px; margin-top: 15px; }
        .btn { flex: 1; padding: 12px; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; color: #fff; }
        .btn-green { background: #22c55e; }
        .btn-violet { background: #a855f7; }
        .btn-red { background: #ef4444; }
        .btn:hover { opacity: 0.9; }
        .status { margin-top: 15px; font-size: 14px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🎮 WinGo 1-Min Game</h2>
        <div class="balance-box">
            কয়েন ব্যালেন্স: ৳ <span id="balance">1000</span>
        </div>
        <div class="timer">
            সময় বাকি: <span id="time">00:60</span>
        </div>
        <p>যেকোনো একটি কালার সিলেক্ট করুন:</p>
        <div class="btn-group">
            <button class="btn btn-green" onclick="placeBet('Green')">Green</button>
            <button class="btn btn-violet" onclick="placeBet('Violet')">Violet</button>
            <button class="btn btn-red" onclick="placeBet('Red')">Red</button>
        </div>
        <div class="status" id="statusMessage">সার্ভার সক্রিয় আছে!</div>
    </div>
    <script>
        let timeLeft = 60;
        setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) timeLeft = 60;
            document.getElementById('time').innerText = \`00:\${timeLeft < 10 ? '0' : ''}\${timeLeft}\`;
        }, 1000);

        function placeBet(color) {
            document.getElementById('statusMessage').innerText = \`\${color} কালারে ৳10 বাজি ধরা হয়েছে!\`;
        }
    </script>
</body>
</html>
`;

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
