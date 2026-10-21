import './styles.css';
import { generate, type Key } from './css/css';
import { verify } from './verify/verify';
import { extrapolate } from './attack/rate';
import type { Search } from './attack/divide';

const root=document.querySelector<HTMLElement>('#exhibit')!;
const hex=(n:number,width=2)=>n.toString(16).padStart(width,'0').toUpperCase();
const secret=():Key=>{const bytes=crypto.getRandomValues(new Uint8Array(5));return {s1:bytes[0]|bytes[1]<<8,s2:bytes[2]|bytes[3]<<8|bytes[4]<<16}};
let key=secret(), stepKey=secret(), order=false, step=0, worker:Worker|null=null, profileWorker:Worker|null=null, runId=0, profileRun=0, current:Search|null=null;
root.innerHTML=`
<section aria-labelledby="intro"><h2 id="intro">A small register gives the other away</h2><p>DVD's Content Scrambling System used a 40-bit key. A trillion possible keys sounds daunting, but the book's generator has two registers that add their bytes. If you guess the 16-bit register, subtraction determines the other 24 bits. Try the real bit arithmetic below.</p><p class="warn card"><strong>Scope:</strong> This is Boneh and Shoup's CSS teaching variant. It does not process DVDs, sector substitution, player authentication, or the deployed key hierarchy. No published test vector exists for this book variant; independent implementations are compared in the tests.</p></section>
<section aria-labelledby="registers"><h2 id="registers">1 · Watch two registers</h2><p>The left register has 17 cells and taps 14, 0; the right has 25 and taps 12, 4, 3, 0. The top bit of each starting register is forced to 1. Each clock outputs its low bit, XORs the tapped bits into the top, and shifts right. Eight clocks make one byte, low bit first.</p><button id="clock">Clock eight times</button><button id="step-reset">New sample key</button><output id="step-out" aria-live="polite"></output></section>
<section aria-labelledby="break"><h2 id="break">2 · Recover the 40-bit key</h2><p>The generated key stays hidden. Only the first known bytes go to the attacker. Its 65,536 guesses derive the other register through subtraction modulo 2²⁴ and check the remaining bytes. The private continuation is checked separately before a recovered key is shown.</p><label for="known-count">Known keystream bytes: <strong id="known-value">6</strong></label><input id="known-count" type="range" min="3" max="8" value="6"><p>Observed: <span id="observed" class="mono"></span></p><button id="break-button">Break this sample</button><button id="new-key">Generate another secret key</button><button id="cancel" disabled>Cancel search</button><output id="attack-out" aria-live="polite">Ready. No key has been recovered.</output></section>
<section aria-labelledby="mechanism"><h2 id="mechanism">3 · Why the subtraction works</h2><p>For the first three bytes, the carried byte addition is one integer addition modulo 2²⁴. Read the little-endian triple as a number: <code>Y = (Z − X) mod 2²⁴</code>. The first 24 bits from the big register are its seed bits. For three observed bytes, every small-register guess determines some large-register seed: 65,536 survivors, not a unique break. Each extra known byte rejects most guesses.</p><div id="subtraction" class="output mono" aria-live="polite"></div><button id="profile">Count survivors for eight fresh keys</button><button id="profile-cancel" disabled>Cancel counts</button><output id="profile-out" aria-live="polite">No survivor histogram yet.</output></section>
<section aria-labelledby="cost"><h2 id="cost">4 · Compare the work</h2><div id="rate" class="output" aria-live="polite">Run the search to measure this browser's candidate rate.</div><p>The 2⁴⁰ time is an extrapolation from the measured search, never an actual exhaustive attack. For a unique six-byte sample, the recovered key uses at most 2¹⁶ trials, often fewer on average if the search stops at the first externally verified key.</p></section>
<section aria-labelledby="real"><h2 id="real">What this does and does not show</h2><p>The deployed CSS generator inserted its forced bits at different positions and discarded early output bytes. Those changes do not remove the guess-and-determine weakness in the historical analyses, but this page implements the book variant only. It uses session-only keys from <code>crypto.getRandomValues</code>. Not production crypto — a teaching demo.</p><details><summary>Sources and related labs</summary><ul><li><a href="https://toc.cryptobook.us/">Boneh &amp; Shoup, A Graduate Course in Applied Cryptography, v0.6 §3.8</a></li><li><a href="https://github.com/systemslibrarian/crypto-lab-lfsr-forge">LFSR Forge</a> — a statistical attack on a different combiner</li><li><a href="https://github.com/systemslibrarian/crypto-lab-export-grade">Export Grade</a> — another short-key system</li><li><a href="https://github.com/systemslibrarian/crypto-lab-wep-crack">WEP Crack</a> — the following RC4 case study</li></ul></details></section>`;

const value=(id:string)=>document.getElementById(id)!;
const known=()=>generate(key,Number((value('known-count') as HTMLInputElement).value),order).map(f=>f.z);
function showStep(){
 const frames=generate(stepKey,step+1,order), f=frames[step];
 value('step-out').textContent=`Byte ${step+1}: ${hex(f.register1,5)} [taps 14,0] → x = ${hex(f.x)}; ${hex(f.register2,7)} [taps 12,4,3,0] → y = ${hex(f.y)}\n${f.x} + ${f.y} + carry ${f.carryIn} = ${f.z} (mod 256); carry to next byte = ${f.carryOut}.`;
}
function retire(){
 runId++;profileRun++;worker?.terminate();worker=null;profileWorker?.terminate();profileWorker=null;current=null;
 (value('break-button') as HTMLButtonElement).disabled=false;
 (value('cancel') as HTMLButtonElement).disabled=true;
 value('attack-out').textContent='Retired: inputs changed. Run a new search.';
 value('attack-out').className='';value('rate').textContent='Run the search to measure this browser’s candidate rate.';
 (value('profile') as HTMLButtonElement).disabled=false;(value('profile-cancel') as HTMLButtonElement).disabled=true;
 value('profile-out').textContent='Retired: inputs changed. Count again.';
}
function update(){
 value('known-value').textContent=(value('known-count') as HTMLInputElement).value;
 value('observed').textContent=known().map(x=>hex(x)).join(' ');
 const f=generate(stepKey,3,order);
 const x=f[0].x|(f[1].x<<8)|(f[2].x<<16);
 const z=f[0].z|(f[1].z<<8)|(f[2].z<<16);
 value('subtraction').textContent=`Observed Z = 0x${hex(z,6)}; for the current sample's small register, X = 0x${hex(x,6)}.\n(0x${hex(z,6)} − 0x${hex(x,6)}) mod 2²⁴ = 0x${hex((z-x)&0xffffff,6)} = the other seed.`;
}
value('clock').addEventListener('click',()=>{showStep();step=(step+1)%16});
value('step-reset').addEventListener('click',()=>{stepKey=secret();step=0;value('step-out').textContent='New in-memory demonstration key loaded.';update()});
value('known-count').addEventListener('input',()=>{retire();update()});
value('new-key').addEventListener('click',()=>{key=secret();step=0;retire();update()});
value('cancel').addEventListener('click',()=>{runId++;worker?.terminate();worker=null;(value('cancel') as HTMLButtonElement).disabled=true;(value('break-button') as HTMLButtonElement).disabled=false;value('attack-out').textContent+='\nCancelled: partial counts are not a recovered key.'});
value('profile-cancel').addEventListener('click',()=>{profileRun++;profileWorker?.terminate();profileWorker=null;(value('profile') as HTMLButtonElement).disabled=false;(value('profile-cancel') as HTMLButtonElement).disabled=true;value('profile-out').textContent='Cancelled: partial counts are not a histogram.'});
value('profile').addEventListener('click',()=>{
 const id=++profileRun;
 const samples=Array.from({length:8},()=>generate(secret(),8).map(f=>f.z));
 (value('profile') as HTMLButtonElement).disabled=true;(value('profile-cancel') as HTMLButtonElement).disabled=false;
 value('profile-out').textContent='Counting actual survivors for eight independent keys…';
 profileWorker=new Worker(new URL('./attack/profile.worker.ts',import.meta.url),{type:'module'});
 profileWorker.onmessage=(event:MessageEvent<{progress?:number;counts?:number[][];error?:string}>)=>{
  if(id!==profileRun)return;
  if(event.data.progress){value('profile-out').textContent=`Completed ${event.data.progress} / 8 samples…`;return}
  profileWorker?.terminate();profileWorker=null;
  (value('profile') as HTMLButtonElement).disabled=false;(value('profile-cancel') as HTMLButtonElement).disabled=true;
  if(event.data.error){value('profile-out').textContent=`Count failed: ${event.data.error}`;return}
  const rows=event.data.counts!;
  value('profile-out').textContent='Actual surviving 16-bit guesses (eight independent secret keys):\n'+
    Array.from({length:6},(_,i)=>`k=${i+3}: ${rows.map(r=>r[i].toLocaleString()).join(' · ')} | mean ${(rows.reduce((sum,r)=>sum+r[i],0)/8).toFixed(1)}`).join('\n');
 };
 profileWorker.onerror=()=>{if(id===profileRun){value('profile-out').textContent='Worker failed; no counts claimed.';(value('profile') as HTMLButtonElement).disabled=false;(value('profile-cancel') as HTMLButtonElement).disabled=true}};
 profileWorker.postMessage({publicSamples:samples});
});
value('break-button').addEventListener('click',()=>{
 const id=++runId, observations=known(), continuation=generate(key,observations.length+32,order).slice(observations.length).map(f=>f.z), start=performance.now();
 current=null;(value('break-button') as HTMLButtonElement).disabled=true;(value('cancel') as HTMLButtonElement).disabled=false;
 value('attack-out').textContent='Searching 65,536 first-register states…';
 worker=new Worker(new URL('./attack/search.worker.ts',import.meta.url),{type:'module'});
 worker.onmessage=(event:MessageEvent<{progress?:number;answer?:Search;error?:string}>)=>{
  if (id!==runId)return;
  if(event.data.progress!==undefined){value('attack-out').textContent=`Tried ${event.data.progress.toLocaleString()} / 65,536 candidates.`;return}
  (value('break-button') as HTMLButtonElement).disabled=false;(value('cancel') as HTMLButtonElement).disabled=true;
  worker?.terminate();worker=null;
  if(event.data.error){value('attack-out').textContent=`Search refused: ${event.data.error}`;return}
  current=event.data.answer!;
  const elapsed=Math.max(1,performance.now()-start), matches=current.candidates.filter(k=>verify(k,observations,continuation,order));
  if(matches.length===1){
    const found=matches[0], predicted=generate(found,observations.length+32,order).slice(observations.length).map(f=>f.z);
    value('attack-out').className='alarm';
    value('attack-out').textContent=`ALARM — 40-BIT KEY, 16-BIT WORK\n${current.tested.toLocaleString()} tried; ${current.candidates.length} survived the known bytes; ${matches.length} passed a separate check against the next 32 private bytes.\nRecovered key: s₁=0x${hex(found.s1,4)}, s₂=0x${hex(found.s2,6)}.\nPredicted next 32: ${predicted.map(x=>hex(x)).join(' ')}\nIndependent generator: ${continuation.map(x=>hex(x)).join(' ')}.`;
  }else{
    value('attack-out').className='warn';value('attack-out').textContent=`Undetermined — ${current.candidates.length} candidates agree with ${observations.length} public bytes. ${matches.length} agree with the private continuation. No key is claimed. ${current.tested.toLocaleString()} tried.`;
  }
  const rate=extrapolate(current.tested,elapsed);
  value('rate').textContent=`Measured ${current.tested.toLocaleString()} candidates in ${elapsed.toFixed(1)} ms (${rate.perSecond.toFixed(0)} candidates/s). Brute-force 2⁴⁰ at this measured rate: ${(rate.bruteSeconds/86400).toFixed(1)} days (extrapolated, not run). Work factor ≈ ${rate.factor.toLocaleString()}×.`;
 };
 worker.onerror=()=>{if(id===runId){value('attack-out').textContent='Worker failed; no key claimed.';(value('break-button') as HTMLButtonElement).disabled=false;(value('cancel') as HTMLButtonElement).disabled=true}};
 worker.postMessage({bytes:observations,msbFirst:order});
});
update();
