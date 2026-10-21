/** Boneh–Shoup §3.8, Figure 3.10: bit 0 is output, taps precede a right shift. */
export type Register = { state: number; size: 17 | 25; taps: readonly number[] };
export function step(r: Register): number {
  const bit = r.state & 1;
  const feedback = r.taps.reduce((v, tap) => v ^ ((r.state >>> tap) & 1), 0);
  r.state = (r.state >>> 1) | (feedback << (r.size - 1));
  return bit;
}
export function byte(r: Register, msbFirst = false): number {
  let value = 0;
  for (let i = 0; i < 8; i++) value |= step(r) << (msbFirst ? 7-i : i);
  return value;
}

