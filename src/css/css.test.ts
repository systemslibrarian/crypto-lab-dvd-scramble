import {describe,it,expect} from 'vitest';
import {generate} from './css';
import {independentBytes} from './byteStep';
import {recover} from '../attack/divide';
import {verify} from '../verify/verify';
import {extrapolate} from '../attack/rate';

describe('Boneh–Shoup CSS construction',()=>{
  it('two independently written stepping routes agree on 1000 keys across 256 bytes',()=>{
    let seed=1729;
    for(let i=0;i<1000;i++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const key={s1:seed&0xffff,s2:(seed>>>8)&0xffffff};
      expect(generate(key,256).map(f=>f.z)).toEqual(independentBytes(key.s1,key.s2,256));
    }
    expect(generate({s1:0,s2:0},32).map(f=>f.z)).toEqual(independentBytes(0,0,32));
  });
  it('the first 3 bytes determine the second seed for every guessed first seed',()=>{
    const known=generate({s1:0xabcd,s2:0x928b0e},3).map(f=>f.z);
    expect(recover(known).candidates).toHaveLength(65536);
  });
  it.each([false,true])('recovers and independently checks the full key, alternate bit order %s',(order)=>{
    const key={s1:0xb25c,s2:0x456a89};
    const stream=generate(key,38,order).map(f=>f.z);
    const answer=recover(stream.slice(0,6),order);
    expect(answer.tested).toBe(65536);
    expect(answer.candidates).toContainEqual(key);
    expect(answer.candidates.filter(k=>verify(k,stream.slice(0,6),stream.slice(6),order))).toContainEqual(key);
  });
  it('refuses fewer than three bytes and projects the measured rate to 2^40',()=>{
    expect(()=>recover([1,2])).toThrow();
    expect(extrapolate(65536,1000).bruteSeconds).toBe(2**40/65536);
  });
});
