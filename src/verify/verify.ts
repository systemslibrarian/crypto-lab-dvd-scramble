import { generate, type Key } from '../css/css';
/** This verifier receives public bytes and a private continuation only after a unique public candidate exists. */
export function verify(candidate:Key, known:readonly number[], continuation:readonly number[], msbFirst=false):boolean {
  const bytes=generate(candidate,known.length+continuation.length,msbFirst).map(f=>f.z);
  return [...known,...continuation].every((v,i)=>bytes[i]===v);
}


/** Private verification must not be an oracle for selecting among public candidates. */
export function assess(candidates:Key[],known:readonly number[],continuation:readonly number[]|null,msbFirst=false):{kind:'none'|'ambiguous'|'mismatch'|'candidate'}|{kind:'recovered';key:Key}{
 if(candidates.length===0)return {kind:'none'};
 if(candidates.length!==1)return {kind:'ambiguous'};
 if(!continuation)return {kind:'candidate'};
 return verify(candidates[0],known,continuation,msbFirst)?{kind:'recovered',key:candidates[0]}:{kind:'mismatch'};
}
