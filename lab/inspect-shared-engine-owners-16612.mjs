import fs from 'node:fs';
const s = fs.readFileSync('index.html', 'utf8');

const uniq = xs => [...new Set(xs)];
const clip = (i, before=900, after=2200) => s.slice(Math.max(0,i-before), Math.min(s.length,i+after));

function contexts(label, re, max=12, before=900, after=2200){
  console.log(`\n===== ${label} =====`);
  re.lastIndex = 0;
  let m, n = 0;
  while ((m = re.exec(s)) && n < max) {
    n++;
    console.log(`\n--- ${label} #${n} @${m.index}: ${m[0]} ---\n${clip(m.index,before,after)}`);
    if (m[0].length === 0) re.lastIndex++;
  }
  if (!n) console.log('NOT FOUND');
}

function list(label, values, max=250){
  const v = uniq(values).sort();
  console.log(`\n===== ${label} (${v.length}) =====`);
  for (const x of v.slice(0,max)) console.log(x);
}

// 1) Discover actual current identifiers instead of assuming historical names.
list('IDENTIFIERS CONTAINING WATER', [...s.matchAll(/\b[$A-Za-z_][$\w]*(?:water|Water|WATER)[$\w]*\b/g)].map(m=>m[0]));
list('STRING LITERALS CONTAINING WATER', [...s.matchAll(/(['"`])([^\n]{0,120}?(?:water|Water|WATER)[^\n]{0,120}?)\1/g)].map(m=>m[2]), 300);

// 2) Enumerate source/layer publication sites whose nearby code mentions water.
const calls = [];
for (const re of [/\.addSource\s*\(/g,/\.addLayer\s*\(/g,/\.setData\s*\(/g,/\.removeLayer\s*\(/g,/\.removeSource\s*\(/g]) {
  let m;
  while ((m = re.exec(s))) {
    const c = clip(m.index,700,1800);
    if (/water/i.test(c)) calls.push(`${m[0]} @${m.index}`);
  }
}
list('MAP SOURCE/LAYER CALLS WITH WATER NEARBY', calls, 300);

// 3) Print bounded contexts around semantic anchors that exist in the current file.
contexts('MAPPED WATER PHRASES', /mapped[\s_-]*water|water[\s_-]*mask|no[\s_-]*build[^\n]{0,80}water|water[^\n]{0,80}no[\s_-]*build/gi, 18);
contexts('WATER AUDIT PHRASES', /water[^\n]{0,100}audit|audit[^\n]{0,100}water/gi, 18);
contexts('WATER LAYER OR SOURCE STRINGS', /['"`][^'"`\n]{0,80}water[^'"`\n]{0,80}['"`]/gi, 24);
contexts('ADD SOURCE/LAYER NEAR WATER', /(?:addSource|addLayer)\s*\([^\n]{0,240}water|water[^\n]{0,240}(?:addSource|addLayer)\s*\(/gi, 20, 1400, 3200);
contexts('SETDATA NEAR WATER', /setData\s*\([^\n]{0,240}water|water[^\n]{0,240}setData\s*\(/gi, 20, 1400, 3200);
contexts('WATER FEATURE FILTERING', /filter\s*\([^\n]{0,220}water|water[^\n]{0,220}filter\s*\(/gi, 20, 1400, 3200);

// 4) Locate current Regional publication / audit neighborhoods and their water references.
contexts('REGIONAL DISPLAY/PUBLICATION + WATER', /regional[^\n]{0,220}(?:display|publish|render)[^\n]{0,220}water|water[^\n]{0,220}regional[^\n]{0,220}(?:display|publish|render)/gi, 20, 1600, 3600);
contexts('REGIONAL WATER GENERIC', /regional[^\n]{0,140}water|water[^\n]{0,140}regional/gi, 24, 1200, 2800);

// 5) Explicitly report historical names so absence is evidence, not silent failure.
for (const needle of ['addWaterLayer','removeWaterLayer','earthline-regional-water','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','earthlineRenderRegionalOverlay16020','waterPaths','directionArrows','flowFeatures','pointAllowed']) {
  const i=s.indexOf(needle);
  console.log(`\n===== HISTORICAL NEEDLE ${needle} @${i} =====`);
  if(i>=0) console.log(clip(i,1000,2600));
}
