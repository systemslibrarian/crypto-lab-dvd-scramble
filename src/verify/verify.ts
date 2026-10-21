import { generate, type Key } from '../css/css';
/** This verifier receives the private challenge key only after the search returned its guess. */
export function verify(candidate:Key, known:readonly number[], continuation:readonly number[], msbFirst=false):boolean {
  const bytes=generate(candidate,known.length+continuation.length,msbFirst).map(f=>f.z);
  return [...known,...continuation].every((v,i)=>bytes[i]===v);
}

