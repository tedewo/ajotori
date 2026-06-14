import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/tractor.svg', title: 'Traktorit', href: '/maa-metsatalouskoneet/traktorit' },
  { icon: '/icons/tractor.svg', title: 'Puimurit', href: '/maa-metsatalouskoneet/puimurit' },
  { icon: '/icons/tractor.svg', title: 'Muut maatalouskoneet', href: '/maa-metsatalouskoneet/muut-maatalouskoneet' },
  { icon: '/icons/tractor.svg', title: 'Traktorin lisälaitteet', href: '/maa-metsatalouskoneet/traktorin-lisalaitteet' },
  { icon: '/icons/tractor.svg', title: 'Traktorin perävaunut', href: '/maa-metsatalouskoneet/traktorin-peravaunut' },
  { icon: '/icons/tractor.svg', title: 'Metsätraktorit', href: '/maa-metsatalouskoneet/metsatraktorit' },
  { icon: '/icons/excavator.svg', title: 'Harvesterit', href: '/maa-metsatalouskoneet/harvesterit' },
  { icon: '/icons/excavator.svg', title: 'Muut metsäkoneet', href: '/maa-metsatalouskoneet/muut-metsakoneet' },
];

export default function MaaMetsaPage() {
  return <CategoryPage title="Maa- ja metsätalouskoneet" categories={categories} />;
}
