import ListingIndexContent from './ListingIndexContent';

export default async function ListingIndexPage({
  searchParams,
}: {
  searchParams?: Promise<Partial<Record<string, string | string[]>>>;
}) {
  return <ListingIndexContent searchParams={searchParams} />;
}
