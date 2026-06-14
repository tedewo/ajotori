import Link from 'next/link';

type Cat = { icon: string; title: string; href: string };

export default function CategoryGrid({ categories }: { categories: Cat[] }) {
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <Link key={cat.title} href={cat.href}>
          <article className="flex items-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md">
            <img src={cat.icon} alt="" className="h-12 w-12" />
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{cat.title}</h4>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
