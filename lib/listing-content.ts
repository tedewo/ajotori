const MAX_HOMEPAGE_DESCRIPTION_LENGTH = 60;
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

export function getSafeExternalListingUrl(value?: string | null): string | undefined {
  if (!value || /\s/.test(value)) return undefined;

  try {
    const parsedUrl = new URL(value);
    if (
      !/^https?:\/\//i.test(value) ||
      !['http:', 'https:'].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname
    ) {
      return undefined;
    }

    return value;
  } catch {
    return undefined;
  }
}

export function getExternalListingUrlDisplayText(value?: string | null): string | undefined {
  return getSafeExternalListingUrl(value)?.replace(/^https?:\/\//i, '');
}

export function normaliseExternalListingUrl(value?: string | null): string | undefined {
  const trimmedValue = value?.trim();
  if (!trimmedValue || /\s/.test(trimmedValue)) return undefined;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  return getSafeExternalListingUrl(candidate);
}

export function parseListingContent(
  payload: Record<string, unknown>,
  options: { existingHomepageDescription?: string | null } = {},
) {
  const rawHomepageDescription = payload.homepage_description;
  const rawDescription = payload.description;
  const rawDetails = payload.details;
  const homepageDescription = typeof rawHomepageDescription === 'string' &&
    rawHomepageDescription.length > MAX_HOMEPAGE_DESCRIPTION_LENGTH &&
    rawHomepageDescription === options.existingHomepageDescription
    ? rawHomepageDescription
    : normaliseText(payload.homepage_description);
  const description = normaliseText(payload.description) ?? normaliseText(payload.details) ?? '';
  const rawExternalListingUrl = payload.external_listing_url;

  if (rawHomepageDescription !== undefined && rawHomepageDescription !== null && typeof rawHomepageDescription !== 'string') {
    return { error: 'Lyhyen lisätiedon on oltava tekstiä.' } as const;
  }

  if (
    typeof rawHomepageDescription === 'string' &&
    rawHomepageDescription.length > MAX_HOMEPAGE_DESCRIPTION_LENGTH &&
    rawHomepageDescription !== options.existingHomepageDescription
  ) {
    return { error: 'Lyhyt lisätieto voi olla enintään 60 merkkiä.' } as const;
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
      const safeUrl = normaliseExternalListingUrl(externalListingUrl);
      if (!safeUrl) {
        return { error: 'Lisätietolinkin on oltava kelvollinen http- tai https-osoite.' } as const;
      }
      externalListingUrl = safeUrl;
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
