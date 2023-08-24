require('dotenv/config');
const express = require('express');
const staticMiddleware = require('./static-middleware');
const errorMiddleware = require('./error-middleware');

const app = express();

app.use(staticMiddleware);

app.get('/api/current-date', (req, res) => {
  const date = new Date();
  const options = { timeZone: 'America/Los_Angeles' };
  const pstDate = date.toLocaleString('en-US', options);
  const dateArray = pstDate.split(/[/,]/);
  const today = {
    month: dateArray[0],
    date: dateArray[1],
    year: dateArray[2]
  };
  res.json({ today });
});

app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  process.stdout.write(`\n\napp listening on port ${process.env.PORT}\n\n`);
});
