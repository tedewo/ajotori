import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/tractor.svg', title: 'Traktorit', href: '/maatalouskoneet/traktorit' },
  { icon: '/icons/tractor.svg', title: 'Puimurit', href: '/maatalouskoneet/puimurit' },
  { icon: '/icons/tractor.svg', title: 'Muut maatalouskoneet', href: '/maatalouskoneet/muut-maatalouskoneet' },
  { icon: '/icons/tractor.svg', title: 'Traktorin lisälaitteet', href: '/maatalouskoneet/traktorin-lisalaitteet' },
  { icon: '/icons/tractor.svg', title: 'Traktorin perävaunut', href: '/maatalouskoneet/traktorin-peravaunut' },
];

export default function MaatalouskoneetPage() {
  return <CategoryPage title="Maatalouskoneet" categories={categories} />;
}
