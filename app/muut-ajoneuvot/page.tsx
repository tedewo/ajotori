import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/boat.svg', title: 'Veneet', href: '/muut-ajoneuvot/veneet' },
  { icon: '/icons/forklift.svg', title: 'Trukit', href: '/muut-ajoneuvot/trukit' },
  { icon: '/icons/boat.svg', title: 'Muut ajoneuvot', href: '/muut-ajoneuvot/muut-ajoneuvot' },
  { icon: '/icons/truck.svg', title: 'Muut perävaunut', href: '/muut-ajoneuvot/muut-peravaunut' },
];

export default function MuutAjoneuvotPage() {
  return <CategoryPage title="Muut ajoneuvot" categories={categories} />;
}
