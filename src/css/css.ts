import { byte, type Register } from './lfsr';

export type Key = { s1: number; s2: number };
export type Frame = { x: number; y: number; carryIn: number; z: number; carryOut: number; register1: number; register2: number };
export function validateKey(key: Key): void {
  if (!Number.isInteger(key.s1) || key.s1 < 0 || key.s1 > 0xffff || !Number.isInteger(key.s2) || key.s2 < 0 || key.s2 > 0xffffff) throw new RangeError('The key is 16 + 24 bits');
}
export function generate(key: Key, count: number, msbFirst = false): Frame[] {
  validateKey(key);
  if (!Number.isInteger(count) || count < 0 || count > 4096) throw new RangeError('Byte count must be between 0 and 4096');
  const left: Register = {state: 0x10000 | key.s1, size:17, taps:[14,0]};
  const right: Register = {state:0x1000000 | key.s2, size:25, taps:[12,4,3,0]};
  const frames: Frame[] = [];
  let carry = 0;
  for (let i = 0; i < count; i++) {
    const register1 = left.state, register2 = right.state;
    const x = byte(left, msbFirst), y = byte(right, msbFirst);
    const sum = x + y + carry;
    frames.push({x,y,carryIn:carry,z:sum & 255,carryOut:sum >>> 8,register1,register2});
    carry = sum >>> 8;
  }
  return frames;
}
// [extension] point: deployed CSS changes insertion positions, discards early bytes, and has inverter modes.

