export default function getDate() {
  const date = new Date();
  const options = { timeZone: 'America/Los_Angeles' };
  const pstDate = date.toLocaleString('en-US', options);
  const dateArray = pstDate.split(/[/,]/);
  const today = {
    month: dateArray[0],
    date: dateArray[1],
    year: dateArray[2]
  };
  return (today);
}

export function advanceDay(today) {
  const nextDate = new Date(`${today.month}/${today.date}/${today.year}`);
  nextDate.setDate(nextDate.getDate() + 1);
  return {
    month: String(nextDate.getMonth() + 1),
    date: String(nextDate.getDate()),
    year: String(nextDate.getFullYear())
  };
}
