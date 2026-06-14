import CategoryGrid from './CategoryGrid';

export default function CategoryPage({
  title,
  subtitle = 'Valitse ajoneuvotyyppi',
  categories,
}: {
  title: string;
  subtitle?: string;
  categories: { icon: string; title: string; href: string }[];
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto container-center py-10">
        <section className="max-w-4xl">
          <h1 className="text-3xl font-semibold leading-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          <CategoryGrid categories={categories} />
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
