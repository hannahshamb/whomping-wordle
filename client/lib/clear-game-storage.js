export default function clearGameStorage() {
  localStorage.removeItem('guesses');
  localStorage.removeItem('forfeit');
  localStorage.removeItem('gameResult');
  // Game mode belongs to a single day's game, so a fresh board always starts
  // in Normal mode.
  localStorage.removeItem('easyMode');
}
