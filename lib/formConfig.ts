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
  | 'contact';

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

// Minimal configs for example vehicle types. Add new configs to support other types.
export const FORM_CONFIGS: FormConfig[] = [
  {
    slug: 'pakettiauto',
    title: 'Pakettiauto',
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'title', label: 'Otsikko', type: 'text', required: true, placeholder: 'Esim. Ford Transit 2020' },
          { key: 'brand', label: 'Merkki', type: 'text', required: true },
          { key: 'model', label: 'Malli', type: 'text', required: true },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number', required: true },
        ],
      },
      {
        key: 'technical',
        title: 'Tekniset tiedot',
        fields: [
          { key: 'mileage', label: 'Ajomäärä', type: 'number' },
          { key: 'mileageUnit', label: 'KM / H', type: 'radio', options: ['km', 'h'] },
          { key: 'transmission', label: 'Vaihteisto', type: 'text' },
          { key: 'drivetrain', label: 'Vetotapa', type: 'text' },
          { key: 'fuel', label: 'Käyttövoima', type: 'text' },
          { key: 'engineSize', label: 'Moottorin koko', type: 'text' },
          { key: 'power', label: 'Teho', type: 'number' },
          { key: 'payload', label: 'Kantavuus', type: 'text' },
        ],
      },
      {
        key: 'appearance',
        title: 'Ulkonäkö',
        fields: [
          { key: 'color', label: 'Väri', type: 'text' },
          { key: 'interiorColor', label: 'Sisustan väri', type: 'text' },
          { key: 'interiorMaterial', label: 'Sisustan materiaali', type: 'text' },
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

  // plural alias to match categories subcategory slug
  {
    slug: 'pakettiautot',
    title: 'Pakettiautot',
    sections: [],
  },

  {
    slug: 'henkiloauto',
    title: 'Henkilöauto',
    sections: [
      {
        key: 'basic',
        title: 'Perustiedot',
        fields: [
          { key: 'title', label: 'Otsikko', type: 'text', required: true },
          { key: 'brand', label: 'Merkki', type: 'text', required: true },
          { key: 'model', label: 'Malli', type: 'text' },
          { key: 'year', label: 'Vuosimalli', type: 'number' },
          { key: 'price', label: 'Hinta (€)', type: 'number' },
        ],
      },
      {
        key: 'technical',
        title: 'Tekniset tiedot',
        fields: [
          { key: 'mileage', label: 'Ajomäärä', type: 'number' },
          { key: 'mileageUnit', label: 'KM / H', type: 'radio', options: ['km', 'h'] },
          { key: 'transmission', label: 'Vaihteisto', type: 'text' },
          { key: 'drivetrain', label: 'Vetotapa', type: 'text' },
          { key: 'fuel', label: 'Käyttövoima', type: 'text' },
          { key: 'engineSize', label: 'Moottorin koko', type: 'text' },
        ],
      },
      { key: 'appearance', title: 'Ulkonäkö', fields: [{ key: 'color', label: 'Väri', type: 'text' }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Ilmastointi', 'Vetokoukku'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: 'henkiloautot',
    title: 'Henkilöautot',
    sections: [],
  },

  {
    slug: 'traktori',
    title: 'Traktori',
    sections: [
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'title', label: 'Otsikko', type: 'text' }, { key: 'price', label: 'Hinta (€)', type: 'number' }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'drivetrain', label: 'Vetotapa', type: 'text' }, { key: 'frontLoader', label: 'Etukuormain', type: 'checkbox' }, { key: 'weight', label: 'Paino', type: 'text' }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Etukuormain', 'Ilmastointi'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: 'traktorit',
    title: 'Traktorit',
    sections: [],
  },

  {
    slug: 'kaivinkone',
    title: 'Kaivinkone',
    sections: [
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'title', label: 'Otsikko', type: 'text' }, { key: 'price', label: 'Hinta (€)', type: 'number' }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'tareWeight', label: 'Työpaino', type: 'text' }, { key: 'boomLength', label: 'Puomin pituus', type: 'text' }, { key: 'trackType', label: 'Telat', type: 'select', options: ['Kumitelat', 'Terästelat'] }, { key: 'power', label: 'Teho', type: 'number' }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Lisäkoukku', 'Ilmastointi'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },

  {
    slug: 'kaivinkoneet',
    title: 'Kaivinkoneet',
    sections: [],
  },
];

export function getFormConfigBySlug(slug: string) {
  return FORM_CONFIGS.find((f) => f.slug === slug) ?? null;
}
