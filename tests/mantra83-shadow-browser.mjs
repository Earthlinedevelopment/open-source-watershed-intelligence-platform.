import fs from 'node:fs';
import vm from 'node:vm';

class CustomEvent extends Event{constructor(type,opts={}){super(type);this.detail=opts.detail;}}
const document=new EventTarget();
const window={};
const context=vm.createContext({window,document,CustomEvent,Event,console,Promise,JSON,Object,Array,Number,String,Date,Math,setTimeout,clearTimeout});
const source=fs.readFileSync('shadow/mantra83-shadow-live.js','utf8');
vm.runInContext(source,context);

if(!window.EARTHLINE_MANTRA83_SHADOW)throw new Error('shadow observer failed to install');

const sample=Object.freeze({runToken:'shadow-test-1',query:'Shadow Test',tier:'property',mode:'property',derived:{swaleOpportunityLines:7}});
window.EARTHLINE_DISPLAYED_RUN_16147=sample;
window.EARTHLINE_DISPLAYED_RUN_16151=sample;
const before=JSON.stringify(window.EARTHLINE_DISPLAYED_RUN_16151);
document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{runToken:'shadow-test-1',tier:'property'}}));
await new Promise(r=>setTimeout(r,5));
const after=JSON.stringify(window.EARTHLINE_DISPLAYED_RUN_16151);
const rows=window.EARTHLINE_MANTRA83_SHADOW.rows();
if(before!==after)throw new Error('shadow observer mutated displayed run');
if(rows.length!==1)throw new Error('shadow observer did not capture exactly one completion');
if(rows[0].identityUnchanged!==true)throw new Error('shadow identity invariant failed');

console.log('M83_SHADOW_EVENT_PASS '+JSON.stringify({rows:rows.length,identityUnchanged:rows[0].identityUnchanged,eventRunToken:rows[0].eventRunToken,tier:rows[0].tier}));
