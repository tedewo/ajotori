import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/excavator.svg', title: 'Kaivinkoneet', href: '/maanrakennus/kaivinkoneet' },
  { icon: '/icons/excavator.svg', title: 'Kurottajat', href: '/maanrakennus/kurrottajat' },
  { icon: '/icons/tractor.svg', title: 'Pyöräkuormaajat', href: '/maanrakennus/pyorakuormaajat' },
  { icon: '/icons/truck.svg', title: 'Tienhoito', href: '/maanrakennus/tienhoito' },
  { icon: '/icons/crane.svg', title: 'Nosturit', href: '/maanrakennus/nosturit' },
  { icon: '/icons/excavator.svg', title: 'Muut maanrakennuslaitteet', href: '/maanrakennus/muut-maanrakennuslaitteet' },
  { icon: '/icons/truck.svg', title: 'Maanrakennuslaitteiden perävaunut', href: '/maanrakennus/maanrakennuslaitteiden-peravaunut' },
];

export default function MaanrakennusPage() {
  return <CategoryPage title="Maanrakennus" categories={categories} />;
}
