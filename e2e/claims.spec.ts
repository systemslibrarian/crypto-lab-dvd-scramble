import {test,expect,type Page} from '@playwright/test';
import {stream,survivors} from './reference';
const parse=(s:string)=>s.trim().split(/\s+/).map(v=>parseInt(v,16));
async function fixed(page:Page,s1=0xb25c,s2=0x456a89){await page.addInitScript(({s1,s2})=>{const random=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=((a:any)=>{if(a instanceof Uint8Array&&a.length===5){a.set([s1&255,s1>>>8,s2&255,(s2>>>8)&255,s2>>>16]);return a}return random(a)}) as typeof crypto.getRandomValues},{s1,s2});await page.goto('./')}
async function search(page:Page){await page.locator('#break-button').click();await expect(page.locator('#break-button')).toBeEnabled();return page.locator('#attack-out').innerText()}
async function manual(page:Page,input:string){await page.getByText('Supply public bytes by hand',{exact:true}).click();await page.locator('#manual-bytes').fill(input)}
test('rendered 40-bit recovery regenerates both the known and independent future bytes',async({page})=>{
 await fixed(page);const known=parse(await page.locator('#observed').innerText());expect(known).toEqual(stream(0xb25c,0x456a89,6));
 const text=await search(page);expect(text).toContain('40-BIT KEY — 16-BIT WORK');const key=text.match(/s₁=0x([0-9A-F]{4}), s₂=0x([0-9A-F]{6})/);expect(key).not.toBeNull();
 const all=stream(parseInt(key![1],16),parseInt(key![2],16),known.length+32);expect(all.slice(0,known.length)).toEqual(known);
 const printed=text.match(/Predicted next 32: ([0-9A-F ]+)\nIndependent generator: ([0-9A-F ]+)/);expect(printed).not.toBeNull();expect(parse(printed![1])).toEqual(all.slice(known.length));expect(parse(printed![2])).toEqual(all.slice(known.length));
 const tried=Number(text.match(/([\d,]+) tried/)![1].replaceAll(',',''));expect(tried).toBe(65536);expect(Number((await page.locator('#tested-count').innerText()).replaceAll(',',''))).toBe(tried);expect(await page.locator('#search-progress').getAttribute('value')).toBe(String(tried));
 await page.locator('#known-count').dispatchEvent('input');expect(await page.locator('#attack-out').innerText()).toBe(text);
 await page.locator('#known-count').fill('3');await expect(page.locator('#attack-out')).toContainText('Retired');expect(await search(page)).toContain('65,536 candidates');
});
test('three public bytes stay undetermined even when private bytes would identify a key',async({page})=>{
 await fixed(page);await page.locator('#known-count').fill('3');const text=await search(page);expect(text).toContain('Undetermined — 65,536 candidates');expect(text).not.toContain('Recovered key:');expect(text).not.toContain('40-BIT KEY');
});
test('displayed extrapolated days equal 2^40 divided by the displayed rate',async({page})=>{
 await fixed(page);await search(page);const text=await page.locator('#rate').innerText(),rate=Number(text.match(/\(([\d.]+) candidates\/s\)/)![1]),days=Number(text.match(/rate: ([\d.]+) days/)![1]);const expected=2**40/rate/86400;
 expect(Math.abs(days-expected)).toBeLessThanOrEqual(.000501+expected*.501/rate);expect(text).toContain('extrapolated, not run');
});
test('carry propagates across an all-ones middle sum',async({page})=>{
 await fixed(page,0x434c,0x9cbcf2);const expected=stream(0x434c,0x9cbcf2,3);
 for(let i=0;i<3;i++){await page.locator('#clock').click();const text=await page.locator('#step-out').innerText();expect(Number(text.match(/= (\d+) \(mod 256\)/)![1])).toBe(expected[i])}
});
test('impossible public bytes give zero survivors without a key claim',async({page})=>{
 await fixed(page);await manual(page,'00 00 00 00 00 00 00 00');const text=await search(page);expect(survivors(Array(8).fill(0))).toBe(0);expect(text).toContain('Zero survivors');expect(text).not.toContain('Recovered key:');
});
test('cancelled search keeps its partial counter and claims no key',async({page})=>{
 await fixed(page);await page.evaluate(()=>{document.getElementById('break-button')!.click();document.getElementById('cancel')!.click()});
 const text=await page.locator('#attack-out').innerText();expect(text).toContain('Cancelled:');expect(text).not.toContain('Recovered key:');expect(text).not.toContain('40-BIT KEY');const count=Number((await page.locator('#tested-count').innerText()).replaceAll(',',''));expect(count).toBeLessThan(65536);expect(text).toContain(count.toLocaleString()+' candidates tried');
});
test('survivor histogram counts actual public matches rather than a formula',async({page})=>{
 await fixed(page);await page.locator('#profile').click();await expect(page.locator('#profile')).toBeEnabled({timeout:30000});const out=page.locator('#profile-out');const samples=JSON.parse(await out.getAttribute('data-samples')||'null'),rows=JSON.parse(await out.getAttribute('data-counts')||'null');expect(rows).toHaveLength(8);
 // Fixed RNG repeats a real input for reproducibility; the reference enumerates it independently.
 const expected=Array.from({length:6},(_,i)=>survivors(samples[0].slice(0,i+3)));for(const row of rows)expect(row).toEqual(expected);expect(await out.innerText()).toContain('k=3: 65,536');
});
test('search worker receives exactly the public bytes and no private continuation',async({page})=>{
 await page.addInitScript(()=>{const post=Worker.prototype.postMessage;Worker.prototype.postMessage=function(data:any,...args:any[]){(window as any).__sent=data;return post.call(this,data,...args as [any])}});
 await fixed(page);const known=parse(await page.locator('#observed').innerText());await page.locator('#break-button').click();const sent=await page.evaluate(()=>(window as any).__sent);expect(sent).toEqual({bytes:known,msbFirst:false});
});
test('manual unique candidate remains unverified without private bytes and short input refuses',async({page})=>{
 await fixed(page);const known=await page.locator('#observed').innerText();await manual(page,known);const text=await search(page);expect(text).toContain('One public candidate');expect(text).not.toContain('Recovered key:');await page.locator('#manual-bytes').fill('00 00');expect(await search(page)).toContain('Supply 3 to 64 known output bytes');
});
