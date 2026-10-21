import { generate, type Key } from '../css/css';

const reverse = (b: number) => parseInt(b.toString(2).padStart(8,'0').split('').reverse().join(''),2);
export type Search = {tested:number; candidates:Key[]};
/** Guess s1; subtract its first three bytes as a 24-bit integer to determine s2. */
export function recover(known: readonly number[], msbFirst = false, onProgress?: (tested:number)=>void, cancelled?:()=>boolean): Search {
  if (known.length < 3 || known.length > 64 || known.some(x=>!Number.isInteger(x)||x<0||x>255)) throw new RangeError('Supply 3 to 64 known output bytes');
  const z = known[0] | (known[1] << 8) | (known[2] << 16);
  const candidates: Key[]=[];
  for (let s1=0;s1<65536;s1++) {
    if ((s1 & 255) === 0) { if (cancelled?.()) return {tested:s1,candidates:[]}; onProgress?.(s1); }
    // y0..2 are exactly the loaded 24 seed bits; after the alternate bit order, reverse each byte.
    const first = generate({s1,s2:0},3,msbFirst);
    const x=first[0].x | (first[1].x<<8) | (first[2].x<<16);
    const y=(z-x)&0xffffff;
    const s2=msbFirst ? reverse(y&255)|(reverse((y>>>8)&255)<<8)|(reverse((y>>>16)&255)<<16) : y;
    const key={s1,s2};
    if (generate(key,known.length,msbFirst).every((frame,i)=>frame.z===known[i])) candidates.push(key);
  }
  onProgress?.(65536);
  return {tested:65536,candidates};
}
// [extension] point: Stevenson's five-byte variant has a different verification strategy.

