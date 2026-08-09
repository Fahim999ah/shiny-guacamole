const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let period = 1;
let timeLeft = 30;

app.get("/", (req, res) => {
  res.send("WinGo Game Server is Running Live 24/7!");
});

setInterval(() => {
  timeLeft--;
  if (timeLeft < 0) {
    timeLeft = 30;
    period++;
    
    const number = Math.floor(Math.random() * 10);
    let color = "Green";
    if ([1, 3, 7, 9].includes(number)) color = "Green";
    else if ([2, 4, 6, 8].includes(number)) color = "Red";
    else if ([0, 5].includes(number)) color = "Violet";

    io.emit("gameResult", { period, number, color });
  }

  io.emit("timerUpdate", { period, timeLeft });
}, 1000);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.emit("timerUpdate", { period, timeLeft });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
