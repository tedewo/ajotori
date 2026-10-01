import Link from 'next/link';
import CategoryListingsPage from '../components/CategoryListingsPage';

export default function VeneetPage() {
  return (
    <CategoryListingsPage categorySlug="veneet">
      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
        <Link href="/ilmoitukset?category=veneet" className="inline-flex rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0ca4dd]">
          Selaa kaikkia veneilmoituksia
        </Link>
      </div>
    </CategoryListingsPage>
  );
}
