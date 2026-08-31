import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/boat.svg', title: 'Veneet', href: '/veneet/veneet' },
];

export default function VeneetPage() {
  return <CategoryPage title="Veneet" categories={categories} />;
}
