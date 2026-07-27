'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';

const regions = [
  'Uusimaa',
  'Pirkanmaa',
  'Varsinais-Suomi',
  'Keski-Suomi',
  'Pohjois-Pohjanmaa',
] as const;

const citiesByRegion: Record<string, string[]> = {
  Uusimaa: ['Helsinki', 'Espoo', 'Vantaa'],
  Pirkanmaa: ['Tampere', 'Nokia', 'Valkeakoski'],
  'Varsinais-Suomi': ['Turku', 'Salo', 'Kaarina'],
  'Keski-Suomi': ['Jyväskylä', 'Jämsä', 'Äänekoski'],
  'Pohjois-Pohjanmaa': ['Oulu', 'Raahe', 'Kuusamo'],
};

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

type FeatureKey = 'serviceBook' | 'airConditioning' | 'towHook';

type FormData = {
  category: string;
  subcategory: string;
  title: string;
  brand: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  mileageUnit: 'km' | 'h';
  transmission: string;
  drivetrain: string;
  fuel: string;
  engineSize: string;
  power: string;
  weight: string;
  tareWeight: string;
  payload: string;
  color: string;
  interiorColor: string;
  interiorMaterial: string;
  features: Record<FeatureKey, boolean>;
  images: File[];
  details: string;
  region: string;
  city: string;
  phone: string;
  email: string;
};

function CreateListingDetailsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';

  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;
  const subcategory = category && subcategorySlug
    ? getSubcategoryBySlug(categorySlug, subcategorySlug)
    : null;

  const initialFormData = useMemo<FormData>(
    () => ({
      category: categorySlug,
      subcategory: subcategorySlug,
      title: '',
      brand: '',
      model: '',
      year: '',
      price: '',
      mileage: '',
      mileageUnit: 'km',
      transmission: '',
      drivetrain: '',
      fuel: '',
      engineSize: '',
      power: '',
      weight: '',
      tareWeight: '',
      payload: '',
      color: '',
      interiorColor: '',
      interiorMaterial: '',
      features: {
        serviceBook: false,
        airConditioning: false,
        towHook: false,
      },
      images: [],
      details: '',
      region: '',
      city: '',
      phone: '',
      email: '',
    }),
    [categorySlug, subcategorySlug],
  );

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitMessage, setSubmitMessage] = useState('');
  const [imageError, setImageError] = useState('');

  if (!category || !subcategory) {
    return (
      <div className="mx-auto container-center py-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Virheellinen kategoria tai alaluokka</h1>
          <Link href="/ilmoitus/uusi" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
            Aloita alusta
          </Link>
        </div>
      </div>
    );
  }

  const cityOptions = formData.region ? citiesByRegion[formData.region] ?? [] : [];

  const handleChange = (field: keyof FormData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    if (field === 'region') {
      setFormData((prev) => ({
        ...prev,
        region: String(value),
        city: '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value as FormData[typeof field],
    }));
  };

  const handleFeatureToggle = (feature: FeatureKey) => () => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature],
      },
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      setImageError(`Yksi tai useampi tiedosto on liian suuri. Maksimi ${MAX_IMAGE_SIZE_MB} Mt / kuva.`);
      return;
    }

    if (files.length + formData.images.length > MAX_IMAGES) {
      setImageError(`Maksimissaan ${MAX_IMAGES} kuvaa.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Ilmoitustiedot:', formData);
    setSubmitMessage('Ilmoituksen tallennus toteutetaan seuraavassa vaiheessa.');
  };

  return (
    <div className="mx-auto container-center py-10">
      <section className="max-w-4xl">
        <div className="mb-8">
          <Link
            href={`/ilmoitus/uusi/${categorySlug}`}
            className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-block"
          >
            ← Takaisin
          </Link>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">
            Ilmoituksen tiedot
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kategoria: {category.title} → {subcategory.title}
          </p>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Vaihe 3: Syötä ilmoituksen tiedot
          </h2>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
                  Otsikko *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  placeholder="Esim. Ford Transit 2020"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-slate-900 mb-2">
                  Merkki *
                </label>
                <input
                  type="text"
                  id="brand"
                  value={formData.brand}
                  onChange={handleChange('brand')}
                  placeholder="Esim. Ford"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-slate-900 mb-2">
                  Malli *
                </label>
                <input
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={handleChange('model')}
                  placeholder="Esim. Transit"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-slate-900 mb-2">
                  Vuosimalli *
                </label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={handleChange('year')}
                  placeholder="2020"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-900 mb-2">
                  Hinta (€) *
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={handleChange('price')}
                  placeholder="0"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Ajomäärä</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    id="mileage"
                    value={formData.mileage}
                    onChange={handleChange('mileage')}
                    placeholder="0"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                  <div className="flex gap-3 rounded-[24px] border border-slate-300 bg-white p-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="mileageUnit"
                        value="km"
                        checked={formData.mileageUnit === 'km'}
                        onChange={handleChange('mileageUnit')}
                        className="h-4 w-4"
                      />
                      KM
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="mileageUnit"
                        value="h"
                        checked={formData.mileageUnit === 'h'}
                        onChange={handleChange('mileageUnit')}
                        className="h-4 w-4"
                      />
                      H
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tekniset tiedot</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-slate-900 mb-2">
                    Vaihteisto
                  </label>
                  <input
                    type="text"
                    id="transmission"
                    value={formData.transmission}
                    onChange={handleChange('transmission')}
                    placeholder="Esim. automaatti"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="drivetrain" className="block text-sm font-medium text-slate-900 mb-2">
                    Vetotapa
                  </label>
                  <input
                    type="text"
                    id="drivetrain"
                    value={formData.drivetrain}
                    onChange={handleChange('drivetrain')}
                    placeholder="Esim. etuveto"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="fuel" className="block text-sm font-medium text-slate-900 mb-2">
                    Käyttövoima
                  </label>
                  <input
                    type="text"
                    id="fuel"
                    value={formData.fuel}
                    onChange={handleChange('fuel')}
                    placeholder="Esim. diesel"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 mt-6">
                <div>
                  <label htmlFor="engineSize" className="block text-sm font-medium text-slate-900 mb-2">
                    Moottorin koko
                  </label>
                  <input
                    type="text"
                    id="engineSize"
                    value={formData.engineSize}
                    onChange={handleChange('engineSize')}
                    placeholder="Esim. 2.0 L"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="power" className="block text-sm font-medium text-slate-900 mb-2">
                    Teho (hv)
                  </label>
                  <input
                    type="number"
                    id="power"
                    value={formData.power}
                    onChange={handleChange('power')}
                    placeholder="Esim. 150"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-slate-900 mb-2">
                    Paino
                  </label>
                  <input
                    type="text"
                    id="weight"
                    value={formData.weight}
                    onChange={handleChange('weight')}
                    placeholder="Esim. 2500 kg"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 mt-6">
                <div>
                  <label htmlFor="tareWeight" className="block text-sm font-medium text-slate-900 mb-2">
                    Työpaino
                  </label>
                  <input
                    type="text"
                    id="tareWeight"
                    value={formData.tareWeight}
                    onChange={handleChange('tareWeight')}
                    placeholder="Esim. 1500 kg"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="payload" className="block text-sm font-medium text-slate-900 mb-2">
                    Kantavuus
                  </label>
                  <input
                    type="text"
                    id="payload"
                    value={formData.payload}
                    onChange={handleChange('payload')}
                    placeholder="Esim. 1000 kg"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div />
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ulkonäkö</h3>
              <div className="grid gap-6 lg:grid-cols-3">
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-slate-900 mb-2">
                    Väri
                  </label>
                  <input
                    type="text"
                    id="color"
                    value={formData.color}
                    onChange={handleChange('color')}
                    placeholder="Esim. valkoinen"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="interiorColor" className="block text-sm font-medium text-slate-900 mb-2">
                    Sisustan väri
                  </label>
                  <input
                    type="text"
                    id="interiorColor"
                    value={formData.interiorColor}
                    onChange={handleChange('interiorColor')}
                    placeholder="Esim. musta"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
                <div>
                  <label htmlFor="interiorMaterial" className="block text-sm font-medium text-slate-900 mb-2">
                    Sisustan materiaali
                  </label>
                  <input
                    type="text"
                    id="interiorMaterial"
                    value={formData.interiorMaterial}
                    onChange={handleChange('interiorMaterial')}
                    placeholder="Esim. nahka"
                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Varusteet</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.features.serviceBook}
                    onChange={handleFeatureToggle('serviceBook')}
                    className="h-4 w-4"
                  />
                  <span>Huoltokirja</span>
                </label>
                <label className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.features.airConditioning}
                    onChange={handleFeatureToggle('airConditioning')}
                    className="h-4 w-4"
                  />
                  <span>Ilmastointi</span>
                </label>
                <label className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-4">
                  <input
                    type="checkbox"
                    checked={formData.features.towHook}
                    onChange={handleFeatureToggle('towHook')}
                    className="h-4 w-4"
                  />
                  <span>Vetokoukku</span>
                </label>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Kuvat</h3>
                  <p className="mt-1 text-sm text-slate-600">Maksimissaan {MAX_IMAGES} kuvaa. Maksimi {MAX_IMAGE_SIZE_MB} Mt / kuva.</p>
                </div>
                <span className="text-sm text-slate-600">{`${formData.images.length} / ${MAX_IMAGES} kuvaa lisätty`}</span>
              </div>
              <label className="mt-4 flex min-h-[160px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 cursor-pointer">
                <span>Lisää kuvia</span>
                <span className="mt-2 text-xs text-slate-400">Valitse kuvia laitteestasi</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imageError ? <p className="mt-3 text-sm text-red-600">{imageError}</p> : null}
              {formData.images.length > 0 ? (
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  {formData.images.map((image, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {image.name}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-slate-900 mb-2">
                Lisätiedot
              </label>
              <textarea
                id="details"
                rows={6}
                maxLength={3000}
                value={formData.details}
                onChange={handleChange('details')}
                className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
              />
              <p className="mt-2 text-sm text-slate-500">{`${formData.details.length} / 3000 merkkiä`}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-slate-900 mb-2">
                  Maakunta
                </label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={handleChange('region')}
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                >
                  <option value="">Valitse maakunta</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-900 mb-2">
                  Kaupunki / kunta
                </label>
                <select
                  id="city"
                  value={formData.city}
                  onChange={handleChange('city')}
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  disabled={!formData.region}
                >
                  <option value="">Valitse kaupunki</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-900 mb-2">
                  Puhelinnumero *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder="040 123 4567"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                  Sähköpostiosoite *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="esim. nimi@esimerkki.fi"
                  className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none focus:ring-2 focus:ring-[#0ea5e91a]"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 sm:flex-row">
              <button
                type="submit"
                className="flex-1 rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#0ca4dd]"
              >
                Julkaise ilmoitus
              </button>
              <Link
                href="/ilmoitus/uusi"
                className="flex-1 rounded-[28px] border border-slate-300 px-6 py-3 text-center font-semibold text-slate-900 hover:bg-slate-50"
              >
                Peruuta
              </Link>
            </div>
            {submitMessage ? (
              <div className="rounded-[24px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                {submitMessage}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-900">Tietosuojaseloste</a>
            <a href="#" className="hover:text-slate-900">Käyttöehdot</a>
            <a href="#" className="hover:text-slate-900">Yhteystiedot</a>
          </div>
          <div>© 2026 Ajotori</div>
        </div>
      </footer>
    </div>
  );
}

export default function CreateListingDetailsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <CreateListingHeader />
      <Suspense fallback={<div>Ladataan...</div>}>
        <CreateListingDetailsContent />
      </Suspense>
    </main>
  );
}
