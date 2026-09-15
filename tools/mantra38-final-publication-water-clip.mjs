import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=['cameraSettledBeforePublish','CAMERA','cameraReady','mapReady','regionalCenter','runBounds','PRE-PUBLISH','preflight'];
for(const needle of needles){
  let pos=0,count=0;
  while((pos=s.indexOf(needle,pos))!==-1){
    count++;
    const a=Math.max(0,pos-900),b=Math.min(s.length,pos+1400);
    console.log('\n=== '+needle+' #'+count+' @ '+pos+' ===\n'+s.slice(a,b));
    pos+=needle.length;
    if(count>=6)break;
  }
  console.log('COUNT '+needle+' '+count);
}
throw new Error('diagnostic only: current camera/publication anchors emitted; index.html unchanged');
