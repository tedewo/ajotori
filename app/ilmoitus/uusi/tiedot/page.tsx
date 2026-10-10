"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import { createBrowserClient, hasSupabaseConfig } from '@/lib/supabase/client';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';
import { getFormConfigBySlug, POWER_UNIT_OPTIONS } from '@/lib/formConfig';
import SectionCard from '@/app/components/form/SectionCard';
import TextField from '@/app/components/form/TextField';
import NumberField from '@/app/components/form/NumberField';
import SelectField from '@/app/components/form/SelectField';
import CheckboxGroup from '@/app/components/form/CheckboxGroup';
import Textarea from '@/app/components/form/Textarea';
import ImageUpload from '@/app/components/form/ImageUpload';
import LocationSelector from '@/app/components/form/LocationSelector';
import ContactInformation from '@/app/components/form/ContactInformation';
import SmartTextField from '@/app/components/form/SmartTextField';
import PublishListingButton from '@/app/components/listings/PublishListingButton';

const MAX_IMAGES = 20;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: 'Luonnos',
  published: 'Julkaistu',
  sold: 'Myyty',
  removed: 'Poistettu',
};

function CreateListingDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category') ?? '';
  const subcategorySlug = searchParams.get('subcategory') ?? '';
  const editId = searchParams.get('edit');

  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;
  const subcategory = category && subcategorySlug ? getSubcategoryBySlug(categorySlug, subcategorySlug) : null;

  const formConfig = getFormConfigBySlug(subcategorySlug || categorySlug);

  const initialValues = useMemo(() => {
    const base: Record<string, any> = {
      category: categorySlug,
      subcategory: subcategorySlug,
      homepageDescription: '',
      externalListingUrl: '',
    };
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
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [imageError, setImageError] = useState('');
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; url: string }>>([]);
  const [isLoadingEdit, setIsLoadingEdit] = useState(Boolean(editId));
  const [editLoadError, setEditLoadError] = useState('');
  const [listingStatus, setListingStatus] = useState('');
  const [activeSectionKey, setActiveSectionKey] = useState(formConfig?.sections[0]?.key ?? '');

  useEffect(() => {
    const firstVisibleSection = formConfig?.sections.find((section) => !(editId && section.key === 'contact'));
    setActiveSectionKey(firstVisibleSection?.key ?? '');
  }, [formConfig, editId]);

  useEffect(() => {
    if (!editId) {
      setIsLoadingEdit(false);
      setEditLoadError('');
      setListingStatus('');
      return;
    }

    let cancelled = false;
    setIsLoadingEdit(true);
    setEditLoadError('');

    const loadListing = async () => {
      try {
        const response = await fetch(`/api/listings/${encodeURIComponent(editId)}`);
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
          listing?: {
            id: string;
            category_slug: string | null;
            subcategory_slug: string | null;
            title: string | null;
            brand: string | null;
            model: string | null;
            year: number | null;
            price: number | null;
            description: string | null;
            homepage_description: string | null;
            region: string | null;
            municipality: string | null;
            external_listing_url: string | null;
            status: string;
            technical_data: Record<string, unknown> | null;
            equipment: string[] | null;
          };
          images?: Array<{ id: string; url: string }>;
        };

        if (!response.ok || !result.listing) {
          throw new Error(result.error || 'Ilmoituksen lataaminen epäonnistui.');
        }

        if (
          result.listing.category_slug !== categorySlug ||
          result.listing.subcategory_slug !== subcategorySlug
        ) {
          throw new Error('Ilmoituksen kategoria ei vastaa muokkausosoitetta. Palaa omiin ilmoituksiin ja yritä uudelleen.');
        }

        if (cancelled) return;
        setFormData({
          ...initialValues,
          ...(result.listing.technical_data ?? {}),
          title: result.listing.title ?? '',
          brand: result.listing.brand ?? '',
          model: result.listing.model ?? '',
          year: result.listing.year == null ? '' : String(result.listing.year),
          price: result.listing.price == null ? '' : String(result.listing.price),
          details: result.listing.description ?? '',
          homepageDescription: result.listing.homepage_description ?? '',
          externalListingUrl: result.listing.external_listing_url ?? '',
          province: result.listing.region ?? '',
          municipality: result.listing.municipality ?? '',
          features: result.listing.equipment ?? [],
          images: [],
        });
        setUploadedImages(result.images ?? []);
        setCreatedListingId(result.listing.id);
        setListingStatus(result.listing.status);
      } catch (error) {
        if (!cancelled) {
          setEditLoadError(error instanceof Error ? error.message : 'Ilmoituksen lataaminen epäonnistui.');
        }
      } finally {
        if (!cancelled) setIsLoadingEdit(false);
      }
    };

    void loadListing();
    return () => {
      cancelled = true;
    };
  }, [editId, categorySlug, subcategorySlug, initialValues]);

  const visibleSections = formConfig?.sections.filter((section) => !(editId && section.key === 'contact')) ?? [];

  const createGeneratedTitle = (values: Record<string, any>) => {
    const brand = typeof values.brand === 'string' ? values.brand.trim() : '';
    const model = typeof values.model === 'string' ? values.model.trim() : '';
    const year = typeof values.year === 'string' || typeof values.year === 'number' ? String(values.year).trim() : '';
    return [brand, model, year].filter(Boolean).join(' ');
  };

  const handleChange = (key: string) => (value: any) => {
    setSubmitMessage('');
    if (key === 'province') {
      setFormData((p) => ({ ...p, province: value, municipality: '' }));
      return;
    }

    setFormData((p) => {
      const fieldValue = key === 'engineSize' && value !== ''
        ? Number(String(value).replace(/\s*l$/, ''))
        : value;
      const next = { ...p, [key]: fieldValue };
      if (key === 'registered' && value !== 'Kyllä') next.registrationType = '';
      const brand = typeof next.brand === 'string' ? next.brand.trim() : '';
      const model = typeof next.model === 'string' ? next.model.trim() : '';
      const year = typeof next.year === 'string' || typeof next.year === 'number' ? String(next.year).trim() : '';
      const tags = [brand, model, year].filter(Boolean);
      next.searchTags = tags;
      if (['brand', 'model', 'year'].includes(key)) {
        next.title = createGeneratedTitle(next);
      }
      return next;
    });
  };

  const handlePowerChange = (powerValue: string) => {
    setFormData((p) => ({
      ...p,
      power: powerValue,
      powerUnit: p.powerUnit ?? 'kW',
      powerEquivalent: powerValue ? (p.powerUnit === 'hv' ? `${Math.round(Number(powerValue) * 0.735499)}` : `${Math.round(Number(powerValue) / 0.735499)}`) : '',
    }));
  };

  const handlePowerUnitChange = (unit: string) => {
    setFormData((p) => ({
      ...p,
      powerUnit: unit,
      powerEquivalent: p.power ? (unit === 'hv' ? `${Math.round(Number(p.power) * 0.735499)}` : `${Math.round(Number(p.power) / 0.735499)}`) : '',
    }));
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

  const uploadImages = async (listingId: string, files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append('files', file));

    const response = await fetch(`/api/listings/${listingId}/images`, { method: 'POST', body });
    const result = (await response.json().catch(() => ({ error: 'Kuvien lataus epäonnistui.' }))) as {
      error?: string;
      uploadedImages?: Array<{ id: string; url: string }>;
    };

    if (!response.ok) throw new Error(result.error || 'Kuvien lataus epäonnistui.');
    setUploadedImages((current) => [...current, ...(result.uploadedImages ?? [])]);
  };

  const handleRemoveUploadedImage = async (imageId: string) => {
    setImageError('');
    const response = await fetch(`/api/listings/${createdListingId}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    });
    const result = (await response.json().catch(() => ({ error: 'Kuvan poistaminen epäonnistui.' }))) as { error?: string };
    if (!response.ok) {
      setImageError(result.error || 'Kuvan poistaminen epäonnistui.');
      return;
    }
    setUploadedImages((current) => current.filter((image) => image.id !== imageId));
  };

  const publishValidationMessage = (() => {
    if (!createdListingId) return 'Tallenna luonnos ensin.';
    if (uploadedImages.length === 0) return 'Lisää vähintään yksi kuva ennen julkaisemista.';
    if (!String(formData.title ?? '').trim()) return 'Täydennä ilmoitukselle otsikko.';
    if (!categorySlug || !subcategorySlug) return 'Täydennä ilmoituksen kategoria.';
    if (!formData.province) return 'Maakunta on pakollinen.';
    if (!formData.municipality) return 'Kaupunki / kunta on pakollinen.';

    const requiredFields = formConfig?.sections.flatMap((section) => section.fields.filter((field) => field.required)) ?? [];
    const missingField = requiredFields.find((field) => {
      const value = formData[field.key];
      if (field.key === 'price') return !Number.isFinite(Number(value)) || Number(value) <= 0;
      if (Array.isArray(value)) return value.length === 0;
      return value === null || value === undefined || String(value).trim() === '';
    });

    return missingField ? `${missingField.label} on pakollinen.` : '';
  })();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const isFormValid = event.currentTarget.reportValidity();
    if (!isFormValid) {
      return;
    }

    if (!formData.province) {
      setSubmitError('Maakunta on pakollinen.');
      setSubmitMessage('');
      return;
    }

    if (!formData.municipality) {
      setSubmitError('Kaupunki / kunta on pakollinen.');
      setSubmitMessage('');
      return;
    }

    if (!hasSupabaseConfig()) {
      setSubmitError('Supabase-määritykset puuttuvat. Lisää NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env-tiedostoon.');
      setSubmitMessage('');
      return;
    }

    if (submitInFlight.current) return;
    submitInFlight.current = true;
    setIsSubmitting(true);
    const supabase = createBrowserClient();
    let userData: Awaited<ReturnType<typeof supabase.auth.getUser>>['data'];
    let userError: Awaited<ReturnType<typeof supabase.auth.getUser>>['error'];
    try {
      const authResult = await supabase.auth.getUser();
      userData = authResult.data;
      userError = authResult.error;
    } catch (error) {
      submitInFlight.current = false;
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'Kirjautumisen tarkistus epäonnistui.');
      setSubmitMessage('');
      return;
    }

    if (userError || !userData.user) {
      submitInFlight.current = false;
      setIsSubmitting(false);
      setSubmitError('Et ole kirjautunut. Kirjaudu sisään jatkaaksesi.');
      setSubmitMessage('');
      router.push('/auth/sign-in');
      return;
    }

    setSubmitError('');
    setSubmitMessage(editId ? 'Tallennetaan muutoksia...' : 'Tallennetaan ilmoitusta luonnoksena...');

    try {
      const payload = {
        ...formData,
        category_slug: categorySlug,
        subcategory_slug: subcategorySlug,
        title: formData.title || createGeneratedTitle(formData),
        region: formData.province,
        municipality: formData.municipality,
        description: formData.details ?? formData.description ?? '',
        homepage_description: formData.homepageDescription ?? '',
        external_listing_url: formData.externalListingUrl ?? null,
        features: Array.isArray(formData.features) ? formData.features : [],
      };
      let listingId = createdListingId;
      if (!listingId) {
        const response = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            seller_type: formData.sellerType ?? 'private',
          }),
        });
        const result = (await response.json().catch(() => ({ error: 'Tallennus epäonnistui.' }))) as { error?: string; listingId?: string };
        if (!response.ok || !result.listingId) throw new Error(result.error || 'Tallennus epäonnistui.');
        listingId = result.listingId;
        setCreatedListingId(listingId);
      } else {
        const response = await fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = (await response.json().catch(() => ({ error: 'Tallennus epäonnistui.' }))) as { error?: string; status?: string };
        if (!response.ok) throw new Error(result.error || 'Tallennus epäonnistui.');
        if (result.status) setListingStatus(result.status);
      }

      const files = formData.images ?? [];
      if (files.length > 0) {
        setSubmitMessage('Luonnos tallennettu. Ladataan kuvia...');
        await uploadImages(listingId, files);
        setFormData((current) => ({ ...current, images: [] }));
      }

      setSubmitMessage(editId
        ? 'Muutokset tallennettiin. Ilmoituksen tila säilyi ennallaan.'
        : files.length > 0
          ? 'Ilmoitus ja kuvat on tallennettu luonnoksena.'
          : 'Ilmoitus on tallennettu luonnoksena.');
      setSubmitError('');
    } catch (error) {
      console.error('Listing save failed:', error);
      setSubmitError(error instanceof Error && error.message ? error.message : 'Ilmoituksen tallennus epäonnistui. Yritä uudelleen.');
      setSubmitMessage('');
    } finally {
      setIsSubmitting(false);
      submitInFlight.current = false;
    }
  };

  if (editId && isLoadingEdit) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-slate-600">Ladataan ilmoitusta muokkausta varten...</div>;
  }

  if (editId && editLoadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p>{editLoadError}</p>
          <Link href="/account" className="mt-4 inline-flex font-semibold text-rose-800 hover:underline">Takaisin omiin ilmoituksiin</Link>
        </div>
      </div>
    );
  }

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
          <Link href={editId ? '/account' : `/ilmoitus/uusi/${categorySlug}`} className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-block">
            {editId ? '← Takaisin omiin ilmoituksiin' : '← Takaisin'}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900">
              {editId ? 'Muokkaa ilmoitusta' : 'Ilmoituksen tiedot'}
            </h1>
            {editId && listingStatus ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Tila: {LISTING_STATUS_LABELS[listingStatus] ?? listingStatus}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">Kategoria: {category.title} → {subcategory.title}</p>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            {editId ? 'Muokkaa ilmoituksen tietoja' : 'Vaihe 3: Syötä ilmoituksen tiedot'}
          </h2>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {!formConfig ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">Konfiguraatiota ei löytynyt valitulle alaluokalle.</div>
            ) : null}

            {visibleSections.length ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {visibleSections.map((section) => {
                  const isActive = activeSectionKey === section.key;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveSectionKey(section.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive ? 'bg-[#0ea5e9] text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {visibleSections.filter((section) => section.key === activeSectionKey).map((section) => (
              <div key={section.key}>
                <SectionCard title={section.title}>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {section.key === 'details' ? (
                      <>
                        <div>
                          <label htmlFor="homepageDescription" className="mb-2 block text-sm font-medium text-slate-900">
                            Etusivun lisätiedot
                          </label>
                          <p className="mb-2 text-xs text-slate-500">
                            Lyhyt teksti, joka näkyy ilmoituskortissa. Esim. Hatchback, katsastettu, siisti!
                          </p>
                          <textarea
                            id="homepageDescription"
                            value={String(formData.homepageDescription ?? '')}
                            onChange={(event) => handleChange('homepageDescription')(event.target.value)}
                            maxLength={200}
                            rows={3}
                            className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
                          />
                          <p className="mt-2 text-sm text-slate-500">
                            {`${String(formData.homepageDescription ?? '').length} / 200 merkkiä`}
                          </p>
                        </div>
                        <div>
                          <label htmlFor="externalListingUrl" className="mb-2 block text-sm font-medium text-slate-900">
                            Lisätietolinkki
                          </label>
                          <p className="mb-2 text-xs text-slate-500">
                            Vapaaehtoinen linkki esimerkiksi liikkeen verkkosivulle tai ajoneuvon vaihtoehtoiseen ilmoitukseen.
                          </p>
                          <input
                            id="externalListingUrl"
                            type="url"
                            value={String(formData.externalListingUrl ?? '')}
                            onChange={(event) => handleChange('externalListingUrl')(event.target.value)}
                            placeholder="https://example.com/ajoneuvo"
                            className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
                          />
                        </div>
                      </>
                    ) : null}
                    {section.fields.map((field) => {
                      switch (field.type) {
                        case 'text':
                          return <TextField key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} />;
                        case 'brand':
                          return <SmartTextField key={field.key} id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} mode="brand" />;
                        case 'model':
                          return <SmartTextField key={field.key} id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} mode="model" suggestionSource={String(formData.brand ?? '')} />;
                        case 'number':
                          if (field.key === 'power') {
                            return (
                              <div key={field.key} className="space-y-3">
                                <label htmlFor="power" className="block text-sm font-medium text-slate-900 mb-2">{field.label}</label>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <input
                                    id="power"
                                    type="number"
                                    value={String(formData.power ?? '')}
                                    onChange={(e) => handlePowerChange(e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
                                  />
                                  <select
                                    id="powerUnit"
                                    value={String(formData.powerUnit ?? 'kW')}
                                    onChange={(e) => handlePowerUnitChange(e.target.value)}
                                    className="rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
                                  >
                                    {POWER_UNIT_OPTIONS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                                  </select>
                                </div>
                                {formData.power ? (
                                  <p className="text-sm text-slate-500">Vastaava arvo tallennetaan haussa: {formData.powerEquivalent ? `${formData.powerEquivalent} ${formData.powerUnit === 'kW' ? 'hv' : 'kW'}` : '—'}</p>
                                ) : null}
                              </div>
                            );
                          }
                          return <NumberField key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} placeholder={field.placeholder} required={field.required} />;
                        case 'select':
                          if (field.key === 'registrationType' && formData.registered !== 'Kyllä') return null;
                          if (field.key === 'transmission') {
                            return (
                              <div key={field.key} className="space-y-3">
                                <SelectField id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} options={field.options ?? []} />
                                {String(formData[field.key] ?? '') === 'Muu' ? (
                                  <TextField id="transmissionOther" label="Muu vaihteisto" value={String(formData.transmissionOther ?? '')} onChange={handleChange('transmissionOther')} placeholder="Esim. CVT" />
                                ) : null}
                              </div>
                            );
                          }
                          if (field.key === 'fuel') {
                            return (
                              <div key={field.key} className="space-y-3">
                                <SelectField id={field.key} label={field.label} value={String(formData[field.key] ?? '')} onChange={handleChange(field.key)} options={field.options ?? []} />
                                {String(formData[field.key] ?? '') === 'Muu' ? (
                                  <TextField id="fuelOther" label="Muu käyttövoima" value={String(formData.fuelOther ?? '')} onChange={handleChange('fuelOther')} placeholder="Esim. etanoli" />
                                ) : null}
                                {String(formData[field.key] ?? '') === 'Hybridi' ? (
                                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <SelectField id="hybridType" label="Hybridityyppi" value={String(formData.hybridType ?? '')} onChange={handleChange('hybridType')} options={['Bensiini + sähkö', 'Diesel + sähkö', 'Muu hybridi']} />
                                    <label className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
                                      <input type="checkbox" checked={!!formData.plugInHybrid} onChange={(e) => handleChange('plugInHybrid')(e.target.checked)} className="h-4 w-4" />
                                      Plug-in (ladattava hybridi)
                                    </label>
                                  </div>
                                ) : null}
                              </div>
                            );
                          }
                          const selectedValue = field.key === 'engineSize' && formData.engineSize !== ''
                            ? `${Number(formData.engineSize).toFixed(1)} l`
                            : String(formData[field.key] ?? '');
                          return <SelectField key={field.key} id={field.key} label={field.label} value={selectedValue} onChange={handleChange(field.key)} options={field.options ?? []} />;
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
                          return <Textarea key={field.key} id={field.key} label={field.label} value={formData[field.key] ?? ''} onChange={handleChange(field.key)} maxLength={3000} />;
                        case 'image':
                          if (editId) {
                            return (
                              <div key={field.key}>
                                <p className="text-sm text-slate-600">Tallennetut kuvat säilytetään muokkauksen yhteydessä. Kuvien lisääminen tai poistaminen ei ole käytössä tässä näkymässä.</p>
                                {uploadedImages.length > 0 ? (
                                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {uploadedImages.map((image, index) => (
                                      <div key={image.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                        <img src={image.url} alt={`Ilmoituksen kuva ${index + 1}`} className="h-24 w-full rounded-md object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">Ilmoituksella ei ole tallennettuja kuvia.</p>
                                )}
                              </div>
                            );
                          }
                          return <ImageUpload key={field.key} images={formData.images ?? []} uploadedImages={uploadedImages} onAdd={handleAddImages} onRemove={handleRemoveImage} onRemoveUploaded={createdListingId ? handleRemoveUploadedImage : undefined} onReorder={handleReorderImages} error={imageError} />;
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
              <button type="submit" disabled={isSubmitting} className="flex-1 rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#0ca4dd] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Tallennetaan...' : editId ? 'Tallenna muutokset' : 'Tallenna luonnos'}
              </button>
              {createdListingId && !editId ? (
                <PublishListingButton
                  listingId={createdListingId}
                  disabled={Boolean(publishValidationMessage) || isSubmitting}
                  disabledMessage={publishValidationMessage}
                />
              ) : null}
              <Link href={editId ? '/account' : '/ilmoitus/uusi'} className="flex-1 rounded-[28px] border border-slate-300 px-6 py-3 text-center font-semibold text-slate-900 hover:bg-slate-50">Peruuta</Link>
            </div>
            {submitMessage ? (<div className="rounded-[24px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{submitMessage}</div>) : null}
            {submitError ? (<div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div>) : null}
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
