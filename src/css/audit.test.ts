import {it,expect} from 'vitest';
import {randomBytes} from 'node:crypto';
import {generate} from './css';
import {independentBytes} from './byteStep';
import {recover} from '../attack/divide';
import {verify,assess} from '../verify/verify';
const randomKey=()=>{const b=randomBytes(5);return {s1:b.readUInt16LE(),s2:b.readUIntLE(2,3)}};
it('full carry preserves the mod 2^24 identity across 10000 random keys',()=>{
 const keys=[{s1:0x434c,s2:0x9cbcf2},...Array.from({length:10000},randomKey)];
 for(const key of keys){const f=generate(key,3),number=(field:'x'|'y'|'z')=>f[0][field]+256*f[1][field]+65536*f[2][field];expect((number('x')+number('y'))&0xffffff).toBe(number('z'));expect((number('z')-number('x'))&0xffffff).toBe(key.s2)}
});
it('200 random six-byte samples retain the true key and independently regenerate its continuation',()=>{
 let positionTotal=0,ambiguous=0;
 for(let i=0;i<200;i++){
  const key=randomKey(),bytes=independentBytes(key.s1,key.s2,38),answer=recover(bytes.slice(0,6));
  expect(answer.tested).toBe(65536);expect(answer.candidates).toContainEqual(key);
  expect(verify(key,bytes.slice(0,6),bytes.slice(6))).toBe(true);
  // Retrospective position of the known generator key, not work claimed by the attack.
  const position=key.s1+1;positionTotal+=position;
  if(answer.candidates.length!==1){ambiguous++;expect(assess(answer.candidates,bytes.slice(0,6),bytes.slice(6))).toEqual({kind:'ambiguous'})}
 }
 const mean=positionTotal/200;console.info(JSON.stringify({samples:200,actualTrialsPerExhaustiveSearch:65536,meanRetrospectiveTrueKeyPosition:mean,ambiguousSamples:ambiguous}));expect(mean).toBeLessThan(65536);
},120000);
it('private continuation cannot select a key from an ambiguous public candidate set',()=>{
 const key={s1:0xb25c,s2:0x456a89},all=independentBytes(key.s1,key.s2,35),answer=recover(all.slice(0,3));
 expect(answer.candidates).toHaveLength(65536);expect(assess(answer.candidates,all.slice(0,3),all.slice(3))).toEqual({kind:'ambiguous'});
});
it('impossible bytes produce zero survivors and no key',()=>{
 const known=Array(8).fill(0),answer=recover(known);expect(answer.candidates).toHaveLength(0);expect(assess(answer.candidates,known,null)).toEqual({kind:'none'});
});
it('cancelled search reports its actual partial counter and discards candidates',()=>{
 let progress=0;const answer=recover([1,2,3],false,n=>{progress=n},()=>progress>=256);
 expect(answer.tested).toBe(512);expect(answer.candidates).toEqual([]);expect(answer.tested).toBeLessThan(65536);
});
it('adversary worker receives public observations without verification state',async()=>{
 const {readFileSync}=await import('node:fs');const worker=readFileSync(new URL('../attack/search.worker.ts',import.meta.url),'utf8');expect(worker).not.toMatch(/verify|continuation|secret/);
 const divide=readFileSync(new URL('../attack/divide.ts',import.meta.url),'utf8');expect(divide).not.toMatch(/verify|continuation|secret/);
});
