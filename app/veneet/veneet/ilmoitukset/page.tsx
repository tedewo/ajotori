import { Suspense } from 'react';
import ListingIndexContent from '@/app/ilmoitukset/ListingIndexContent';

export default function VeneetListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexContent initialCategory="veneet" initialSubcategory="veneet" />
    </Suspense>
  );
}
