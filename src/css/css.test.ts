import {describe,it,expect} from 'vitest';
import {generate} from './css';
import {independentBytes} from './byteStep';
import {recover} from '../attack/divide';
import {verify} from '../verify/verify';
import {extrapolate} from '../attack/rate';
import {step} from './lfsr';

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
  it('measures the 17-bit period and proves the 25-bit polynomial has maximal order',()=>{
    const small={state:0x10000,size:17 as const,taps:[14,0]};
    let period=0;do{step(small);period++}while(small.state!==0x10000&&period<=131071);
    expect(period).toBe(131071);
    // An independent GF(2)[x] route for x^25 + x^12 + x^4 + x^3 + 1.
    const poly=(1<<25)|(1<<12)|(1<<4)|(1<<3)|1;
    const mul=(left:number,right:number)=>{
      let product=0;
      for(let j=0;j<25;j++){
        if(right&1)product^=left;
        right>>>=1;left<<=1;if(left&(1<<25))left^=poly;
      }
      return product;
    };
    const power=(exponent:number)=>{let result=1,x=2;for(;exponent>0;exponent>>>=1,x=mul(x,x))if(exponent&1)result=mul(result,x);return result};
    const order=2**25-1;
    expect(power(order)).toBe(1);
    for(const prime of [31,601,1801])expect(power(order/prime)).not.toBe(1);
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
  it('verifies every public and private continuation byte before a key claim',()=>{
    const key={s1:0,s2:0},bytes=generate(key,38).map(f=>f.z);
    expect(verify(key,bytes.slice(0,6),bytes.slice(6))).toBe(true);
    const publicTamper=bytes.slice(0,6);publicTamper[5]^=1;
    expect(verify(key,publicTamper,bytes.slice(6))).toBe(false);
    const privateTamper=bytes.slice(6);privateTamper[31]^=1;
    expect(verify(key,bytes.slice(0,6),privateTamper)).toBe(false);
  });
});
