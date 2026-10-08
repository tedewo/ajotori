const MAX_HOMEPAGE_DESCRIPTION_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 3000;

function normaliseText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

export function parseListingContent(payload: Record<string, unknown>) {
  const rawHomepageDescription = payload.homepage_description;
  const rawDescription = payload.description;
  const rawDetails = payload.details;
  const homepageDescription = normaliseText(payload.homepage_description);
  const description = normaliseText(payload.description) ?? normaliseText(payload.details) ?? '';
  const rawExternalListingUrl = payload.external_listing_url;

  if (rawHomepageDescription !== undefined && rawHomepageDescription !== null && typeof rawHomepageDescription !== 'string') {
    return { error: 'Etusivun lisätietojen on oltava tekstiä.' } as const;
  }

  if (typeof rawHomepageDescription === 'string' && rawHomepageDescription.length > MAX_HOMEPAGE_DESCRIPTION_LENGTH) {
    return { error: 'Etusivun lisätiedot voivat olla enintään 200 merkkiä.' } as const;
  }

  if (
    (typeof rawDescription === 'string' && rawDescription.length > MAX_DESCRIPTION_LENGTH) ||
    (typeof rawDetails === 'string' && rawDetails.length > MAX_DESCRIPTION_LENGTH)
  ) {
    return { error: 'Kuvaus voi olla enintään 3000 merkkiä.' } as const;
  }

  let externalListingUrl: string | null = null;
  if (rawExternalListingUrl !== undefined && rawExternalListingUrl !== null) {
    if (typeof rawExternalListingUrl !== 'string') {
      return { error: 'Lisätietolinkin on oltava URL-osoite.' } as const;
    }

    externalListingUrl = rawExternalListingUrl.trim() || null;
    if (externalListingUrl) {
      if (/\s/.test(externalListingUrl)) {
        return { error: 'Lisätietolinkki ei ole kelvollinen URL-osoite.' } as const;
      }
      try {
        const parsedUrl = new URL(externalListingUrl);
        if (
          !/^https?:\/\//i.test(externalListingUrl) ||
          !['http:', 'https:'].includes(parsedUrl.protocol) ||
          !parsedUrl.hostname
        ) {
          return { error: 'Lisätietolinkin on oltava http- tai https-osoite.' } as const;
        }
      } catch {
        return { error: 'Lisätietolinkki ei ole kelvollinen URL-osoite.' } as const;
      }
    }
  }

  return {
    data: {
      homepageDescription,
      description,
      externalListingUrl,
    },
  } as const;
}
