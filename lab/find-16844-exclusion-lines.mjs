import fs from 'node:fs';

const text = fs.readFileSync('index.html', 'utf8');
const lines = text.split(/\r?\n/);
const needles = [
  'earthlineCollectParcelInfrastructure15862P',
  'overpass-api.de',
  'all-attempted-open-data-exclusion-sources-failed',
  'openDataSources16539',
  'mapboxTilequery16516',
  'arcgisRoads16516',
  'arcgisBuildings16516',
  'osmExport16516'
];
for (const needle of needles) {
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(needle)) matches.push(i + 1);
  }
  console.log(`${needle}: ${matches.length ? matches.join(',') : 'NONE'}`);
}
