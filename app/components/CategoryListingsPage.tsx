import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import ListingIndexContent from '@/app/ilmoitukset/ListingIndexContent';
import { getCategoryBySlug } from '@/lib/categories';
import CategoryPage from './CategoryPage';

export default function CategoryListingsPage({
  categorySlug,
  children,
}: {
  categorySlug: string;
  children?: ReactNode;
}) {
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const subcategories = category.subcategories.map((subcategory) => ({
    icon: subcategory.icon,
    title: subcategory.title,
    href: categorySlug === 'metsatalouskoneet'
      ? subcategory.href
      : `${subcategory.href}/ilmoitukset`,
  }));

  return (
    <>
      <CategoryPage title={category.title} categories={subcategories} />
      {children}
      <ListingIndexContent initialCategory={category.slug} />
    </>
  );
}