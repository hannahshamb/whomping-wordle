export default function formatOrdinal(number) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const remainder = number % 100;
  const suffix = suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];
  return `${number}${suffix}`;
}
