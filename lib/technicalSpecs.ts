const LABELS: Record<string, string> = {
  year: 'Vuosimalli',
  modelyear: 'Vuosimalli',
  mileage: 'Ajokilometrit',
  odometer: 'Ajokilometrit',
  power: 'Teho',
  horsepower: 'Teho',
  enginesize: 'Iskutilavuus',
  displacement: 'Iskutilavuus',
  transmission: 'Vaihteisto',
  powertrain: 'Vaihteisto',
  fuel: 'Käyttövoima',
  powersource: 'Käyttövoima',
  drivetrain: 'Vetotapa',
  payload: 'Kantavuus',
  curbweight: 'Omamassa (kg)',
  totalweight: 'Kokonaismassa (kg)',
  maxtrailerweight: 'Suurin sallittu perävaunumassa (kg)',
  doorcount: 'Ovien määrä',
  seatingcapacity: 'Istumapaikat',
  color: 'Väri',
  interiorcolor: 'Sisustan väri',
  interiormaterial: 'Sisustan materiaali',
  hours: 'Käyttötunnit',
  frontloader: 'Etukuormain',
  frontloaderattachment: 'Etunostolaite',
  weight: 'Paino',
  attachments: 'Ulosotot',
  tareweight: 'Käyttöpaino',
  boomtype: 'Puomin tyyppi',
  bucketcount: 'Kauhojen määrä',
  quickcoupler: 'Pikakiinnike',
  trailertype: 'Trailerin tyyppi',
  vehicletype: 'Ajoneuvon tyyppi',
  registered: 'Rekisteröity',
  registrationtype: 'Rekisteröintityyppi',
  motorcycletype: 'Moottoripyörän tyyppi',
  snowmobiletype: 'Moottorikelkan tyyppi',
  boattype: 'Veneen tyyppi',
  maxpassengers: 'Suurin sallittu henkilömäärä',
};

const VALUES: Record<string, string> = {
  manual: 'Manuaali',
  manuale: 'Manuaali',
  manualinen: 'Manuaali',
  automatic: 'Automaatti',
  automatico: 'Automaatti',
  automaattinen: 'Automaatti',
  semiautomatic: 'Puoliautomaatti',
  'semi-automatic': 'Puoliautomaatti',
  diesel: 'Diesel',
  petrol: 'Bensiini',
  gasoline: 'Bensiini',
  gas: 'Kaasu',
  electric: 'Sähkö',
  electricity: 'Sähkö',
  hybrid: 'Hybridi',
  ethanol: 'Etanoli',
  hydrogen: 'Vety',
  'front-wheel drive': 'Etuveto',
  'rear-wheel drive': 'Takaveto',
  'four-wheel drive': 'Neliveto',
  'all-wheel drive': 'Neliveto',
  true: 'Kyllä',
  false: 'Ei',
};

const SUMMARY_LABELS: Record<'year' | 'mileage' | 'powerSource' | 'transmission', string> = {
  year: 'Vuosimalli',
  mileage: 'Ajokilometrit',
  powerSource: 'Käyttövoima',
  transmission: 'Vaihteisto',
};

function normalize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLocaleLowerCase('fi-FI')
    .replace(/[^a-z0-9åäö]+/gi, ' ')
    .trim();
}

function getLabel(key: string): string {
  const normalized = normalize(key);
  const compact = normalized.replace(/ /g, '');
  return LABELS[normalized] ?? LABELS[compact] ?? (normalized
    ? normalized.charAt(0).toLocaleUpperCase('fi-FI') + normalized.slice(1)
    : 'Muut tiedot');
}

export function formatTechnicalSpecValue(value: string): string {
  const trimmed = value.trim();
  const normalized = trimmed.toLocaleLowerCase('fi-FI');
  if (VALUES[normalized]) return VALUES[normalized];

  const separator = normalized.indexOf(' ');
  if (separator > 0 && VALUES[normalized.slice(0, separator)]) {
    const translated = VALUES[normalized.slice(0, separator)];
    return `${translated}${trimmed.slice(separator)}`;
  }

  return trimmed;
}

export function getTechnicalSpecEntries(
  technicalSpecs: Record<string, string>,
  summary: { year?: number; mileage?: number; powerSource?: string; transmission?: string },
): [string, string][] {
  const hiddenLabels = new Set(
    (Object.keys(SUMMARY_LABELS) as (keyof typeof SUMMARY_LABELS)[])
      .filter((key) => Boolean(summary[key]))
      .map((key) => normalize(SUMMARY_LABELS[key])),
  );
  const shownLabels = new Set<string>();

  return Object.entries(technicalSpecs).flatMap(([key, value]) => {
    if (!value.trim()) return [];
    if (normalize(key) === 'power unit') return [];

    const label = getLabel(key);
    const normalizedLabel = normalize(label);
    if (hiddenLabels.has(normalizedLabel) || shownLabels.has(normalizedLabel)) return [];

    shownLabels.add(normalizedLabel);
    if (normalize(key) === 'power') {
      const powerUnit = technicalSpecs.powerUnit?.trim();
      const knownUnit = powerUnit === 'hv' || powerUnit === 'kW' ? powerUnit : null;
      const valueHasUnit = /\b(?:hv|hp|kw)$/i.test(value.trim());
      const formattedPower = knownUnit
        ? `${value.trim()} ${knownUnit}`
        : valueHasUnit
          ? value.trim().replace(/\bhp$/i, 'hv').replace(/\bkw$/i, 'kW')
          : `${value.trim()} (yksikköä ei ilmoitettu)`;
      return [[label, formattedPower]];
    }

    return [[label, formatTechnicalSpecValue(value)]];
  });
}