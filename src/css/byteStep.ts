/** Independent state-transition implementation for the book variant; no import from lfsr.ts. */
export function independentBytes(s1: number, s2: number, count: number, msbFirst = false): number[] {
  let a = 0x10000 | s1, b = 0x1000000 | s2, carry = 0;
  const out: number[] = [];
  for (let n = 0; n < count; n++) {
    let x=0, y=0;
    for (let j=0; j<8; j++) {
      x |= (a & 1) << (msbFirst ? 7-j : j);
      y |= (b & 1) << (msbFirst ? 7-j : j);
      const fa = ((a >>> 14) ^ a) & 1;
      const fb = ((b >>> 12) ^ (b >>> 4) ^ (b >>> 3) ^ b) & 1;
      a = (a >>> 1) | (fa << 16);
      b = (b >>> 1) | (fb << 24);
    }
    const z=x+y+carry;
    out.push(z & 255);
    carry=z >>> 8;
  }
  return out;
}

