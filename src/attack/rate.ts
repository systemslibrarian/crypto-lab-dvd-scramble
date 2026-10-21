export function extrapolate(guesses:number,elapsedMs:number):{perSecond:number;bruteSeconds:number;factor:number} {
  if (!(guesses>0&&elapsedMs>0)) throw new RangeError('A measured duration is required');
  const perSecond=guesses*1000/elapsedMs;
  return {perSecond,bruteSeconds:2**40/perSecond,factor:2**40/guesses};
}

