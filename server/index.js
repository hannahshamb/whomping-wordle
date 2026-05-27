require('dotenv/config');
const express = require('express');
const pg = require('pg');
const ClientError = require('./client-error');
const staticMiddleware = require('./static-middleware');
const errorMiddleware = require('./error-middleware');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT;
const dbConfig = { connectionString: process.env.DATABASE_URL };
if (
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('sslmode=disable')
) {
  dbConfig.ssl = { rejectUnauthorized: false };
}
const db = new pg.Pool(dbConfig);

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

const jsonMiddleware = express.json();
app.use(jsonMiddleware);

app.post('/api/users', (req, res, next) => {
  const { userToken } = req.body;
  if (!userToken) {
    throw new ClientError(400, 'userToken is a required field');
  }

  const sql = `
  insert into "users" ("userToken")
    values ($1)
    ON CONFLICT ON CONSTRAINT "users_userToken_key"
      DO UPDATE
        SET "userToken" = $1
    returning *
  `;
  const params = [userToken];

  db.query(sql, params)
    .then(result => {
      const [user] = result.rows;
      res.status(201).json(user);
    })
    .catch(err => next(err));

});

app.post('/api/user-submissions', (req, res, next) => {
  const { user, date, gameStatus } = req.body;
  const { userId, userToken } = user;
  if (!user || !date || !gameStatus) {
    throw new ClientError(400, 'user, date, and gameStatus are a required fields');
  }

  const sql = `
  WITH upsert AS (
insert into "userSubmissions" ("userId", "userToken", "date", "gameStatus")
    values ($1, $2, $3, $4)
    ON CONFLICT ON CONSTRAINT "userSubmissions_pk"
      DO UPDATE
        SET
        "userId" = $1,
        "userToken" = $2,
        "date" = $3,
        "gameStatus" = $4
    returning *
  )
select "userId", "timeStamp" from "userSubmissions" where "date" = $3;
  `;
  const params = [userId, userToken, date, gameStatus];

  db.query(sql, params)
    .then(result => {
      const rankSql = `
        WITH players AS (
          SELECT "userToken", MIN("timeStamp") AS "timeStamp"
          FROM "userSubmissions"
          WHERE "date" = $1
          GROUP BY "userToken"
        ),
        ranked AS (
          SELECT
            "userToken",
            ROW_NUMBER() OVER (ORDER BY "timeStamp" ASC) AS placement
          FROM players
        )
        SELECT
          (SELECT placement FROM ranked WHERE "userToken" = $2) AS placement,
          (SELECT COUNT(*) FROM players) AS "totalSubmissions";
      `;

      return db.query(rankSql, [date, userToken]);
    })
    .then(result => {
      const { placement, totalSubmissions } = result.rows[0];
      res.status(201).json({
        placement: Number(placement) > 0 ? Number(placement) : 1,
        totalSubmissions: Number(totalSubmissions)
      });
    })
    .catch(err => next(err));
});

app.delete('/api/user-submissions', (req, res, next) => {
  const { date } = req.body;
  if (!date) {
    throw new ClientError(400, 'date is a required field');
  }

  db.query('delete from "userSubmissions" where "date" = $1', [date])
    .then(() => {
      res.status(204).end();
    })
    .catch(err => next(err));
});

if (process.env.NODE_ENV === 'development') {
  app.post('/api/dev/midnight', (req, res) => {
    const options = { timeZone: 'America/Los_Angeles' };
    const currentDatePST = new Date().toLocaleString('en-US', options);
    io.emit('countdownUpdate', {
      countdownValue: '00:00:00',
      currentDate: currentDatePST
    });
    io.emit('countdownEnd');
    res.status(204).end();
  });
}

app.use(errorMiddleware);
