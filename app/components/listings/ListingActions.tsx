'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListingActions({
  listingId,
  category,
  subcategory,
  isPublished,
}: {
  listingId: string;
  category: string;
  subcategory: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const deleteInFlight = useRef(false);

  const deleteListing = async () => {
    if (deleteInFlight.current) return;
    if (!window.confirm('Haluatko varmasti poistaa tämän ilmoituksen? Tätä toimintoa ei voi perua.')) return;

    deleteInFlight.current = true;
    setIsDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, { method: 'DELETE' });
      const result = (await response.json().catch(() => ({}))) as { error?: string; warning?: string };
      if (!response.ok) throw new Error(result.error || 'Ilmoituksen poistaminen epäonnistui.');
      if (result.warning) {
        window.alert(`Ilmoitus poistettiin onnistuneesti.\n\nVaroitus: ${result.warning}`);
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Ilmoituksen poistaminen epäonnistui.');
      deleteInFlight.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link
          href={`/ilmoitus/uusi/tiedot?edit=${encodeURIComponent(listingId)}&category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`}
          className="text-sm font-semibold text-slate-700 hover:text-[#0ea5e9]"
        >
          Muokkaa
        </Link>
        <button
          type="button"
          onClick={deleteListing}
          disabled={isDeleting}
          className="text-sm font-semibold text-rose-700 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Poistetaan...' : 'Poista'}
        </button>
        {isPublished ? (
          <Link href={`/ilmoitukset/${encodeURIComponent(listingId)}`} className="text-sm font-semibold text-[#0ea5e9] hover:text-[#0ca4dd]">
            Avaa ilmoitus
          </Link>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
