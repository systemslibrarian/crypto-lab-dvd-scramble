/** Independent bit-serial implementation, kept out of src and the attack module. */
export function stream(s1:number,s2:number,n:number):number[]{
 let a=0x10000|s1,b=0x1000000|s2,carry=0;const result:number[]=[];
 for(let i=0;i<n;i++){
  let x=0,y=0;
  for(let bit=0;bit<8;bit++){
   x|=(a&1)<<bit;y|=(b&1)<<bit;
   const fa=((a>>14)^a)&1,fb=((b>>12)^(b>>4)^(b>>3)^b)&1;
   a=(a>>>1)|(fa<<16);b=(b>>>1)|(fb<<24);
  }
  const total=x+y+carry;result.push(total&255);carry=total>>>8;
 }
 return result;
}

export function survivors(known:number[]){let count=0;const z=known[0]+256*known[1]+65536*known[2];for(let s1=0;s1<65536;s1++){let a=0x10000|s1,x=0;for(let bit=0;bit<24;bit++){x+=(a&1)*2**bit;a=(a>>>1)|((((a>>>14)^a)&1)<<16)}const s2=(z-x)&0xffffff;if(stream(s1,s2,known.length).every((v,i)=>v===known[i]))count++}return count}
