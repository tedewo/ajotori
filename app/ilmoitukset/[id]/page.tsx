import Link from 'next/link';
import { notFound } from 'next/navigation';
import ListingDetails from '@/app/components/listings/ListingDetails';
import { getListingById } from '@/lib/listings';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    notFound();
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
