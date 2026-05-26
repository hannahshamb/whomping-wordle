export default function clearGameStorage() {
  localStorage.removeItem('guesses');
  localStorage.removeItem('forfeit');
  localStorage.removeItem('gameResult');
}
