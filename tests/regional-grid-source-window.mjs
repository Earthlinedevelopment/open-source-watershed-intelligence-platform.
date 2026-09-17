const html=await (await fetch('https://earthlinedevelopment.org/',{cache:'no-store'})).text();
const lines=html.split(/\r?\n/);
const hits=[];
for(let i=0;i<lines.length;i++){
  const l=lines[i];
  if(/96/.test(l)&&/(grid|terrain|dem|elev|regional|\bw\b|\bh\b|width|height)/i.test(l)){
    hits.push(i);
  }
}
console.log('EARTHLINE_GRID_SOURCE_HITS '+JSON.stringify({count:hits.length,lines:hits.slice(0,200).map(i=>i+1)}));
for(const i of hits.slice(0,120)){
  const lo=Math.max(0,i-8), hi=Math.min(lines.length,i+9);
  console.log('\nEARTHLINE_GRID_SOURCE_WINDOW line='+(i+1)+'\n'+lines.slice(lo,hi).map((x,j)=>String(lo+j+1).padStart(6,'0')+': '+x).join('\n'));
}
