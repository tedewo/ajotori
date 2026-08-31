import Link from 'next/link';
import CategoryPage from '../components/CategoryPage';
import { categories } from '@/lib/categories';

export default function MaatalouskoneetPage() {
  const category = categories.find((item) => item.slug === 'maatalouskoneet');
  const categoriesList = category?.subcategories.map((subcategory) => ({
    icon: subcategory.icon,
    title: subcategory.title,
    href: `${subcategory.href}/ilmoitukset`,
  })) ?? [];

  return (
    <div>
      <CategoryPage title="Maatalouskoneet" categories={categoriesList} />
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <Link href="/ilmoitukset?category=maatalouskoneet" className="inline-flex rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0ca4dd]">
          Selaa kaikkia maatalouskoneilmoituksia
        </Link>
      </div>
    </div>
  );
}
