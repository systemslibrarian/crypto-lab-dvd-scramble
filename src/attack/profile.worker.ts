import {recover} from './divide';
import {generate} from '../css/css';

self.onmessage=(event:MessageEvent<{publicSamples:number[][]}>)=>{
  try {
    const counts:number[][]=[];
    for(const bytes of event.data.publicSamples){
      if(bytes.length!==8)throw new RangeError('Eight bytes required per sample');
      // The first three bytes determine the other seed for every 16-bit guess.
      // Count subsequent matches, rather than using a probability formula.
      const candidates=recover(bytes.slice(0,3)).candidates;
      const row=[candidates.length,0,0,0,0,0];
      for(const key of candidates){
        const emitted=generate(key,8).map(f=>f.z);
        for(let k=4;k<=8;k++){
          if(emitted[k-1]!==bytes[k-1])break;
          row[k-3]++;
        }
      }
      counts.push(row);
      self.postMessage({progress:counts.length});
    }
    self.postMessage({counts});
  }catch(error){self.postMessage({error:String(error)})}
};
