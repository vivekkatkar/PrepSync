export function formatTitle(key) {
  return key
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}