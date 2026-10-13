import assert from 'node:assert/strict';
import { test } from 'node:test';

const listingContentModule = '../lib/listing-content' + '.ts';
const {
  getExternalListingUrlDisplayText,
  getSafeExternalListingUrl,
  normaliseExternalListingUrl,
  parseListingContent,
} = await import(
  new URL(listingContentModule, import.meta.url).href
);

test('accepts a complete HTTPS additional-information link', () => {
  const result = parseListingContent({ external_listing_url: 'https://esimerkki.fi' });

  assert.deepEqual(result, {
    data: {
      homepageDescription: null,
      description: '',
      externalListingUrl: 'https://esimerkki.fi',
    },
  });
});

test('adds HTTPS to a www additional-information link', () => {
  const result = parseListingContent({ external_listing_url: 'www.esimerkki.fi' });

  assert.ok('data' in result);
  assert.equal(result.data.externalListingUrl, 'https://www.esimerkki.fi');
});

test('accepts an empty optional additional-information link', () => {
  const result = parseListingContent({ external_listing_url: '  ' });

  assert.ok('data' in result);
  assert.equal(result.data.externalListingUrl, null);
});

test('rejects dangerous additional-information URL protocols', () => {
  assert.equal(normaliseExternalListingUrl('javascript:alert(1)'), undefined);
  assert.equal(normaliseExternalListingUrl('data:text/html,hello'), undefined);
  assert.equal(normaliseExternalListingUrl('ftp://esimerkki.fi'), undefined);
  assert.equal('error' in parseListingContent({ external_listing_url: 'javascript:alert(1)' }), true);
});

test('does not change validation for other existing external links', () => {
  assert.equal(getSafeExternalListingUrl('www.esimerkki.fi'), undefined);
  assert.equal(getSafeExternalListingUrl('https://esimerkki.fi'), 'https://esimerkki.fi');
});

test('accepts a 60-character short additional-information text', () => {
  const homepageDescription = 'a'.repeat(60);
  const result = parseListingContent({ homepage_description: homepageDescription });

  assert.ok('data' in result);
  assert.equal(result.data.homepageDescription, homepageDescription);
});

test('rejects short additional-information text longer than 60 characters', () => {
  const result = parseListingContent({ homepage_description: 'a'.repeat(61) });

  assert.equal('error' in result, true);
});

test('preserves an existing longer short description when it is not edited', () => {
  const homepageDescription = 'a'.repeat(75);
  const result = parseListingContent(
    { homepage_description: homepageDescription },
    { existingHomepageDescription: homepageDescription },
  );

  assert.ok('data' in result);
  assert.equal(result.data.homepageDescription, homepageDescription);
});

test('rejects a changed short description that exceeds 60 characters', () => {
  const result = parseListingContent(
    { homepage_description: 'a'.repeat(61) },
    { existingHomepageDescription: 'old text' },
  );

  assert.equal('error' in result, true);
});

test('shows the saved external URL without its protocol', () => {
  assert.equal(
    getExternalListingUrlDisplayText('https://www.kamux.fi/peravaunu/juhta'),
    'www.kamux.fi/peravaunu/juhta',
  );
});

test('does not display a link address for an empty or invalid URL', () => {
  assert.equal(getExternalListingUrlDisplayText(''), undefined);
  assert.equal(getExternalListingUrlDisplayText('javascript:alert(1)'), undefined);
});

test('keeps a valid HTTP URL available as the clickable link target', () => {
  const link = 'https://www.kamux.fi/peravaunu/juhta';
  assert.equal(getSafeExternalListingUrl(link), link);
});
