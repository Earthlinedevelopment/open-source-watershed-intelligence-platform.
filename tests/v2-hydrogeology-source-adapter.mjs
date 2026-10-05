import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../v2/hydrogeology-source-adapter.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

const pa = {
  HR_Type: 'PA',
  HR_Name: 'Biscayne aquifer',
  HR_Code: 'N400BISCYN',
  HR_ID: 'P51',
  HR_Litholo: 'Carbonate-rock aquifers'
};
const shr = {
  HR_Type: 'SHR',
  HR_Name: 'Northern Appalachian Mtns-X',
  HR_Code: 'example',
  HR_ID: 'S60',
  HR_Litholo: 'Crystalline'
};

assert.equal(mod.classifyHydrogeologicRegion(pa), 'principal_aquifer');
assert.equal(mod.classifyHydrogeologicRegion(shr), 'secondary_hydrogeologic_region');
assert.equal(mod.validateHydrogeologicRegionProperties(pa).valid, true);
assert.equal(mod.validateHydrogeologicRegionProperties(shr).valid, true);

const malformed = { ...shr, HR_Type: 'OTHER' };
assert.equal(mod.classifyHydrogeologicRegion(malformed), 'hydrogeologic_region');
assert.equal(mod.validateHydrogeologicRegionProperties(malformed).valid, false);

const feature = mod.normalizeHydrogeologicRegionFeature({
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [] },
  properties: shr
});
assert.equal(feature.properties.earthline_context_class, 'secondary_hydrogeologic_region');
assert.equal(feature.properties.earthline_source_schema_valid, true);
assert.equal(feature.properties.earthline_source_type, 'SHR');
assert.equal(feature.properties.name, shr.HR_Name);

console.log('Earthline V2 hydrogeology adapter: PASS');
