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
