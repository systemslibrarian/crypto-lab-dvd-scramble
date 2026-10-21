import {test,expect} from '@playwright/test';

/** Independent bit-serial implementation, kept out of src and the attack module. */
function stream(s1:number,s2:number,n:number):number[]{
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
test('rendered 40-bit recovery regenerates both the known and independent future bytes',async({page})=>{
 await page.goto('./');
 const known=(await page.locator('#observed').innerText()).trim().split(/\s+/).map(h=>parseInt(h,16));
 await page.getByRole('button',{name:'Break this sample'}).click();
 const result=page.locator('#attack-out');await expect(result).toContainText('40-BIT KEY',{timeout:30000});
 const text=await result.innerText();
 const key=text.match(/s₁=0x([0-9A-F]{4}), s₂=0x([0-9A-F]{6})/);
 expect(key,'recovered key printed').not.toBeNull();
 const all=stream(parseInt(key![1],16),parseInt(key![2],16),known.length+32);
 expect(all.slice(0,known.length)).toEqual(known);
 const printed=text.match(/Predicted next 32: ([0-9A-F ]+)\nIndependent generator: ([0-9A-F ]+)/);
 expect(printed).not.toBeNull();
 const parse=(v:string)=>v.trim().split(/\s+/).map(h=>parseInt(h,16));
 expect(parse(printed![1])).toEqual(all.slice(known.length));
 expect(parse(printed![2])).toEqual(all.slice(known.length));
 const tried=Number(text.match(/([\d,]+) tried/)![1].replaceAll(',',''));
 expect(tried).toBe(65536);
 await page.locator('#known-count').fill('3');
 await expect(result).toContainText('Retired');
 await page.getByRole('button',{name:'Break this sample'}).click();
 await expect(result).toContainText('65,536 candidates',{timeout:30000});
});

