import assert from 'node:assert/strict';
import { test } from 'node:test';

const technicalSpecsModule = '../lib/technicalSpecs' + '.ts';
const { getTechnicalSpecEntries } = await import(
  new URL(technicalSpecsModule, import.meta.url).href
);

test('hides internal listing metadata from technical specifications', () => {
  const entries = getTechnicalSpecEntries(
    {
      external_listing_url: 'https://example.fi/listing',
      externalListingUrl: 'https://example.fi/other',
      homepage_description: 'Short description',
      homepageDescription: 'Another short description',
      color: 'blue',
    },
    {},
  );

  assert.deepEqual(entries, [['Väri', 'blue']]);
});
