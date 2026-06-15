'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CreateListingHeader from '@/app/components/CreateListingHeader';
import CategoryGrid from '@/app/components/CategoryGrid';
import { getCategoryBySlug } from '@/lib/categories';

export default function SelectSubcategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;
  
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return (
      <main className="min-h-screen bg-slate-50">
        <CreateListingHeader />
        <div className="mx-auto container-center py-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Kategoriaa ei löytynyt</h1>
            <Link href="/ilmoitus/uusi" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
              Takaisin kategoriavalintaan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <CreateListingHeader />
      
      <div className="mx-auto container-center py-10">
        <section className="max-w-4xl">
          <div className="mb-8">
            <button 
              onClick={() => router.back()}
              className="text-sm text-slate-600 hover:text-slate-900 mb-4"
            >
              ← Takaisin
            </button>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900">
              {category.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Valitse alaluokka jatkaaksesi ilmoituksen luomista
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Vaihe 2: Valitse alaluokka
            </h2>
            
            <CategoryGrid 
              categories={category.subcategories.map(sub => ({
                icon: sub.icon,
                title: sub.title,
                href: `/ilmoitus/uusi/tiedot?category=${categorySlug}&subcategory=${sub.slug}`,
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
