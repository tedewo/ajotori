import Link from 'next/link';
import CategoryPage from '../components/CategoryPage';
import { categories } from '@/lib/categories';

export default function VeneetPage() {
  const category = categories.find((item) => item.slug === 'veneet');
  const categoriesList = category?.subcategories.map((subcategory) => ({
    icon: subcategory.icon,
    title: subcategory.title,
    href: `${subcategory.href}/ilmoitukset`,
  })) ?? [];

  return (
    <div>
      <CategoryPage title="Veneet" categories={categoriesList} />
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <Link href="/ilmoitukset?category=veneet" className="inline-flex rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0ca4dd]">
          Selaa kaikkia veneilmoituksia
        </Link>
      </div>
    </div>
  );
}
