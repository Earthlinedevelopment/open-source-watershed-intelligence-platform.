from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_norm="""function earthlineHistoryNormalize15774(value){
  return String(value||"").trim().toLowerCase().replace(/\\s+/g," ");
}
"""
new_norm="""function earthlineHistoryNormalize15774(value){
  return String(value||"").trim().toLowerCase().replace(/\\s+/g," ");
}
/* EARTHLINE 17458 — U.S. state history identity.
   Search history is presentation/navigation state only. Exact U.S. state searches
   must never be persisted or resurfaced as a country identity. Georgia remains
   conservative unless the resolved object explicitly says U.S./state because the
   country Georgia is a legitimate search target. */
const EARTHLINE_US_STATES_17458=Object.freeze({
  "alabama":"Alabama","alaska":"Alaska","arizona":"Arizona","arkansas":"Arkansas","california":"California",
  "colorado":"Colorado","connecticut":"Connecticut","delaware":"Delaware","florida":"Florida","georgia":"Georgia",
  "hawaii":"Hawaii","idaho":"Idaho","illinois":"Illinois","indiana":"Indiana","iowa":"Iowa","kansas":"Kansas",
  "kentucky":"Kentucky","louisiana":"Louisiana","maine":"Maine","maryland":"Maryland","massachusetts":"Massachusetts",
  "michigan":"Michigan","minnesota":"Minnesota","mississippi":"Mississippi","missouri":"Missouri","montana":"Montana",
  "nebraska":"Nebraska","nevada":"Nevada","new hampshire":"New Hampshire","new jersey":"New Jersey",
  "new mexico":"New Mexico","new york":"New York","north carolina":"North Carolina","north dakota":"North Dakota",
  "ohio":"Ohio","oklahoma":"Oklahoma","oregon":"Oregon","pennsylvania":"Pennsylvania","rhode island":"Rhode Island",
  "south carolina":"South Carolina","south dakota":"South Dakota","tennessee":"Tennessee","texas":"Texas","utah":"Utah",
  "vermont":"Vermont","virginia":"Virginia","washington":"Washington","west virginia":"West Virginia",
  "wisconsin":"Wisconsin","wyoming":"Wyoming","district of columbia":"District of Columbia"
});
function earthlineHistoryCanonicalState17458(query,label,loc=null){
  const q=earthlineHistoryNormalize15774(query).replace(/^state of /,"").replace(/,\\s*(?:usa|u\\.?s\\.?a\\.?|united states(?: of america)?)$/,"").trim();
  const l=earthlineHistoryNormalize15774(label);
  const state=EARTHLINE_US_STATES_17458[q]||null;
  if(!state)return null;
  const country=earthlineHistoryNormalize15774(loc?.countryCode||loc?.country_code||loc?.country||"");
  const stateCode=String(loc?.stateCode||loc?.state_code||"").trim();
  const placeType=earthlineHistoryNormalize15774(loc?.placeType||loc?.place_type||loc?.type||loc?.kind||"");
  const explicitUS=country==="us"||country==="usa"||country==="united states"||country==="united states of america"||!!stateCode||/state|region|administrative|jurisdiction/.test(placeType)||/,\\s*(?:usa|united states(?: of america)?)\\b/.test(l);
  const badCountryLabel=/\\bcountry\\b/.test(l);
  if(state==="Georgia"&&!explicitUS)return null;
  return (explicitUS||badCountryLabel)?state:null;
}
function earthlineHistoryClean17458(item,loc=null){
  const query=String(item&&item.query||item&&item.label||"").trim();
  const label=String(item&&item.label||query).trim();
  const state=earthlineHistoryCanonicalState17458(query,label,loc);
  return state?{query:state,label:state,at:Number(item&&item.at||0)}:{query:query||label,label:label||query,at:Number(item&&item.at||0)};
}
"""
if s.count(old_norm)!=1: raise SystemExit(f"history normalize anchor count {s.count(old_norm)}")
s=s.replace(old_norm,new_norm,1)

old_saved="""    if(Array.isArray(parsed))saved=parsed;"""
new_saved="""    if(Array.isArray(parsed))saved=parsed.map(item=>earthlineHistoryClean17458(item));"""
if s.count(old_saved)!=1: raise SystemExit(f"saved history anchor count {s.count(old_saved)}")
s=s.replace(old_saved,new_saved,1)

old_add="""  const label=loc&&(
    loc.fullName||
    ((loc.name||"")+(loc.sub?", "+loc.sub:""))
  );
  const query=String(queryText||label||"").trim();
  if(!query&&!label)return;

  const key=earthlineHistoryNormalize15774(query||label);
"""
new_add="""  const rawLabel=loc&&(
    loc.fullName||
    ((loc.name||"")+(loc.sub?", "+loc.sub:""))
  );
  const rawQuery=String(queryText||rawLabel||"").trim();
  const cleaned17458=earthlineHistoryClean17458({query:rawQuery,label:String(rawLabel||rawQuery),at:Date.now()},loc);
  const label=cleaned17458.label,query=cleaned17458.query;
  if(!query&&!label)return;

  const key=earthlineHistoryNormalize15774(query||label);
"""
if s.count(old_add)!=1: raise SystemExit(f"addRecentSearch anchor count {s.count(old_add)}")
s=s.replace(old_add,new_add,1)

# Persist the cleaned list immediately so already-saved bad labels disappear on reload.
old_tail="""  RECENTS=RECENTS.slice(0,EARTHLINE_SEARCH_HISTORY_LIMIT_15774);
}
function earthlineSaveSearchHistory15774(){"""
new_tail="""  RECENTS=RECENTS.slice(0,EARTHLINE_SEARCH_HISTORY_LIMIT_15774);
  try{localStorage.setItem(EARTHLINE_SEARCH_HISTORY_KEY_15774,JSON.stringify(RECENTS))}catch(_){}
}
function earthlineSaveSearchHistory15774(){"""
if s.count(old_tail)!=1: raise SystemExit(f"history load tail anchor count {s.count(old_tail)}")
s=s.replace(old_tail,new_tail,1)

s="<!-- EARTHLINE_STATE_HISTORY_IDENTITY_17458: exact U.S. state searches cannot persist/resurface as country history. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched U.S. state search-history identity 17458")
