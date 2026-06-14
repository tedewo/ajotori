import CategoryPage from '../components/CategoryPage';

export default function AutotPage() {
  const categories = [
    { icon: '/icons/car.svg', title: 'Henkilöautot', href: '/autot/henkiloautot' },
    { icon: '/icons/truck.svg', title: 'Pakettiautot', href: '/autot/pakettiautot' },
    { icon: '/icons/car.svg', title: 'Matkailuautot', href: '/autot/matkailuautot' },
    { icon: '/icons/truck.svg', title: 'Lava-autot', href: '/autot/lava-autot' },
    { icon: '/icons/truck.svg', title: 'Kevyt kuorma-autot', href: '/autot/kevyet-kuorma-autot' },
    { icon: '/icons/truck.svg', title: 'Auton perävaunut', href: '/autot/auton-peravaunut' },
    { icon: '/icons/truck.svg', title: 'Mopoautot', href: '/autot/mopoautot' },
  ];

  return <CategoryPage title="Autot" categories={categories} />;
}
