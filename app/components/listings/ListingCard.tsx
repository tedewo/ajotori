import Link from 'next/link';
import type { Listing } from '@/lib/listings';
import { formatMileage, formatPrice } from '@/lib/listings';

export default function ListingCard({ listing }: { listing: Listing }) {
  const primaryImage = listing.images?.[0] ?? '/icons/car.svg';
  const location = [listing.province, listing.municipality].filter(Boolean).join(', ');
  const details = [
    listing.mileage ? formatMileage(listing.mileage) : null,
    listing.powerSource || null,
    listing.transmission || null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/ilmoitukset/${listing.id}`}
      className="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
    >
      <div className="relative">
        <img
          src={primaryImage}
          alt={listing.title}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {listing.year}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-[#0ea5e9] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
          {formatPrice(listing.price)}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{listing.brand}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{listing.model}</h3>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-slate-600">
          {details.length > 0 ? (
            details.map((detail) => (
              <span key={detail} className="rounded-full bg-slate-100 px-2.5 py-1">
                {detail}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1">Tiedot julkaistaan myöhemmin</span>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <span>{location || 'Sijainti ilmoitetaan'}</span>
        </div>
      </div>
    </Link>
  );
}
