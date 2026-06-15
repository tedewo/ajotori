'use client';

import Link from 'next/link';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import CategoryGrid from '@/app/components/CategoryGrid';
import { categories } from '@/lib/categories';

export default function CreateListingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <CreateListingHeader />
      
      <div className="mx-auto container-center py-10">
        <section className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900">
              Luo uusi ilmoitus
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Valitse ensin ajoneuvotyyppi kategorioista
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Vaihe 1: Valitse pääkategoria
            </h2>
            
            <CategoryGrid 
              categories={categories.map(cat => ({
                icon: cat.icon,
                title: cat.title,
                href: `/ilmoitus/uusi/${cat.slug}`,
              }))}
            />
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
    </main>
  );
}
