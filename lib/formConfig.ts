import { SUBCATEGORY_SLUGS } from './categories';

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'textarea'
  | 'image'
  | 'location'
  | 'contact'
  | 'brand'
  | 'model';

export const TRANSMISSION_OPTIONS = ['Manuaali', 'Automaatti', 'Puoliautomaatti', 'Powershift', 'CVT', 'Hydrostaattinen', 'Muu'];
export const FUEL_OPTIONS = ['Diesel', 'Bensiini', 'Sähkö', 'Hybridi', 'Kaasu', 'Etanoli', 'Vety', 'Muu'];
export const POWER_UNIT_OPTIONS = ['kW', 'hv'];
export const DRIVETRAIN_OPTIONS = ['Etuveto', 'Takaveto', 'Neliveto', 'Muu'];
export const BOOM_TYPE_OPTIONS = ['Yksiosainen puomi', 'Kaksiosainen puomi', 'Kolmiosainen puomi', 'Muu'];
export const TRAILER_TYPE_OPTIONS = ['Kevyt perävaunu', 'Jarruton perävaunu', 'Jarrullinen perävaunu', 'Kippiperävaunu', 'Lavetti', 'Venetraileri', 'Autotraileri', 'Asuntovaunu', 'Muu'];
export const ATV_TYPE_OPTIONS = ['Maastomönkijä', 'Crossimönkijä', 'UTV', 'Työmönkijä', 'Muu'];
export const ATV_REGISTRATION_TYPE_OPTIONS = ['Traktorimönkijä', 'Tieliikennemönkijä', 'Mopomönkijä'];
export const MOTORCYCLE_TYPE_OPTIONS = ['Kevyt moottoripyörä', 'Crossi', 'Enduro', 'Motocross', 'Supermoto', 'Katu', 'Matka', 'Adventure', 'Custom', 'Muu'];
export const SNOWMOBILE_TYPE_OPTIONS = ['Touring', 'Sport', 'Crossover', 'Mountain', 'Työkelkka', 'Lasten / nuorten kelkka', 'Muu'];
export const ENGINE_SIZE_OPTIONS = Array.from({ length: 1000 }, (_, index) => {
  const size = ((index + 1) / 10).toFixed(1);
  return `${size} l`;
});

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  note?: string;
};

export type Section = {
  key: string;
  title: string;
  fields: Field[];
};

export type FormConfig = {
  slug: string;
  title: string;
  sections: Section[];
};

const COMMON_MOTOR_VEHICLE_FIELDS: Field[] = [
  { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS },
  { key: 'drivetrain', label: 'Vetotapa', type: 'select', options: DRIVETRAIN_OPTIONS },
  { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS },
  { key: 'power', label: 'Teho', type: 'number' },
];

const COMMON_ENGINE_VEHICLE_FIELDS: Field[] = [
  { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS },
  ...COMMON_MOTOR_VEHICLE_FIELDS,
];

const COMMON_MASS_FIELDS: Field[] = [
  { key: 'curbWeight', label: 'Omamassa (kg)', type: 'number' },
  { key: 'totalWeight', label: 'Kokonaismassa (kg)', type: 'number' },
  { key: 'maxTrailerWeight', label: 'Suurin sallittu perävaunumassa (kg)', type: 'number' },
];

const RAW_FORM_CONFIGS: FormConfig[] = [
  {
    slug: SUBCATEGORY_SLUGS.pakettiautot,
    title: 'Pakettiauto',
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'brand', label: 'Merkki', type: 'brand', required: true, placeholder: 'esim. Volkswagen' },
          { key: 'model', label: 'Malli', type: 'model', required: true, placeholder: 'Esim. Hiace' },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number', required: true },
        ],
      },
      {
        key: 'technical',
        title: 'Tekniset tiedot',
        fields: [
          { key: 'mileage', label: 'Ajomäärä (km)', type: 'number' },
          { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS },
          { key: 'drivetrain', label: 'Vetotapa', type: 'select', options: DRIVETRAIN_OPTIONS },
          { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS },
          { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS },
          { key: 'power', label: 'Teho', type: 'number' },
          { key: 'payload', label: 'Kantavuus (kg)', type: 'number' },
          { key: 'totalWeight', label: 'Kokonaismassa (kg)', type: 'number' },
          { key: 'doorCount', label: 'Ovien määrä', type: 'number' },
          { key: 'seatingCapacity', label: 'Istumapaikat', type: 'number' },
        ],
      },
      {
        key: 'appearance',
        title: 'Ulkonäkö',
        fields: [
          { key: 'color', label: 'Väri', type: 'text' },
          { key: 'interiorColor', label: 'Sisustan väri (valinnainen)', type: 'text' },
          { key: 'interiorMaterial', label: 'Sisustan materiaali (valinnainen)', type: 'text' },
        ],
      },
      {
        key: 'features',
        title: 'Varusteet',
        fields: [
          { key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Ilmastointi', 'Vetokoukku'] },
        ],
      },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: SUBCATEGORY_SLUGS.henkiloautot,
    title: 'Henkilöauto',
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'brand', label: 'Merkki', type: 'brand', required: true, placeholder: 'esim. Toyota' },
          { key: 'model', label: 'Malli', type: 'model' },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number' },
        ],
      },
      {
        key: 'technical',
        title: 'Tekniset tiedot',
        fields: [
          { key: 'mileage', label: 'Ajomäärä (km)', type: 'number' },
          { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS },
          { key: 'drivetrain', label: 'Vetotapa', type: 'select', options: DRIVETRAIN_OPTIONS },
          { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS },
          { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS },
          { key: 'power', label: 'Teho', type: 'number' },
          { key: 'doorCount', label: 'Ovien määrä', type: 'number' },
          { key: 'seatingCapacity', label: 'Istumapaikat', type: 'number' },
        ],
      },
      { key: 'appearance', title: 'Ulkonäkö', fields: [
          { key: 'color', label: 'Väri', type: 'text' },
          { key: 'interiorColor', label: 'Sisustan väri (valinnainen)', type: 'text' },
          { key: 'interiorMaterial', label: 'Sisustan materiaali (valinnainen)', type: 'text' },
        ], },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Ilmastointi', 'Vetokoukku'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: SUBCATEGORY_SLUGS.traktorit,
    title: 'Traktori',
    sections: [
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'brand', label: 'Merkki', type: 'brand', required: true }, { key: 'model', label: 'Malli', type: 'model' }, { key: 'year', label: 'Vuosimalli', type: 'number' }, { key: 'price', label: 'Hinta (€)', type: 'number', required: true }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'drivetrain', label: 'Vetotapa', type: 'select', options: DRIVETRAIN_OPTIONS }, { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS }, { key: 'frontLoader', label: 'Etukuormain', type: 'checkbox' }, { key: 'frontLoaderAttachment', label: 'Etunostolaite', type: 'checkbox' }, { key: 'weight', label: 'Paino (kg)', type: 'number' }, { key: 'attachments', label: 'Ulosotot', type: 'text' }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Etukuormain', 'Ilmastointi'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: SUBCATEGORY_SLUGS.kaivinkoneet,
    title: 'Kaivinkone',
    sections: [
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'brand', label: 'Merkki', type: 'brand' }, { key: 'model', label: 'Malli', type: 'model' }, { key: 'year', label: 'Vuosimalli', type: 'number' }, { key: 'price', label: 'Hinta (€)', type: 'number' }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'tareWeight', label: 'Käyttöpaino (kg)', type: 'number' }, { key: 'boomType', label: 'Puomin tyyppi', type: 'select', options: BOOM_TYPE_OPTIONS }, { key: 'bucketCount', label: 'Kauhojen määrä', type: 'number' }, { key: 'quickCoupler', label: 'Pikakiinnike', type: 'checkbox' }, { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Lisäkoukku', 'Ilmastointi'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: SUBCATEGORY_SLUGS.veneet,
    title: 'Vene',
    sections: [
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'brand', label: 'Merkki', type: 'brand', required: true, placeholder: 'esim. Buster' }, { key: 'model', label: 'Malli', type: 'model' }, { key: 'year', label: 'Vuosimalli', type: 'number' }, { key: 'price', label: 'Hinta (€)', type: 'number', required: true }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'boatType', label: 'Veneen tyyppi', type: 'select', options: ['Soutuvene', 'Moottorivene', 'Pulpettivene', 'HT-vene', 'Bowrider', 'Cabin / hyttivene', 'Matkavene', 'Purjevene', 'Kumivene', 'Muu'] }, { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS }, { key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'maxPassengers', label: 'Suurin sallittu henkilömäärä', type: 'number' }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  createMachineFormConfig(SUBCATEGORY_SLUGS.puimurit, 'Puimuri'),
  createMachineFormConfig(SUBCATEGORY_SLUGS.metsatraktorit, 'Metsätraktori'),
  createMachineFormConfig(SUBCATEGORY_SLUGS.harvesterit, 'Harvesteri'),
  createMachineFormConfig(SUBCATEGORY_SLUGS.muutmaatalouskoneet, 'Muu maatalouskone'),
  createMachineFormConfig(SUBCATEGORY_SLUGS.muutmetsakoneet, 'Muu metsäkone'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.matkailuautot, 'Matkailuauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.lavaautot, 'Lava-auto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kevyetkuormaautot, 'Kevyt kuorma-auto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.autonperavaunut, 'Auton perävaunu', [{ key: 'trailerType', label: 'Trailerin tyyppi', type: 'select', options: TRAILER_TYPE_OPTIONS }]),
  createBasicFormConfig(SUBCATEGORY_SLUGS.mopoautot, 'Mopoauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.moottoripyorat, 'Moottoripyörä', [...COMMON_ENGINE_VEHICLE_FIELDS, { key: 'motorcycleType', label: 'Moottoripyörän tyyppi', type: 'select', options: MOTORCYCLE_TYPE_OPTIONS }]),
  createBasicFormConfig(SUBCATEGORY_SLUGS.mopot, 'Mopo', COMMON_MOTOR_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.skootterit, 'Skootteri', COMMON_MOTOR_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.monkijat, 'Mönkijä', [...COMMON_ENGINE_VEHICLE_FIELDS, { key: 'vehicleType', label: 'Ajoneuvon tyyppi', type: 'select', options: ATV_TYPE_OPTIONS }]),
  createBasicFormConfig(SUBCATEGORY_SLUGS.moottorikelkat, 'Moottorikelkka', [...COMMON_ENGINE_VEHICLE_FIELDS, { key: 'snowmobileType', label: 'Moottorikelkan tyyppi', type: 'select', options: SNOWMOBILE_TYPE_OPTIONS }]),
  createBasicFormConfig(SUBCATEGORY_SLUGS.ruohonleikkurit, 'Ruohonleikkuri'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutpienkoneet, 'Muu pienkone'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.pienkoneidenperavaunut, 'Pienkoneen perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.traktorinlisalaitteet, 'Traktorin lisälaite'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.traktorinperavaunut, 'Traktorin perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kurrottajat, 'Kurottaja'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.pyorakuormaajat, 'Pyöräkuormaaja'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.tienhoito, 'Tienhoitokalusto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.nosturit, 'Nosturi'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutmaanrakennuslaitteet, 'Muu maanrakennuslaite'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.maanrakennuslaitteidenperavaunut, 'Maanrakennuslaitteen perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.lavakuljetus, 'Lavakuljetusauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.lavetit, 'Lavetti'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.puukuljetus, 'Puukuljetusauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.maansiirto, 'Maansiirtoauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kappaletavara, 'Kappaletavara-auto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kylmakuljetus, 'Kylmäkuljetusauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.hinaus, 'Hinausauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.veturit, 'Vetoauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.linjaautot, 'Linja-auto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muukuljetuskalusto, 'Muu kuljetuskalusto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.raskaatperavaunut, 'Raskas perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.trukit, 'Trukki'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutajoneuvot, 'Muu ajoneuvo'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutperavaunut, 'Muu perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.vesijetit, 'Vesijetti', [
    { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS },
    { key: 'power', label: 'Teho', type: 'number' },
    { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS },
    { key: 'hours', label: 'Käyttötunnit', type: 'number' },
  ]),
];

function addCommonMassFields(config: FormConfig): FormConfig {
  const technicalSectionIndex = config.sections.findIndex((section) => section.key === 'technical');
  const sections = [...config.sections];

  if (technicalSectionIndex >= 0) {
    const technicalSection = sections[technicalSectionIndex];
    const existingKeys = new Set(technicalSection.fields.map((field) => field.key));
    sections[technicalSectionIndex] = {
      ...technicalSection,
      fields: [...technicalSection.fields, ...getCommonMassFields(config).filter((field) => !existingKeys.has(field.key))],
    };
  } else {
    const detailsIndex = sections.findIndex((section) => section.key === 'details');
    sections.splice(detailsIndex >= 0 ? detailsIndex : sections.length, 0, {
      key: 'technical',
      title: 'Tekniset tiedot',
      fields: getCommonMassFields(config),
    });
  }

  return { ...config, sections };
}

function getCommonMassFields(config: FormConfig): Field[] {
  if (config.slug === SUBCATEGORY_SLUGS.vesijetit) return [];
  if (config.slug === SUBCATEGORY_SLUGS.veneet) return COMMON_MASS_FIELDS.filter((field) => field.key !== 'maxTrailerWeight');
  return COMMON_MASS_FIELDS;
}

const EQUIPMENT_OPTIONS: Record<string, string[]> = {
  [SUBCATEGORY_SLUGS.autonperavaunut]: ['Kuomu'],
  [SUBCATEGORY_SLUGS.monkijat]: ['Vinssi', 'Puskulevy', 'Telasarja'],
  [SUBCATEGORY_SLUGS.moottoripyorat]: ['ABS-jarrut', 'Lämmitettävät kahvat', 'Tuulilasi'],
  [SUBCATEGORY_SLUGS.mopot]: ['Tavarateline', 'Tuulilasi', 'Lukkiutumattomat jarrut'],
  [SUBCATEGORY_SLUGS.skootterit]: ['Tavaratila', 'Tuulilasi', 'Tavarateline'],
  [SUBCATEGORY_SLUGS.moottorikelkat]: ['Kahvanlämmittimet', 'Peruutusvaihde', 'Penkinlämmitys'],
  [SUBCATEGORY_SLUGS.ruohonleikkurit]: ['Kerääjä', 'Silppuri', 'Peräkärry'],
  [SUBCATEGORY_SLUGS.muutpienkoneet]: ['Työvalot', 'Sähkökäynnistys'],
  [SUBCATEGORY_SLUGS.pienkoneidenperavaunut]: ['Kuomu', 'Tukijalat'],
  [SUBCATEGORY_SLUGS.veneet]: ['Kaikuluotain'],
  [SUBCATEGORY_SLUGS.vesijetit]: ['Kaikuluotain'],
  [SUBCATEGORY_SLUGS.trukit]: ['Sivusiirto', 'Työvalot', 'Laturi'],
  [SUBCATEGORY_SLUGS.muutajoneuvot]: ['Lisävalot', 'Työkalulaatikko'],
  [SUBCATEGORY_SLUGS.muutperavaunut]: ['Kuomu', 'Tukijalat'],
};

const HEAVY_VEHICLE_SLUGS: string[] = [
  SUBCATEGORY_SLUGS.lavakuljetus,
  SUBCATEGORY_SLUGS.lavetit,
  SUBCATEGORY_SLUGS.puukuljetus,
  SUBCATEGORY_SLUGS.maansiirto,
  SUBCATEGORY_SLUGS.kappaletavara,
  SUBCATEGORY_SLUGS.kylmakuljetus,
  SUBCATEGORY_SLUGS.hinaus,
  SUBCATEGORY_SLUGS.veturit,
  SUBCATEGORY_SLUGS.linjaautot,
  SUBCATEGORY_SLUGS.muukuljetuskalusto,
  SUBCATEGORY_SLUGS.raskaatperavaunut,
];

const AGRICULTURAL_SLUGS: string[] = [
  SUBCATEGORY_SLUGS.traktorit,
  SUBCATEGORY_SLUGS.puimurit,
  SUBCATEGORY_SLUGS.muutmaatalouskoneet,
  SUBCATEGORY_SLUGS.traktorinlisalaitteet,
  SUBCATEGORY_SLUGS.traktorinperavaunut,
];

const FORESTRY_SLUGS: string[] = [SUBCATEGORY_SLUGS.metsatraktorit, SUBCATEGORY_SLUGS.harvesterit, SUBCATEGORY_SLUGS.muutmetsakoneet];
const SMALL_MACHINE_SLUGS = new Set<string>([
  SUBCATEGORY_SLUGS.moottoripyorat,
  SUBCATEGORY_SLUGS.mopot,
  SUBCATEGORY_SLUGS.skootterit,
  SUBCATEGORY_SLUGS.monkijat,
  SUBCATEGORY_SLUGS.moottorikelkat,
  SUBCATEGORY_SLUGS.ruohonleikkurit,
  SUBCATEGORY_SLUGS.muutpienkoneet,
  SUBCATEGORY_SLUGS.pienkoneidenperavaunut,
]);

function getBrandPlaceholder(slug: string): string | undefined {
  if (slug === SUBCATEGORY_SLUGS.henkiloautot || slug === SUBCATEGORY_SLUGS.muutajoneuvot) return 'esim. Toyota';
  if (slug === SUBCATEGORY_SLUGS.pakettiautot) return 'esim. Volkswagen';
  if (slug === SUBCATEGORY_SLUGS.autonperavaunut) return 'esim. Juhta';
  if (slug === SUBCATEGORY_SLUGS.kevyetkuormaautot) return 'esim. Mercedes-Benz';
  if (slug === SUBCATEGORY_SLUGS.lavaautot) return 'esim. Iveco';
  if (slug === SUBCATEGORY_SLUGS.matkailuautot) return 'esim. Fiat';
  if (slug === SUBCATEGORY_SLUGS.mopoautot) return 'esim. Aixam';
  if (slug === SUBCATEGORY_SLUGS.vesijetit) return 'esim. Yamaha';
  if (slug === SUBCATEGORY_SLUGS.veneet) return 'esim. Buster';
  if (slug === SUBCATEGORY_SLUGS.trukit) return 'esim. Jungheinrich';
  if (slug === SUBCATEGORY_SLUGS.muutperavaunut) return 'esim. Aku';
  if (HEAVY_VEHICLE_SLUGS.includes(slug)) return 'esim. Scania';
  if (AGRICULTURAL_SLUGS.includes(slug)) return 'esim. Valtra';
  if (FORESTRY_SLUGS.includes(slug)) return 'esim. Ponsse';
  if (SMALL_MACHINE_SLUGS.has(slug)) return 'esim. Yamaha';
  return undefined;
}

function addCategoryFormFields(config: FormConfig): FormConfig {
  const sections = config.sections.map((section) => ({ ...section, fields: [...section.fields] }));
  const brandPlaceholder = getBrandPlaceholder(config.slug);
  const basicIndex = sections.findIndex((section) => section.key === 'basic');
  const technicalIndex = sections.findIndex((section) => section.key === 'technical');

  if (brandPlaceholder && basicIndex >= 0) {
    sections[basicIndex].fields = sections[basicIndex].fields.map((field) => field.key === 'brand' ? { ...field, placeholder: brandPlaceholder } : field);
  }
  if (config.slug === SUBCATEGORY_SLUGS.monkijat && basicIndex >= 0) {
    sections[basicIndex].fields.push({ key: 'registered', label: 'Rekisteröity', type: 'select', options: ['Ei', 'Kyllä'] });
    sections[basicIndex].fields.push({ key: 'registrationType', label: 'Rekisteröintityyppi', type: 'select', options: ATV_REGISTRATION_TYPE_OPTIONS });
  }

  const equipmentOptions = EQUIPMENT_OPTIONS[config.slug] ?? (HEAVY_VEHICLE_SLUGS.includes(config.slug) ? ['Ilmastointi', 'Perälautanostin', 'Lisävalot'] : undefined);
  if (equipmentOptions && !sections.some((section) => section.key === 'features')) {
    const detailsIndex = sections.findIndex((section) => section.key === 'details');
    sections.splice(detailsIndex >= 0 ? detailsIndex : sections.length, 0, {
      key: 'features',
      title: 'Varusteet',
      fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: equipmentOptions }],
    });
  }

  return { ...config, sections };
}

function createMachineFormConfig(slug: string, title: string): FormConfig {
  return {
    slug,
    title,
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'brand', label: 'Merkki', type: 'brand' },
          { key: 'model', label: 'Malli', type: 'model' },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number' },
        ],
      },
      {
        key: 'technical',
        title: 'Tekniset tiedot',
        fields: [
          { key: 'hours', label: 'Käyttötunnit', type: 'number' },
          { key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS },
          { key: 'power', label: 'Teho', type: 'number' },
          { key: 'transmission', label: 'Vaihteisto', type: 'select', options: TRANSMISSION_OPTIONS },
          { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS },
        ],
      },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  };
}

function createBasicFormConfig(slug: string, title: string, technicalFields: Field[] = []): FormConfig {
  return {
    slug,
    title,
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'brand', label: 'Merkki / valmistaja', type: 'brand' },
          { key: 'model', label: 'Malli / tuotteen nimi', type: 'model', required: true },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number', required: true },
        ],
      },
      ...(technicalFields.length > 0
        ? [{ key: 'technical', title: 'Tekniset tiedot', fields: technicalFields }]
        : []),
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  };
}

export const FORM_CONFIGS: FormConfig[] = RAW_FORM_CONFIGS.map(addCommonMassFields).map(addCategoryFormFields);

export function getFormConfigBySlug(slug: string) {
  return FORM_CONFIGS.find((f) => f.slug === slug) ?? null;
}
