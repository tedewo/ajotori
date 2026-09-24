import { Suspense } from 'react';
import ListingIndexPage from '@/app/ilmoitukset/page';

export default function VeneetListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexPage initialCategory="veneet" initialSubcategory="veneet" />
    </Suspense>
  );
}
