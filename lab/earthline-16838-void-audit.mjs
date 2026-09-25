import {chromium} from 'playwright';
import fs from 'fs';
const target=[-92.12943,34.77042];
const injection=String.raw`
    if(!focusMode&&hy&&hy.validityMask16584&&swales&&Array.isArray(swales.features)){
      const N16838=24,channel16838=percentile(hy.acc,.972),mids16838=[];
      for(const f16838 of swales.features||[]){const c16838=f16838?.geometry?.type==='LineString'?f16838.geometry.coordinates:null;if(!Array.isArray(c16838)||!c16838.length)continue;const m16838=c16838[Math.floor((c16838.length-1)/2)],g16838=llGrid(hy,m16838);if(g16838&&Number.isFinite(g16838.x)&&Number.isFinite(g16838.y))mids16838.push([Number(g16838.x),Number(g16838.y)]);}
      const rows16838=[];
      for(let by16838=0;by16838<N16838;by16838++)for(let bx16838=0;bx16838<N16838;bx16838++){
        const x016838=Math.floor(bx16838*hy.w/N16838),x116838=Math.min(hy.w-1,Math.ceil((bx16838+1)*hy.w/N16838)-1),y016838=Math.floor(by16838*hy.h/N16838),y116838=Math.min(hy.h-1,Math.ceil((by16838+1)*hy.h/N16838)-1);
        let valid16838=0,opp16838=0,pref16838=0,swales16838=0;
        for(let y16838=y016838;y16838<=y116838;y16838++)for(let x16838=x016838;x16838<=x116838;x16838++){
          const i16838=y16838*hy.w+x16838;if(hy.validityMask16584[i16838]!==1)continue;if(swaleJurisdictionGeometry16539){const ll16838=gridLL(hy,x16838,y16838);if(!earthlinePointInJurisdiction16539(ll16838,swaleJurisdictionGeometry16539))continue;}valid16838++;const sp16838=Number(hy.slope[i16838]),ac16838=Number(hy.acc[i16838]);if(!Number.isFinite(sp16838)||!Number.isFinite(ac16838)||ac16838>=channel16838)continue;if(sp16838>=.05&&sp16838<=4)opp16838++;if(sp16838>=.20&&sp16838<=4)pref16838++;
        }
        const cx16838=(x016838+x116838)/2,cy16838=(y016838+y116838)/2;let nearest16838=Infinity;for(const m16838 of mids16838)nearest16838=Math.min(nearest16838,Math.hypot(cx16838-m16838[0],cy16838-m16838[1]));
        rows16838.push({bx:bx16838,by:by16838,x0:x016838,x1:x116838,y0:y016838,y1:y116838,valid:valid16838,opp:opp16838,pref:pref16838,cx:cx16838,cy:cy16838,nearestGrid:Number.isFinite(nearest16838)?nearest16838:null,swales:swales16838});
      }
      for(const m16838 of mids16838){const bx16838=Math.max(0,Math.min(N16838-1,Math.floor(m16838[0]*N16838/Math.max(1,hy.w)))),by16838=Math.max(0,Math.min(N16838-1,Math.floor(m16838[1]*N16838/Math.max(1,hy.h))));const r16838=rows16838[by16838*N16838+bx16838];if(r16838)r16838.swales++;}
      const gaps16838=rows16838.filter(r16838=>r16838.valid>=4&&r16838.opp>=3&&(r16838.opp/Math.max(1,r16838.valid))>=.45&&r16838.swales===0);
      window.EARTHLINE_VOID_AUDIT_16838={build:'EARTHLINE 16838 diagnostic',w:hy.w,h:hy.h,bounds:hy.bounds,midpoints:mids16838.length,gaps:gaps16838,at:new Date().toISOString()};
    }
`;
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1800,height:900}});
await page.route('https://earthlinedevelopment.org/**',async route=>{const req=route.request();if(req.resourceType()!=='document'){await route.continue();return;}const u=new URL(req.url());if(u.pathname!=='/'&&u.pathname!=='/index.html'){await route.continue();return;}const resp=await route.fetch();let body=await resp.text();const anchor='    /* EARTHLINE 16780 — the coarse 6x6 coverage owner can pass while a large';const at=body.indexOf(anchor);if(at<0)throw new Error('16780 anchor missing');body=body.slice(0,at)+injection+body.slice(at);await route.fulfill({response:resp,body});});
await page.goto('https://earthlinedevelopment.org/?audit16838='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});await page.waitForFunction(()=>window.EARTHLINE_VOID_AUDIT_16838?.gaps?.length>0,null,{timeout:90000,polling:100});await page.waitForTimeout(200);
const out=await page.evaluate((target)=>{const a=window.EARTHLINE_VOID_AUDIT_16838;const b=a.bounds;const gx=(target[0]-b[0])/(b[2]-b[0])*(a.w-1),gy=(b[3]-target[1])/(b[3]-b[1])*(a.h-1),bx=Math.max(0,Math.min(23,Math.floor(gx*24/Math.max(1,a.w)))),by=Math.max(0,Math.min(23,Math.floor(gy*24/Math.max(1,a.h)))),targetRow=a.gaps.find(r=>r.bx===bx&&r.by===by)||null;const hist={};for(const t of [2,3,4,5,6,7,8,10,12])hist[t]=a.gaps.filter(r=>Number(r.nearestGrid)>=t).length;return {...a,targetGrid:{gx,gy,bx,by},targetRow,hist};},target);
fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/16838-void-audit.json',JSON.stringify(out,null,2));console.log(JSON.stringify({gaps:out.gaps.length,midpoints:out.midpoints,targetGrid:out.targetGrid,targetRow:out.targetRow,hist:out.hist}));await browser.close();
