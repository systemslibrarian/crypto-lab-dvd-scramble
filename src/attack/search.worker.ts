import { recover } from './divide';
self.onmessage=(event:MessageEvent<{bytes:number[];msbFirst:boolean}>)=>{
  try {
    const answer=recover(event.data.bytes,event.data.msbFirst,count=>{if ((count&4095)===0) self.postMessage({progress:count})});
    self.postMessage({answer});
  } catch (error) {self.postMessage({error:String(error)})}
};

