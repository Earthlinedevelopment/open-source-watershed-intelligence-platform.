export function applyElderRestore(html){
  let s=String(html);
  if(!s.includes('earthline-elder-runtime-17097.js')){
    const at=s.toLowerCase().lastIndexOf('</body>');
    if(at<0)throw new Error('body close not found');
    s=s.slice(0,at)+'<script src="/earthline-elder-runtime-17097.js"></script>\n'+s.slice(at);
  }
  const ownerStart=Math.max(s.indexOf('async function terminalPropertyRun'),s.indexOf('function terminalPropertyRun'));
  if(ownerStart<0)throw new Error('terminal Property owner not found');
  const decl=s.indexOf('window.EARTHLINE_PROPERTY_DECLARATION_16169=',ownerStart);
  if(decl<0)throw new Error('Property declaration not found');
  const lineEnd=s.indexOf('\n',decl);
  if(lineEnd<0)throw new Error('Property declaration line end not found');
  const hook="\n    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){} /* MANTRA83_ELDER_RESTORE */";
  if(!s.slice(decl,lineEnd+hook.length+20).includes('MANTRA83_ELDER_RESTORE'))s=s.slice(0,lineEnd)+hook+s.slice(lineEnd);
  return s;
}
