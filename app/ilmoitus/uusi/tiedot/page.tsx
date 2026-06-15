'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';

function CreateListingDetailsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const subcategorySlug = searchParams.get('subcategory');

  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;
  const subcategory = categorySlug && subcategorySlug 
    ? getSubcategoryBySlug(categorySlug, subcategorySlug) 
    : null;

  if (!category || !subcategory) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Virheellinen kategoria tai alaluokka</h1>
        <Link href="/ilmoitus/uusi" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
          Aloita alusta
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto container-center py-10">
      <section className="max-w-2xl">
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
          
          <form className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
                Otsikko *
              </label>
              <input
                type="text"
                id="title"
                placeholder="Esim. Ford Transit 2020"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-2">
                Kuvaus *
              </label>
              <textarea
                id="description"
                placeholder="Kuvaa ajoneuvon kunto, varustelut ja muut oleelliset tiedot"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              ></textarea>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-900 mb-2">
                  Hinta (€) *
                </label>
                <input
                  type="number"
                  id="price"
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-slate-900 mb-2">
                  Vuosimalli
                </label>
                <input
                  type="number"
                  id="year"
                  placeholder="2020"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-slate-900 mb-2">
                  Ajokilometrit
                </label>
                <input
                  type="number"
                  id="mileage"
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-900 mb-2">
                  Sijainti *
                </label>
                <input
                  type="text"
                  id="location"
                  placeholder="Esim. Helsinki"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-500 px-6 py-3 text-center font-semibold text-white hover:bg-blue-600"
              >
                Julkaise ilmoitus
              </button>
              <Link
                href="/ilmoitus/uusi"
                className="flex-1 rounded-lg border border-slate-300 px-6 py-3 text-center font-semibold text-slate-900 hover:bg-slate-50"
              >
                Peruuta
              </Link>
            </div>
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
