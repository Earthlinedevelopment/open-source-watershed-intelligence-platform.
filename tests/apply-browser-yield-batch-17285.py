from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
repls={
"if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();":"if((++yieldCount16661%64)===0)await earthlineCooperativeYield16661();",
"if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();":"if((++finalScreenYield16661%64)===0)await earthlineCooperativeYield16661();",
"if((++featureIndex16661%12)===0)await earthlineCooperativeYield16661();":"if((++featureIndex16661%64)===0)await earthlineCooperativeYield16661();",
"if((++featureIndex16661%16)===0)await earthlineCooperativeYield16661();":"if((++featureIndex16661%64)===0)await earthlineCooperativeYield16661();"
}
for old,new in repls.items():
    n=s.count(old)
    if n!=1: raise SystemExit(f"batch anchor {old[:30]} count {n}")
    s=s.replace(old,new,1)
s="<!-- EARTHLINE_BROWSER_YIELD_BATCH_17285: identical ordered screening/clipping with cooperative scheduler handoff every 64 items instead of 12/16; no science/output changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched cooperative yield batch 17285")
