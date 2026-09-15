from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16639 — STALE REGIONAL CONTEXT CANNOT RECLAIM PROPERTY'
if marker in s:
    print('16639 already applied')
    raise SystemExit(0)

old='''        window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970=enriched16198;\n        publishDisplayedRun16151(enriched16198);'''
if s.count(old)!=1:
    raise SystemExit(f'guard failed: expected one late Regional context publication pair, found {s.count(old)}')

new='''        /* EARTHLINE 16639 — STALE REGIONAL CONTEXT CANNOT RECLAIM PROPERTY.\n           The non-blocking Regional context continuation may finish after the user has\n           already handed the existing 15778/15805 owners to Property. It must enrich\n           only the Regional run that is still canonically displayed. This is a stale-\n           result guard inside the existing Regional publication owner; no new owner,\n           listener, timer, renderer, source, mask, hydrology rule or lifecycle is added. */\n        const displayedBeforeContext16639=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;\n        const displayedToken16639=String(displayedBeforeContext16639&&displayedBeforeContext16639.runToken||'');\n        const displayedTier16639=String(displayedBeforeContext16639&&(displayedBeforeContext16639.tier||displayedBeforeContext16639.mode)||'').toLowerCase();\n        const propertyRunning16639=String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';\n        const regionalState16639=window.earthlineRegional15778||null;\n        if(\n          propertyRunning16639||\n          (regionalState16639&&regionalState16639.mode==='property')||\n          (regionalState16639&&regionalState16639.active!==true)||\n          displayedToken16639!==String(runToken||'')||\n          (displayedTier16639&&displayedTier16639!=='regional')\n        ){\n          window.EARTHLINE_REGIONAL_CONTEXT_16198={build:'EARTHLINE 16198',runToken,discarded:true,reason:'superseded-tier-before-context-publication',displayedToken:displayedToken16639||null,displayedTier:displayedTier16639||null,propertyRunning:propertyRunning16639,at:new Date().toISOString()};\n          return false;\n        }\n        window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970=enriched16198;\n        publishDisplayedRun16151(enriched16198);'''
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit('post-guard failed: 16639 marker missing')
if s.count('publishDisplayedRun16151(enriched16198);')!=1:
    raise SystemExit('post-guard failed: enriched Regional publisher count changed unexpectedly')

p.write_text(s,encoding='utf-8')
print('16639 applied: stale Regional context can no longer overwrite a newer Property/tier handoff')
