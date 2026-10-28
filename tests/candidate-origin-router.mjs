export async function installCandidateOrigin(context){
  await context.route('https://earthlinedevelopment.org/**', async route=>{
    const req=route.request();
    const u=new URL(req.url());
    const local='http://127.0.0.1:8787'+u.pathname+u.search;
    try{
      const init={method:req.method(),redirect:'manual'};
      const post=req.postDataBuffer?.();
      if(post&&req.method()!=='GET'&&req.method()!=='HEAD')init.body=post;
      const res=await fetch(local,init);
      const body=Buffer.from(await res.arrayBuffer());
      const headers={};
      for(const [k,v] of res.headers.entries()){
        const n=k.toLowerCase();
        if(['content-encoding','content-length','transfer-encoding','connection'].includes(n))continue;
        headers[k]=v;
      }
      headers['cache-control']='no-store';
      await route.fulfill({status:res.status,headers,body});
    }catch(err){
      await route.abort('failed');
    }
  });
  await context.route('https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-telemetry**',r=>r.fulfill({status:204,body:''}));
}
