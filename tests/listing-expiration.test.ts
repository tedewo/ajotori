import assert from 'node:assert/strict';
import { test } from 'node:test';

const listingExpirationModule = '../lib/listing-expiration' + '.ts';
const { filterUnexpiredListings, getListingPublicationTimestamps, isListingUnexpiredAt } = await import(
  new URL(listingExpirationModule, import.meta.url).href
);

test('an unexpired listing remains visible just before its expiration instant', () => {
  const now = new Date('2027-01-19T23:45:12.344Z');

  assert.equal(isListingUnexpiredAt('2027-01-19T23:45:12.345Z', now), true);
});

test('a listing is not visible when expiration equals the current instant', () => {
  const now = new Date('2027-01-19T23:45:12.345Z');

  assert.equal(isListingUnexpiredAt('2027-01-19T23:45:12.345Z', now), false);
});

test('public listing filtering removes expired listings', () => {
  const now = new Date('2027-01-20T00:00:00.000Z');
  const listings = [
    { id: 'active', expires_at: '2027-01-20T00:00:00.001Z' },
    { id: 'expired', expires_at: '2027-01-19T23:59:59.999Z' },
  ];

  assert.deepEqual(filterUnexpiredListings(listings, now), [listings[0]]);
});

test('missing or invalid expiration timestamps fail closed for public visibility', () => {
  const now = new Date('2027-01-20T00:00:00.000Z');

  assert.equal(isListingUnexpiredAt(null, now), false);
  assert.equal(isListingUnexpiredAt('invalid', now), false);
  assert.equal(isListingUnexpiredAt('2027-01-21T00:00:00.000Z', new Date(Number.NaN)), false);
});

test('calculates publication, expiration, and renewal timestamps from one UTC instant', () => {
  const publishedAt = new Date('2026-12-20T23:45:12.345Z');
  const timestamps = getListingPublicationTimestamps(publishedAt);

  assert.deepEqual(timestamps, {
    published_at: '2026-12-20T23:45:12.345Z',
    expires_at: '2027-01-19T23:45:12.345Z',
    renewal_deadline: '2027-01-26T23:45:12.345Z',
  });
  assert.equal(
    Date.parse(timestamps.expires_at) - Date.parse(timestamps.published_at),
    30 * 24 * 60 * 60 * 1000,
  );
  assert.equal(
    Date.parse(timestamps.renewal_deadline) - Date.parse(timestamps.published_at),
    37 * 24 * 60 * 60 * 1000,
  );
});

test('rejects an invalid publication time', () => {
  assert.throws(
    () => getListingPublicationTimestamps(new Date(Number.NaN)),
    RangeError,
  );
});
