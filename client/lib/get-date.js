export default function getDate() {
  const date = new Date();
  const today = {
    month: (date.getMonth() + 1),
    date: date.getDate(),
    year: date.getFullYear()
  };
  return (today);
}
