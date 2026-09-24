import Link from 'next/link';
import ListingDetails from '@/app/components/listings/ListingDetails';
import { getPublishedListingById } from '@/lib/listings-server';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublishedListingById(id);

  if (!listing) {
    return (
      <main className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-slate-900">Ilmoitusta ei löytynyt</h1>
          <p className="mt-3 text-slate-600">Ilmoitus on poistettu tai sitä ei ole julkaistu.</p>
          <Link href="/ilmoitukset" className="mt-6 inline-flex text-sm font-medium text-slate-700 hover:text-[#0ea5e9]">← Takaisin ilmoituksiin</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/ilmoitukset" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-[#0ea5e9]">
          ← Takaisin ilmoituksiin
        </Link>
      </div>
      <ListingDetails listing={listing} />
    </main>
  );
}
