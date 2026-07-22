const REGION_ALIASES = {
  'greater accra': 'Greater Accra',
  'greater accra region': 'Greater Accra',
  'ga': 'Greater Accra',
  'gt accra': 'Greater Accra',
  'gtr accra': 'Greater Accra',
  'accra': 'Greater Accra',
  'ashanti': 'Ashanti',
  'ashanti region': 'Ashanti',
  'as': 'Ashanti',
  'asante': 'Ashanti',
  'kumasi': 'Ashanti',
  'western': 'Western',
  'western region': 'Western',
  'we': 'Western',
  'western north': 'Western North',
  'western-north': 'Western North',
  'western north region': 'Western North',
  'wn': 'Western North',
  'central': 'Central',
  'central region': 'Central',
  'ce': 'Central',
  'eastern': 'Eastern',
  'eastern region': 'Eastern',
  'ea': 'Eastern',
  'volta': 'Volta',
  'volta region': 'Volta',
  'vo': 'Volta',
  'oti': 'Oti',
  'oti region': 'Oti',
  'ot': 'Oti',
  'bono': 'Bono',
  'bono region': 'Bono',
  'bo': 'Bono',
  'brong ahafo': 'Bono',
  'brong-ahafo': 'Bono',
  'bono east': 'Bono East',
  'bono-east': 'Bono East',
  'bono east region': 'Bono East',
  'be': 'Bono East',
  'ahafo': 'Ahafo',
  'ahafo region': 'Ahafo',
  'ah': 'Ahafo',
  'northern': 'Northern',
  'northern region': 'Northern',
  'no': 'Northern',
  'north': 'Northern',
  'savannah': 'Savannah',
  'savannah region': 'Savannah',
  'sa': 'Savannah',
  'savanna': 'Savannah',
  'north east': 'North East',
  'north-east': 'North East',
  'north east region': 'North East',
  'northeast': 'North East',
  'ne': 'North East',
  'upper east': 'Upper East',
  'upper-east': 'Upper East',
  'upper east region': 'Upper East',
  'ue': 'Upper East',
  'upper west': 'Upper West',
  'upper-west': 'Upper West',
  'upper west region': 'Upper West',
  'uw': 'Upper West',
};

const REGION_COLUMN_NAMES = [
  'region',
  'regions',
  'administrative_region',
  'admin_region',
  'area',
  'zone',
  'district',
  'location',
  'place',
  'geo',
  'regional',
  'admin1',
  'adm1',
];

export function normaliseRegionName(name) {
  if (!name || typeof name !== 'string') return null;
  const lower = name
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ');
  return REGION_ALIASES[lower] || null;
}

export function detectRegionColumn(headers) {
  if (!Array.isArray(headers)) return -1;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (REGION_COLUMN_NAMES.some((name) => h.includes(name))) return i;
  }
  return -1;
}

export function getColourScale(values, type = 'sequential') {
  const nums = values.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
  if (nums.length === 0) return () => '#E5E7EB';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }

  return function colourForValue(value) {
    if (value === null || value === undefined || isNaN(value)) return '#E5E7EB';
    const t = max === min ? 0.65 : (Number(value) - min) / range;

    if (type === 'sequential') {
      const from = hexToRgb('#E8F5EF');
      const to = hexToRgb('#004D2C');
      return rgbToHex(
        lerp(from[0], to[0], t),
        lerp(from[1], to[1], t),
        lerp(from[2], to[2], t)
      );
    }

    if (t < 0.5) {
      const from = hexToRgb('#DC2626');
      const mid = hexToRgb('#F9FAFB');
      const t2 = t * 2;
      return rgbToHex(
        lerp(from[0], mid[0], t2),
        lerp(from[1], mid[1], t2),
        lerp(from[2], mid[2], t2)
      );
    }

    const mid = hexToRgb('#F9FAFB');
    const to = hexToRgb('#006B3F');
    const t2 = (t - 0.5) * 2;
    return rgbToHex(
      lerp(mid[0], to[0], t2),
      lerp(mid[1], to[1], t2),
      lerp(mid[2], to[2], t2)
    );
  };
}

export function buildRegionDataMap(rows, regionColIdx, valueColIdx) {
  const result = {};
  for (const row of rows) {
    const rawRegion = row[regionColIdx];
    const rawValue = row[valueColIdx];
    const region = normaliseRegionName(rawRegion);
    if (!region) continue;
    const value = parseFloat(
      String(rawValue)
        .replace(/[,%]/g, '')
        .replace(/[^\d.-]/g, '')
        .trim()
    );
    if (!isNaN(value)) result[region] = value;
  }
  return result;
}
