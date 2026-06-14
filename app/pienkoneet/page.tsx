import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/motorcycle.svg', title: 'Moottoripyörät', href: '/pienkoneet/moottoripyorat' },
  { icon: '/icons/motorcycle.svg', title: 'Mopot', href: '/pienkoneet/mopot' },
  { icon: '/icons/motorcycle.svg', title: 'Skootterit', href: '/pienkoneet/skootterit' },
  { icon: '/icons/tractor.svg', title: 'Mönkijät', href: '/pienkoneet/monkijat' },
  { icon: '/icons/tractor.svg', title: 'Moottorikelkat', href: '/pienkoneet/moottorikelkat' },
  { icon: '/icons/tractor.svg', title: 'Ruohonleikkurit', href: '/pienkoneet/ruohonleikkurit' },
  { icon: '/icons/boat.svg', title: 'Muut pienkoneet', href: '/pienkoneet/muut-pienkoneet' },
  { icon: '/icons/boat.svg', title: 'Pienkoneiden perävaunut', href: '/pienkoneet/pienkoneiden-peravaunut' },
];

export default function PienkoneetPage() {
  return <CategoryPage title="Pienkoneet" categories={categories} />;
}
