'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PublishListingButtonProps = {
  listingId: string;
  disabled?: boolean;
  disabledMessage?: string;
};

export default function PublishListingButton({ listingId, disabled = false, disabledMessage }: PublishListingButtonProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const publishListing = async () => {
    if (isPublishing || disabled) return;

    setIsPublishing(true);
    setError('');
    try {
      const response = await fetch(`/api/listings/${listingId}/publish`, { method: 'PATCH' });
      const result = (await response.json().catch(() => ({ error: 'Julkaisu epäonnistui.' }))) as {
        error?: string;
        listingId?: string;
      };

      if (!response.ok || !result.listingId) {
        throw new Error(result.error || 'Ilmoituksen julkaisu epäonnistui.');
      }

      router.push(`/ilmoitukset/${result.listingId}`);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Ilmoituksen julkaisu epäonnistui.');
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={publishListing}
        disabled={isPublishing || disabled}
        className="rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0ca4dd] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPublishing ? 'Julkaistaan...' : 'Julkaise ilmoitus'}
      </button>
      {error || disabledMessage ? <p className="max-w-xs text-left text-xs text-rose-700 sm:text-right">{error || disabledMessage}</p> : null}
    </div>
  );
}