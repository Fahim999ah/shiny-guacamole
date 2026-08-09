const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let period = 10001;
let timeLeft = 30;
let currentBets = []; // চলতি রাউন্ডের বেটসমূহ
let manualResult = null; // অ্যাডমিন ম্যানুয়াল রেজাল্ট (যদি সেট করা হয়)

app.get("/", (req, res) => {
  res.send("WinGo Smart Game & Admin Engine is Live!");
});

// অ্যাডমিন API: চলতি রাউন্ডের মোট বেট এবং স্ট্যাট দেখার জন্য
app.get("/api/admin/bets", (req, res) => {
  const summary = calculateBetTotals();
  res.json({
    period,
    timeLeft,
    totalBetsCount: currentBets.length,
    totals: summary,
    manualResult
  });
});

// অ্যাডমিন API: ম্যানুয়ালি রেজাল্ট ফোর্স সেট করার জন্য (0-9)
app.post("/api/admin/set-result", (req, res) => {
  const { number } = req.body;
  if (number !== undefined && number >= 0 && number <= 9) {
    manualResult = parseInt(number);
    res.json({ success: true, message: `Next result manually set to number ${manualResult}` });
  } else {
    res.status(400).json({ success: false, message: "Invalid number. Must be 0-9." });
  }
});

// ইউজার প্লেস বেট API
app.post("/api/user/place-bet", (req, res) => {
  const { userId, type, choice, amount } = req.body; 
  // type: 'color' | 'number' | 'size'
  // choice: 'Green'/'Red'/'Violet' OR 0-9 OR 'Big'/'Small'
  if (!choice || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid bet details" });
  }
  
  const bet = { userId: userId || "guest", type, choice, amount: parseFloat(amount) };
  currentBets.push(bet);
  
  // অ্যাডমিন ড্যাশবোর্ডে রিয়েলটাইমে বেট আপডেট পাঠানোর জন্য
  io.emit("adminBetUpdate", calculateBetTotals());
  
  res.json({ success: true, message: "Bet placed successfully!", bet });
});

// প্রতিটি অপশনে মোট কত টাকা বেট ধরা হয়েছে তা বের করার ফাংশন
function calculateBetTotals() {
  const totals = {
    sizes: { Big: 0, Small: 0 },
    colors: { Green: 0, Red: 0, Violet: 0 },
    numbers: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
  };

  currentBets.forEach(bet => {
    if (bet.type === 'size' && totals.sizes[bet.choice] !== undefined) {
      totals.sizes[bet.choice] += bet.amount;
    } else if (bet.type === 'color' && totals.colors[bet.choice] !== undefined) {
      totals.colors[bet.choice] += bet.amount;
    } else if (bet.type === 'number' && totals.numbers[bet.choice] !== undefined) {
      totals.numbers[bet.choice] += bet.amount;
    }
  });

  return totals;
}

// সবচেয়ে কম পেআউট / লস কমানোর স্মার্ট রেজাল্ট অ্যালগরিদম
function calculateOptimalResult() {
  if (manualResult !== null) {
    const resNum = manualResult;
    manualResult = null; // একবার ব্যবহার হলে ক্লিয়ার হবে
    return resNum;
  }

  // প্রতিটি সম্ভাব্য নাম্বার (০-৯) এর জন্য হাউজের মোট কত টাকা পেআউট দিতে হবে তা হিসেব
  let minPayout = Infinity;
  let bestNumbers = [];

  for (let num = 0; num <= 9; num++) {
    const size = num >= 5 ? 'Big' : 'Small';
    let color = [];
    if ([1, 3, 7, 9].includes(num)) color.push('Green');
    if ([2, 4, 6, 8].includes(num)) color.push('Red');
    if ([0, 5].includes(num)) {
      color.push('Violet');
      if (num === 0) color.push('Red');
      if (num === 5) color.push('Green');
    }

    let payoutForNum = 0;

    currentBets.forEach(bet => {
      if (bet.type === 'number' && parseInt(bet.choice) === num) {
        payoutForNum += bet.amount * 9; // নাম্বারে ৯ গুণ পেআউট
      } else if (bet.type === 'size' && bet.choice === size) {
        payoutForNum += bet.amount * 2; // বিগ/স্মলে ২ গুণ
      } else if (bet.type === 'color' && color.includes(bet.choice)) {
        payoutForNum += bet.amount * 2; // কালারে ২ গুণ
      }
    });

    if (payoutForNum < minPayout) {
      minPayout = payoutForNum;
      bestNumbers = [num];
    } else if (payoutForNum === minPayout) {
      bestNumbers.push(num);
    }
  }

  // সবচেয়ে কম লস বা সমান লস হওয়া নাম্বারগুলোর মধ্যে থেকে র‍্যান্ডম একটি বেছে নেওয়া
  const chosenNumber = bestNumbers[Math.floor(Math.random() * bestNumbers.length)];
  return chosenNumber;
}

// টাইমার লজিক (৩০ সেকেন্ড কাউন্টডাউন)
setInterval(() => {
  timeLeft--;
  
  if (timeLeft < 0) {
    timeLeft = 30;
    
    // প্রফিট অ্যালগরিদম বা অ্যাডমিন ওভাররাইড দিয়ে উইনিং নাম্বার নির্বাচন
    const winningNumber = calculateOptimalResult();
    
    let color = "Green";
    if ([1, 3, 7, 9].includes(winningNumber)) color = "Green";
    else if ([2, 4, 6, 8].includes(winningNumber)) color = "Red";
    else if ([0, 5].includes(winningNumber)) color = "Violet";

    const size = winningNumber >= 5 ? "Big" : "Small";

    const resultData = {
      period,
      number: winningNumber,
      color,
      size
    };

    io.emit("gameResult", resultData);

    // পরবর্তী রাউন্ডের জন্য রসেট করা
    period++;
    currentBets = [];
  }

  io.emit("timerUpdate", { period, timeLeft });
}, 1000);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("timerUpdate", { period, timeLeft });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Smart Server running on port ${PORT}`);
});
    
