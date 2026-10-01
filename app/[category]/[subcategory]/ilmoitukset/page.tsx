import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ListingIndexContent from '@/app/ilmoitukset/ListingIndexContent';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';

export default async function SubcategoryListingsPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const categoryRecord = getCategoryBySlug(category);
  const subcategoryRecord = getSubcategoryBySlug(category, subcategory);

  if (!categoryRecord || !subcategoryRecord) notFound();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingIndexContent
        initialCategory={categoryRecord.slug}
        initialSubcategory={subcategoryRecord.slug}
      />
    </Suspense>
  );
}