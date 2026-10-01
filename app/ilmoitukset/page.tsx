import ListingIndexContent from './ListingIndexContent';

export default async function ListingIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; subcategory?: string }>;
}) {
  return <ListingIndexContent searchParams={searchParams} />;
}
