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
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        warning?: string;
        pendingImagePaths?: string[];
        imageCleanup?: {
          status?: 'success' | 'failed';
          reason?: string;
          error?: { message?: string; status?: number; statusCode?: string; code?: string };
          removedCount?: number;
        };
      };
      if (!response.ok) throw new Error(result.error || 'Ilmoituksen poistaminen epäonnistui.');
      if (result.warning) {
        const cleanupReason = result.imageCleanup?.reason;
        const reasonMessage = cleanupReason === 'missing_service_role_key'
          ? 'Palvelimen SUPABASE_SERVICE_ROLE_KEY-asetus puuttuu.'
          : cleanupReason === 'missing_supabase_url'
            ? 'Palvelimen NEXT_PUBLIC_SUPABASE_URL-asetus puuttuu.'
            : cleanupReason === 'storage_api_rejected'
              ? 'Supabase Storage hylkäsi poistopyynnön.'
              : cleanupReason === 'storage_client_error'
                ? 'Storage-asiakkaan tai verkkoyhteyden virhe.'
                : '';
        const details = result.imageCleanup?.error;
        const errorDetails = details
          ? [
              details.message,
              details.status === undefined ? null : `HTTP ${details.status}`,
              details.statusCode ? `statusCode ${details.statusCode}` : null,
              details.code ? `code ${details.code}` : null,
            ].filter(Boolean).join(' — ')
          : '';
        const paths = result.pendingImagePaths?.length
          ? `\n\nKuvien polut:\n${result.pendingImagePaths.join('\n')}`
          : '';
        window.alert(
          `Ilmoitus poistettiin, mutta kuvien siivous jäi kesken.\n\n${reasonMessage}\n${errorDetails}\n\n${result.warning}${paths}`,
        );
      } else if (result.imageCleanup?.status === 'success') {
        const removedCount = result.imageCleanup.removedCount ?? 0;
        window.alert(
          removedCount > 0
            ? `Ilmoitus ja sen ${removedCount} kuvaa poistettiin onnistuneesti.`
            : 'Ilmoitus poistettiin onnistuneesti. Ilmoituksella ei ollut kuvia.',
        );
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
