const STORAGE_KEY = 'gameResult';

export function isSameDay(storedToday, today) {
  return storedToday?.month === today.month &&
    storedToday?.date === today.date &&
    storedToday?.year === today.year;
}

export function hasCompletedGame(today) {
  const guesses = JSON.parse(localStorage.getItem('guesses')) || [];
  const forfeit = JSON.parse(localStorage.getItem('forfeit'));
  const todayGuesses = guesses.filter(
    guess => guess.today && isSameDay(guess.today, today)
  );
  const forfeitedToday = forfeit?.today && isSameDay(forfeit.today, today);

  const result = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (result?.today && isSameDay(result.today, today)) {
    return todayGuesses.length > 0 || forfeitedToday;
  }

  if (todayGuesses.length === 0) {
    return false;
  }

  // Spending every guess no longer counts as finishing on its own. The board
  // stays put so it can be stamped, and only saves a result once the player
  // acknowledges it. Otherwise this would also need to know each mode's
  // guess budget to decide when a game was over.
  return Boolean(forfeitedToday);
}

export function getGameResult() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

export function getGuessesRemainingClass(guessesRemaining) {
  if (guessesRemaining <= 3) {
    return 'red-font';
  }
  if (guessesRemaining <= 6) {
    return 'yellow-font';
  }
  return 'green-font';
}

export function saveGameResult(today, gameStatus, placement = null) {
  const existing = getGameResult();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    gameStatus,
    today,
    placement: placement ?? existing?.placement ?? null
  }));
}
