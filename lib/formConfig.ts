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
          { key: 'mileage', label: 'Ajomäärä', type: 'number' },
          { key: 'mileageUnit', label: 'Mittayksikkö', type: 'select', options: ['Kilometrit', 'Käyttötunnit'] },
          { key: 'transmission', label: 'Vaihteisto', type: 'select', options: ['Manuaali', 'Automaatti', 'Puoliautomaatti', 'CVT', 'Muu'] },
          { key: 'drivetrain', label: 'Vetotapa', type: 'text' },
          { key: 'fuel', label: 'Käyttövoima', type: 'select', options: ['Diesel', 'Bensiini', 'Sähkö', 'Hybridi', 'Kaasu', 'Etanoli', 'Vety', 'Muu'] },
          { key: 'engineSize', label: 'Moottorin koko', type: 'text' },
          { key: 'power', label: 'Teho', type: 'number' },
          { key: 'payload', label: 'Kantavuus', type: 'text' },
          { key: 'totalWeight', label: 'Kokonaismassa', type: 'text' },
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
          { key: 'mileage', label: 'Ajomäärä', type: 'number' },
          { key: 'mileageUnit', label: 'Mittayksikkö', type: 'select', options: ['Kilometrit', 'Käyttötunnit'] },
          { key: 'transmission', label: 'Vaihteisto', type: 'select', options: ['Manuaali', 'Automaatti', 'Puoliautomaatti', 'CVT', 'Muu'] },
          { key: 'drivetrain', label: 'Vetotapa', type: 'text' },
          { key: 'fuel', label: 'Käyttövoima', type: 'select', options: ['Diesel', 'Bensiini', 'Sähkö', 'Hybridi', 'Kaasu', 'Etanoli', 'Vety', 'Muu'] },
          { key: 'engineSize', label: 'Moottorin koko', type: 'text' },
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
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'price', label: 'Hinta (€)', type: 'number' }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'mileageUnit', label: 'Mittayksikkö', type: 'select', options: ['Kilometrit', 'Käyttötunnit'] }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'drivetrain', label: 'Vetotapa', type: 'text' }, { key: 'transmission', label: 'Vaihteisto', type: 'select', options: ['Manuaali', 'Automaatti', 'Puoliautomaatti', 'CVT', 'Muu'] }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: ['Diesel', 'Bensiini', 'Sähkö', 'Hybridi', 'Kaasu', 'Etanoli', 'Vety', 'Muu'] }, { key: 'frontLoader', label: 'Etukuormain', type: 'checkbox' }, { key: 'frontLoaderAttachment', label: 'Etunostolaite', type: 'checkbox' }, { key: 'weight', label: 'Paino', type: 'text' }, { key: 'attachments', label: 'Ulosotot', type: 'text' }] },
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
      { key: 'basic', title: 'Perustiedot', fields: [{ key: 'price', label: 'Hinta (€)', type: 'number' }] },
      { key: 'technical', title: 'Tekniset tiedot', fields: [{ key: 'hours', label: 'Käyttötunnit', type: 'number' }, { key: 'mileageUnit', label: 'Mittayksikkö', type: 'select', options: ['Kilometrit', 'Käyttötunnit'] }, { key: 'tareWeight', label: 'Käyttöpaino', type: 'text' }, { key: 'boomType', label: 'Puomin tyyppi', type: 'text' }, { key: 'bucketCount', label: 'Kauhat', type: 'number' }, { key: 'quickCoupler', label: 'Pikakiinnike', type: 'checkbox' }, { key: 'power', label: 'Teho', type: 'number' }, { key: 'transmission', label: 'Vaihteisto', type: 'select', options: ['Manuaali', 'Automaatti', 'Puoliautomaatti', 'CVT', 'Muu'] }, { key: 'fuel', label: 'Käyttövoima', type: 'select', options: ['Diesel', 'Bensiini', 'Sähkö', 'Hybridi', 'Kaasu', 'Etanoli', 'Vety', 'Muu'] }] },
      { key: 'features', title: 'Varusteet', fields: [{ key: 'features', label: 'Varusteet', type: 'checkboxGroup', options: ['Huoltokirja', 'Lisäkoukku', 'Ilmastointi'] }] },
      { key: 'details', title: 'Lisätiedot', fields: [{ key: 'details', label: 'Lisätiedot', type: 'textarea' }] },
      { key: 'images', title: 'Kuvat', fields: [{ key: 'images', label: 'Kuvat', type: 'image' }] },
      { key: 'location', title: 'Sijainti', fields: [{ key: 'location', label: 'Sijainti', type: 'location' }] },
      { key: 'contact', title: 'Yhteystiedot', fields: [{ key: 'contact', label: 'Yhteystiedot', type: 'contact' }] },
    ],
  },


];

export function getFormConfigBySlug(slug: string) {
  return FORM_CONFIGS.find((f) => f.slug === slug) ?? null;
}
