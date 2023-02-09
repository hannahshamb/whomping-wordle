export default function CharacterOfTheDay(characters, today) {
  const random = () => {
    return ((today.year * today.date * today.month) % characters.length);
  };
  const characterOfTheDay = characters[random()];
  return characterOfTheDay;
}
