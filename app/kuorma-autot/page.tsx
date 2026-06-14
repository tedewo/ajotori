import CategoryPage from '../components/CategoryPage';

const categories = [
  { icon: '/icons/truck.svg', title: 'Lavakuljetus', href: '/kuorma-autot/lavakuljetus' },
  { icon: '/icons/truck.svg', title: 'Lavetit', href: '/kuorma-autot/lavetit' },
  { icon: '/icons/truck.svg', title: 'Puukuljetus', href: '/kuorma-autot/puukuljetus' },
  { icon: '/icons/truck.svg', title: 'Maansiirto', href: '/kuorma-autot/maansiirto' },
  { icon: '/icons/truck.svg', title: 'Kappaletavara', href: '/kuorma-autot/kappaletavara' },
  { icon: '/icons/truck.svg', title: 'Kylmäkuljetus', href: '/kuorma-autot/kylmakuljetus' },
  { icon: '/icons/truck.svg', title: 'Hinaus', href: '/kuorma-autot/hinaus' },
  { icon: '/icons/truck.svg', title: 'Veturit', href: '/kuorma-autot/veturit' },
  { icon: '/icons/bus.svg', title: 'Linja-autot', href: '/kuorma-autot/linja-autot' },
  { icon: '/icons/truck.svg', title: 'Muu kuljetuskalusto', href: '/kuorma-autot/muu-kuljetuskalusto' },
  { icon: '/icons/truck.svg', title: 'Raskaat perävaunut', href: '/kuorma-autot/raskaat-peravaunut' },
];

export default function KuormaAutotPage() {
  return <CategoryPage title="Kuorma-autot" categories={categories} />;
}
