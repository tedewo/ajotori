import { Suspense } from 'react';
import ListingIndexContent from '@/app/ilmoitukset/ListingIndexContent';

export default function HenkiloautotListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexContent initialCategory="autot" initialSubcategory="henkiloautot" />
    </Suspense>
  );
}
