import { notFound, redirect } from 'next/navigation';
import { getCategoryBySlug, getSubcategoryBySlug } from '@/lib/categories';

export default function SubcategoryRedirect({
  categorySlug,
  subcategorySlug,
}: {
  categorySlug: string;
  subcategorySlug: string;
}) {
  const category = getCategoryBySlug(categorySlug);
  const subcategory = getSubcategoryBySlug(categorySlug, subcategorySlug);
  if (!category || !subcategory) notFound();

  return redirect(`${subcategory.href}/ilmoitukset`);
}