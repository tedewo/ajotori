import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/tractor.svg', title: 'Metsätraktorit', href: '/metsatalouskoneet/metsatraktorit' },
  { icon: '/icons/excavator.svg', title: 'Harvesterit', href: '/metsatalouskoneet/harvesterit' },
  { icon: '/icons/excavator.svg', title: 'Muut metsäkoneet', href: '/metsatalouskoneet/muut-metsakoneet' },
];

export default function MetsatalouskoneetPage() {
  return <CategoryPage title="Metsätalouskoneet" categories={categories} />;
}
