import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const s=readFileSync('index.html','utf8');
const old='if(len<2.5){';
const anchor='    /* EARTHLINE 16350 — Regional water is counted here for audit only; SVG does not render it.';
for(const [n,label] of [[old,'short corridor visual owner'],[anchor,'Regional renderer audit owner']]){
 const count=s.split(n).length-1;if(count!==1)throw Error(label+' expected 1, got '+count);
}
const insertion="    /* M92: use renderer's zoom-scaled stroke widths, not late 20px CSS overrides. */\n    for(const pathM92 of sg.querySelectorAll(':scope > path')){\n      const widthM92=Number(pathM92.getAttribute('stroke-width'));\n      if(Number.isFinite(widthM92)&&widthM92>0)\n        pathM92.style.setProperty('stroke-width',String(widthM92)+'px','important');\n    }\n";
let out=s.replace(old,'if(len<8){').replace(anchor,insertion+anchor);
if(!out.includes("metricLengthM92>=250&&metricLengthM92<=4005")||
 !out.includes("slope>maxSlope")||
 !out.includes("if(focusMode||preferredEligibleCount16539<36)"))
 throw Error('Expected pure science safety owners missing');
const hash=x=>createHash('sha256').update(x).digest('hex');
writeFileSync('index.html',out);
console.log('M92_INLINE_RENDER_PRIORITY '+JSON.stringify({before:hash(s),after:hash(out),
 scope:'swale SVG only',scienceUnchanged:true,shortLineCutoffPx:8,zoomScalingPreserved:true}));
