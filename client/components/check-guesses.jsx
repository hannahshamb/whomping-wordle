export default function CheckGuesses(today) {
  const guesses = JSON.parse(localStorage.getItem('guesses'));
  const updatedGuesses = [];
  if (guesses) {
    guesses.forEach(guess => {
      if (guess.today && guess.today.month === today.month &&
        guess.today.date === today.date &&
        guess.today.year === today.year) {
        updatedGuesses.push(guess);
      }
    });
  }
  localStorage.setItem('guesses', JSON.stringify(updatedGuesses));
}
