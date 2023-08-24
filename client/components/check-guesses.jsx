export default function CheckGuesses(today) {
  const guesses = JSON.parse(localStorage.getItem('guesses'));
  const updatedGuesses = [];
  let updatedForfeit = null;
  if (guesses) {
    guesses.forEach(guess => {
      if (guess.today && guess.today.month === today.month &&
        guess.today.date === today.date &&
        guess.today.year === today.year) {
        updatedGuesses.push(guess);
      }
    });
  }

  const forfeit = JSON.parse(localStorage.getItem('forfeit'));
  if (forfeit !== null) {
    if (today.month === forfeit.today.month &&
      today.date === forfeit.today.date &&
      today.year === forfeit.today.year) {
      updatedForfeit = forfeit;
    }
  }

  localStorage.setItem('guesses', JSON.stringify(updatedGuesses));
  localStorage.setItem('forfeit', JSON.stringify(updatedForfeit));
}
