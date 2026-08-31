import type { Listing } from '@/lib/listings';
import { formatMileage, formatPrice } from '@/lib/listings';
import ListingGallery from './ListingGallery';
import SellerInfo from './SellerInfo';

export default function ListingDetails({ listing }: { listing: Listing }) {
  const technicalEntries = Object.entries(listing.technicalSpecs ?? {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_360px]">
        <div>
          <ListingGallery listing={listing} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{listing.brand}</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{listing.model}</h1>
            <p className="mt-1 text-lg text-slate-600">{listing.title}</p>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-bold text-slate-900">{formatPrice(listing.price)}</span>
            </div>

            <dl className="mt-5 space-y-3 text-sm text-slate-700">
              {listing.year && <div className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt>Vuosimalli</dt><dd className="font-medium text-slate-900">{listing.year}</dd></div>}
              {listing.mileage && <div className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt>Ajomäärä</dt><dd className="font-medium text-slate-900">{formatMileage(listing.mileage)}</dd></div>}
              {listing.powerSource && <div className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt>Käyttövoima</dt><dd className="font-medium text-slate-900">{listing.powerSource}</dd></div>}
              {listing.transmission && <div className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt>Vaihteisto</dt><dd className="font-medium text-slate-900">{listing.transmission}</dd></div>}
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt>Sijainti</dt><dd className="font-medium text-slate-900">{[listing.province, listing.municipality].filter(Boolean).join(', ')}</dd></div>
            </dl>
          </div>

          <SellerInfo listing={listing} />
        </aside>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Kuvaus</h2>
            <p className="mt-4 whitespace-pre-line text-slate-700">{listing.description}</p>
          </section>

          {technicalEntries.length > 0 && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Tekniset tiedot</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {technicalEntries.map(([key, value]) => (
                  <div key={key} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</p>
                    <p className="mt-1 font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {listing.features && listing.features.length > 0 && (
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Varusteet</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {listing.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Sijainti</h2>
            <p className="mt-3 text-slate-700">{listing.province} · {listing.municipality}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
