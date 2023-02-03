export default function CharacterOfTheDay(characters) {
  const random = () => {
    const date = new Date();
    return (date.getFullYear() * date.getDate() * (date.getMonth() + 1) % characters.length);

  };
  const characterOfTheDay = characters[random()];
  return characterOfTheDay;
}
