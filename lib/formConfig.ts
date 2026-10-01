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

export const FORM_CONFIGS: FormConfig[] = [
  {
    slug: SUBCATEGORY_SLUGS.pakettiautot,
    title: 'Pakettiauto',
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'brand', label: 'Merkki', type: 'brand', required: true, placeholder: 'Esim. Toyota' },
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
          { key: 'brand', label: 'Merkki', type: 'brand', required: true },
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
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'brand', label: 'Merkki', type: 'brand', required: true }, { key: 'model', label: 'Malli', type: 'model' }, { key: 'year', label: 'Vuosimalli', type: 'number' }, { key: 'price', label: 'Hinta (€)', type: 'number', required: true }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'engineSize', label: 'Moottorin koko', type: 'select', options: ENGINE_SIZE_OPTIONS }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: FUEL_OPTIONS }, { key: 'hours', label: 'Käyttötunnit', type: 'number' }] },
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
  createBasicFormConfig(SUBCATEGORY_SLUGS.autonperavaunut, 'Auton perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.mopoautot, 'Mopoauto', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.moottoripyorat, 'Moottoripyörä', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.mopot, 'Mopo', COMMON_MOTOR_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.skootterit, 'Skootteri', COMMON_MOTOR_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.monkijat, 'Mönkijä', COMMON_ENGINE_VEHICLE_FIELDS),
  createBasicFormConfig(SUBCATEGORY_SLUGS.moottorikelkat, 'Moottorikelkka', COMMON_ENGINE_VEHICLE_FIELDS),
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
  createBasicFormConfig(SUBCATEGORY_SLUGS.lavakuljetus, 'Lavakuljetusauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.lavetit, 'Lavetti'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.puukuljetus, 'Puukuljetusauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.maansiirto, 'Maansiirtoauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kappaletavara, 'Kappaletavara-auto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.kylmakuljetus, 'Kylmäkuljetusauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.hinaus, 'Hinausauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.veturit, 'Vetoauto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.linjaautot, 'Linja-auto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muukuljetuskalusto, 'Muu kuljetuskalusto'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.raskaatperavaunut, 'Raskas perävaunu'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.trukit, 'Trukki'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutajoneuvot, 'Muu ajoneuvo'),
  createBasicFormConfig(SUBCATEGORY_SLUGS.muutperavaunut, 'Muu perävaunu'),
];

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
          { key: 'brand', label: 'Merkki / valmistaja', type: 'brand', placeholder: 'Esim. Toyota' },
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

export function getFormConfigBySlug(slug: string) {
  return FORM_CONFIGS.find((f) => f.slug === slug) ?? null;
}
