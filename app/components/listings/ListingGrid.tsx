import type { Listing } from '@/lib/listings';
import ListingCard from './ListingCard';

export default function ListingGrid({ listings }: { listings: Listing[] }) {
  if (!listings.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        Ei hakuehtojen mukaisia ilmoituksia.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
