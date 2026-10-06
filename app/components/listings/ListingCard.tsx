import Link from 'next/link';
import type { Listing } from '@/lib/listings';
import { formatMileage, formatPrice } from '@/lib/listings';
import { formatTechnicalSpecValue } from '@/lib/technicalSpecs';

export default function ListingCard({ listing, returnTo }: { listing: Listing; returnTo: string }) {
  const primaryImage = listing.images?.[0] ?? '/icons/car.svg';
  const location = [listing.municipality, listing.province].filter((value) => value.trim()).join(' · ');
  const details = [
    listing.mileage !== undefined && Number.isFinite(listing.mileage) && listing.mileage > 0
      ? formatMileage(listing.mileage)
      : null,
    listing.powerSource.trim() ? formatTechnicalSpecValue(listing.powerSource) : null,
    listing.transmission.trim() ? formatTechnicalSpecValue(listing.transmission) : null,
  ].filter((detail): detail is string => Boolean(detail));

  return (
    <Link
      href={`/ilmoitukset/${listing.id}?${new URLSearchParams({ returnTo }).toString()}`}
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
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{listing.brand}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{listing.model}</h3>
          </div>
        </div>

        {details.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-slate-600">
            {details.map((detail) => (
              <span key={detail} className="rounded-full bg-slate-100 px-2.5 py-1">
                {detail}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="min-w-0 break-words text-sm text-slate-600">{location}</span>
          <span className="shrink-0 text-lg font-bold text-[#0ea5e9]">{formatPrice(listing.price)}</span>
        </div>
      </div>
    </Link>
  );
}
