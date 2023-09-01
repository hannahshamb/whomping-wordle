require('dotenv/config');
const express = require('express');
const staticMiddleware = require('./static-middleware');
const errorMiddleware = require('./error-middleware');
const http = require('http');
const socketIo = require('socket.io');
// const moment = require('moment-timezone');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT;

app.use(staticMiddleware);

server.listen(port, () => {
  process.stdout.write(`\n\napp listening on port ${port}\n\n`);
});

const io = socketIo(server);

io.on('connection', socket => {
  process.stdout.write('\n\nClient connected\n\n');

  function calculateCountdown() {
    const options = { timeZone: 'America/Los_Angeles' };
    const currentDatePST = new Date().toLocaleString('en-US', options);
    const midnightPST = new Date(currentDatePST);
    midnightPST.setHours(24, 0, 0, 0);

    const timeDifference = midnightPST - new Date(currentDatePST);

    const hours = Math.floor(timeDifference / (60 * 60 * 1000));
    const minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeDifference % (60 * 1000)) / 1000);

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    const countdownValue = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    const timeRemaining = timeDifference - (hours * 60 * 60 * 1000) - (minutes * 60 * 1000) - (seconds * 1000);

    io.emit('countdownUpdate', {
      countdownValue,
      currentDate: currentDatePST
    });

    if (countdownValue === '00:00:00') {
      io.emit('countdownEnd');
    }

    setTimeout(() => {
      calculateCountdown();
    }, timeRemaining);
  }

  calculateCountdown();

  socket.on('disconnect', () => {
    process.stdout.write('\n\nClient disconnected\n\n');
  });
});

app.use(errorMiddleware);
