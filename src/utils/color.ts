export function numberToHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function parseHexColor(color: string, alpha = 1): [number, number, number, number] {
  const normalized = color.replace('#', '');
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, Math.max(0, Math.min(1, alpha))];
}
