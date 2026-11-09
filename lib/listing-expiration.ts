const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function isListingUnexpiredAt(expiresAt: string | null | undefined, now: Date): boolean {
  if (!expiresAt || !Number.isFinite(now.getTime())) return false;

  const expirationTime = Date.parse(expiresAt);
  return Number.isFinite(expirationTime) && expirationTime > now.getTime();
}

export function filterUnexpiredListings<T extends { expires_at?: string | null }>(
  listings: T[],
  now: Date,
): T[] {
  return listings.filter((listing) => isListingUnexpiredAt(listing.expires_at, now));
}

export function getListingPublicationTimestamps(publishedAt: Date) {
  const publishedAtMilliseconds = publishedAt.getTime();
  if (!Number.isFinite(publishedAtMilliseconds)) {
    throw new RangeError('Publication time must be a valid date.');
  }

  return {
    published_at: new Date(publishedAtMilliseconds).toISOString(),
    expires_at: new Date(publishedAtMilliseconds + 30 * DAY_IN_MILLISECONDS).toISOString(),
    renewal_deadline: new Date(publishedAtMilliseconds + 37 * DAY_IN_MILLISECONDS).toISOString(),
  };
}
