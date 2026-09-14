const STORAGE_KEY = 'gameResult';

export function isSameDay(storedToday, today) {
  return storedToday?.month === today.month &&
    storedToday?.date === today.date &&
    storedToday?.year === today.year;
}

// A game is over once its result has been recorded, which happens when the
// player dismisses the stamped board. Spending every guess or forfeiting only
// stamps the board, so neither counts as finishing on its own.
export function hasCompletedGame(today) {
  const result = JSON.parse(localStorage.getItem(STORAGE_KEY));
  return Boolean(result?.today && isSameDay(result.today, today));
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
