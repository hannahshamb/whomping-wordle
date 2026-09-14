export default function clearGameStorage() {
  localStorage.removeItem('guesses');
  localStorage.removeItem('forfeit');
  localStorage.removeItem('gameResult');
  // Game mode and the intro explainer belong to a single day's game, so a
  // fresh board always starts in Normal mode and re-introduces itself.
  localStorage.removeItem('easyMode');
  localStorage.removeItem('aboutSeen');
}
