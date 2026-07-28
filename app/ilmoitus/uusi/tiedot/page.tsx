"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';
import { getFormConfigBySlug } from '@/lib/formConfig';
import SectionCard from '@/app/components/form/SectionCard';
import TextField from '@/app/components/form/TextField';
import NumberField from '@/app/components/form/NumberField';
import SelectField from '@/app/components/form/SelectField';
import CheckboxGroup from '@/app/components/form/CheckboxGroup';
import Textarea from '@/app/components/form/Textarea';
import ImageUpload from '@/app/components/form/ImageUpload';
import LocationSelector from '@/app/components/form/LocationSelector';
import ContactInformation from '@/app/components/form/ContactInformation';
import ProgressBar from '@/app/components/form/ProgressBar';
import SmartTextField from '@/app/components/form/SmartTextField';

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function CreateListingDetailsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';

  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;
  const subcategory = category && subcategorySlug ? getSubcategoryBySlug(categorySlug, subcategorySlug) : null;

  const formConfig = getFormConfigBySlug(subcategorySlug || categorySlug);

  const initialValues = useMemo(() => {
    const base: Record<string, any> = { category: categorySlug, subcategory: subcategorySlug };
    if (!formConfig) return base;
    const hasLocationField = formConfig.sections.some((section) => section.fields.some((field) => field.type === 'location'));
    formConfig.sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (f.type === 'checkboxGroup') base[f.key] = [];
        else if (f.type === 'image') base[f.key] = [];
        else if (f.type === 'checkbox') base[f.key] = false;
        else base[f.key] = '';
      });
    });
    if (hasLocationField) {
      base.province = '';
      base.municipality = '';
    }
    base.searchTags = [];
    return base;
  }, [formConfig, categorySlug, subcategorySlug]);

  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [submitMessage, setSubmitMessage] = useState('');
  const [imageError, setImageError] = useState('');

  const handleChange = (key: string) => (value: any) => {
    setSubmitMessage('');
    if (key === 'province') {
      setFormData((p) => ({ ...p, province: value, municipality: '' }));
      return;
    }

    setFormData((p) => {
      const next = { ...p, [key]: value };
      const brand = typeof next.brand === 'string' ? next.brand.trim() : '';
      const model = typeof next.model === 'string' ? next.model.trim() : '';
      const year = typeof next.year === 'string' || typeof next.year === 'number' ? String(next.year).trim() : '';
      const tags = [brand, model, year].filter(Boolean);
      next.searchTags = tags;
      return next;
    });
  };

  const handleAddImages = (files: File[]) => {
    setImageError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (files.some((f) => !allowed.includes(f.type))) {
      setImageError('Väärä tiedostotyyppi. Sallitut: JPG, JPEG, PNG, WEBP.');
      return;
    }
    if (files.some((f) => f.size > MAX_IMAGE_SIZE_BYTES)) {
      setImageError(`Yksi tai useampi tiedosto on liian suuri. Maksimi ${MAX_IMAGE_SIZE_MB} Mt / kuva.`);
      return;
    }
    if ((formData.images?.length ?? 0) + files.length > MAX_IMAGES) {
      setImageError(`Maksimissaan ${MAX_IMAGES} kuvaa.`);
      return;
    }
    setFormData((p) => ({ ...p, images: [...(p.images ?? []), ...files] }));
  };

  const handleReorderImages = (from: number, to: number) => {
    setFormData((p) => {
      const imgs = [...(p.images ?? [])];
      const [moved] = imgs.splice(from, 1);
      imgs.splice(to, 0, moved);
      return { ...p, images: imgs };
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData((p) => ({ ...p, images: (p.images ?? []).filter((_: any, i: number) => i !== index) }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isFormValid = event.currentTarget.reportValidity();
    if (!isFormValid) {
      return;
    }

    if (!formData.province) {
      setSubmitMessage('Maakunta on pakollinen.');
      return;
    }

    if (!formData.municipality) {
      setSubmitMessage('Kaupunki / kunta on pakollinen.');
      return;
    }

    console.log('Ilmoitustiedot:', formData);
    setSubmitMessage('Ilmoituksen tallennus toteutetaan seuraavassa vaiheessa.');
  };

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

  return (
    <div className="mx-auto container-center py-10">
      <section className="max-w-4xl">
        <div className="mb-8">
          <Link href={`/ilmoitus/uusi/${categorySlug}`} className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-block">← Takaisin</Link>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">Ilmoituksen tiedot</h1>
          <p className="mt-2 text-sm text-slate-600">Kategoria: {category.title} → {subcategory.title}</p>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Vaihe 3: Syötä ilmoituksen tiedot</h2>

          <ProgressBar steps={["Perustiedot","Tekniset tiedot","Varusteet","Kuvat","Yhteystiedot","Julkaisu"]} active={1} />

          <form className="space-y-8" onSubmit={handleSubmit}>
            {!formConfig ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">Konfiguraatiota ei löytynyt valitulle alaluokalle.</div>
            ) : null}

            {formConfig?.sections.map((section) => (
              <div key={section.key}>
                <SectionCard title={section.title}>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {section.fields.map((field) => {
                      switch (field.type) {
                        case 'text':
                          return <TextField key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} />;
                        case 'brand':
                          return <SmartTextField key={field.key} id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} mode="brand" />;
                        case 'model':
                          return <SmartTextField key={field.key} id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} mode="model" suggestionSource={String(formData.brand ?? '')} />;
                        case 'number':
                          return <NumberField key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} />;
                        case 'select':
                          return <SelectField key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} options={field.options ?? []} />;
                        case 'radio':
                          return (
                            <div key={field.key}>
                              <div className="block text-sm font-medium text-slate-900 mb-2">{field.label}</div>
                              <div className="flex gap-3 rounded-[24px] border border-slate-300 bg-white p-3">
                                {(field.options ?? []).map((opt) => (
                                  <label key={opt} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                    <input type="radio" name={field.key} value={opt} checked={(formData[field.key] ?? '') === opt} onChange={(e) => handleChange(field.key)(e.target.value)} className="h-4 w-4" />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        case 'checkboxGroup':
                          return <CheckboxGroup key={field.key} label={field.label} options={field.options ?? []} values={formData[field.key] ?? []} onChange={(vals) => setFormData((p) => ({ ...p, [field.key]: vals }))} />;
                        case 'textarea':
                          return <Textarea key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} />;
                        case 'image':
                          return <ImageUpload key={field.key} images={formData.images ?? []} onAdd={handleAddImages} onRemove={handleRemoveImage} onReorder={handleReorderImages} error={imageError} />;
                        case 'location':
                          return <LocationSelector key={field.key} province={formData.province ?? ''} municipality={formData.municipality ?? ''} onProvince={handleChange('province')} onMunicipality={handleChange('municipality')} />;
                        case 'contact':
                          return <ContactInformation key={field.key} phone={formData.phone ?? ''} email={formData.email ?? ''} onPhone={handleChange('phone')} onEmail={handleChange('email')} />;
                        case 'checkbox':
                          return (
                            <label key={field.key} className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-4">
                              <input type="checkbox" checked={!!formData[field.key]} onChange={(e) => handleChange(field.key)(e.target.checked)} className="h-4 w-4" />
                              <span>{field.label}</span>
                            </label>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </SectionCard>
              </div>
            ))}

            <div className="flex flex-col gap-4 pt-6 sm:flex-row">
              <button type="submit" className="flex-1 rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#0ca4dd]">Julkaise ilmoitus</button>
              <Link href="/ilmoitus/uusi" className="flex-1 rounded-[28px] border border-slate-300 px-6 py-3 text-center font-semibold text-slate-900 hover:bg-slate-50">Peruuta</Link>
            </div>
            {submitMessage ? (<div className="rounded-[24px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{submitMessage}</div>) : null}
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

