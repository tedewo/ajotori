import { Suspense } from 'react';
import ListingIndexPage from '@/app/ilmoitukset/page';

export default function HenkiloautotListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexPage />
    </Suspense>
  );
}
