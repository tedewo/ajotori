const DEFAULT_EXCLUDED_KEYS = new Set([
  'category',
  'subcategory',
  'category_slug',
  'subcategory_slug',
  'title',
  'brand',
  'model',
  'year',
  'price',
  'description',
  'homepage_description',
  'region',
  'municipality',
  'seller_type',
  'external_listing_url',
  'status',
  'images',
  'image',
  'province',
  'phone',
  'email',
  'details',
  'features',
  'searchTags',
  'powerEquivalent',
  'location',
  'contact',
]);

const MASS_FIELD_KEYS = new Set(['curbWeight', 'totalWeight', 'maxTrailerWeight']);

function isValidPositiveNumber(value: unknown): boolean {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  if (typeof value === 'string' && !value.trim()) return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

function parseMassValue(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
}

export function buildTechnicalData(
  payload: Record<string, unknown>,
  options: { existing?: Record<string, unknown>; allowedKeys?: Set<string> } = {},
) {
  const technicalData = { ...options.existing };

  for (const [key, value] of Object.entries(payload)) {
    if (DEFAULT_EXCLUDED_KEYS.has(key) || (options.allowedKeys && !options.allowedKeys.has(key))) continue;
    if (value === null || value === undefined || value === '') {
      if (options.allowedKeys) delete technicalData[key];
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      if (options.allowedKeys) delete technicalData[key];
      continue;
    }
    if (key === 'registrationType' && payload.registered !== 'Kyllä') {
      if (options.allowedKeys) delete technicalData[key];
      continue;
    }

    if (key === 'maxPassengers') {
      const passengerCount = parseMassValue(value);
      if (passengerCount === null || passengerCount <= 0) {
        if (options.allowedKeys) delete technicalData[key];
        continue;
      }
      technicalData[key] = passengerCount;
      continue;
    }

    if (MASS_FIELD_KEYS.has(key)) {
      const massValue = parseMassValue(value);
      if (massValue === null || (key !== 'maxTrailerWeight' && massValue === 0)) {
        if (options.allowedKeys) delete technicalData[key];
        continue;
      }
      technicalData[key] = massValue;
      continue;
    }

    if (key === 'powerUnit') {
      if (!isValidPositiveNumber(payload.power) || (value !== 'hv' && value !== 'kW')) {
        if (options.allowedKeys) delete technicalData[key];
        continue;
      }
    }

    technicalData[key] = value;
  }

  return technicalData;
}
