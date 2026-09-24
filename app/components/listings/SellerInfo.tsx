import type { Listing } from '@/lib/listings';

export default function SellerInfo({ listing }: { listing: Listing }) {
  const isCompany = listing.sellerType === 'company';

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">Myyjän tiedot</h3>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-900">Myyjä:</span> {listing.sellerName || 'Ei ilmoitettu'}
        </p>

        {isCompany && (
          <p>
            <span className="font-medium text-slate-900">Tyyppi:</span> Yritysmyyjä
          </p>
        )}

        {!isCompany && (
          <p>
            <span className="font-medium text-slate-900">Tyyppi:</span> Yksityinen myyjä
          </p>
        )}

        {listing.sellerPhone && (
          <p>
            <span className="font-medium text-slate-900">Puhelin:</span> {listing.sellerPhone}
          </p>
        )}

        {listing.sellerEmail && (
          <p>
            <span className="font-medium text-slate-900">Sähköposti:</span> {listing.sellerEmail}
          </p>
        )}

        {listing.externalListingUrl && (
          <a
            href={listing.externalListingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-800 transition hover:bg-slate-200"
          >
            Avaa yrityksen ilmoitus
          </a>
        )}
      </div>
    </div>
  );
}
