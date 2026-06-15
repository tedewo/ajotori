export interface Subcategory {
  icon: string;
  title: string;
  slug: string;
  href: string;
}

export interface Category {
  icon: string;
  title: string;
  slug: string;
  href: string;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    icon: '/icons/car.svg',
    title: 'Autot',
    slug: 'autot',
    href: '/autot',
    subcategories: [
      { icon: '/icons/car.svg', title: 'Henkilöautot', slug: 'henkiloautot', href: '/autot/henkiloautot' },
      { icon: '/icons/truck.svg', title: 'Pakettiautot', slug: 'pakettiautot', href: '/autot/pakettiautot' },
      { icon: '/icons/car.svg', title: 'Matkailuautot', slug: 'matkailuautot', href: '/autot/matkailuautot' },
      { icon: '/icons/truck.svg', title: 'Lava-autot', slug: 'lava-autot', href: '/autot/lava-autot' },
      { icon: '/icons/truck.svg', title: 'Kevyt kuorma-autot', slug: 'kevyet-kuorma-autot', href: '/autot/kevyet-kuorma-autot' },
      { icon: '/icons/truck.svg', title: 'Auton perävaunut', slug: 'auton-peravaunut', href: '/autot/auton-peravaunut' },
      { icon: '/icons/truck.svg', title: 'Mopoautot', slug: 'mopoautot', href: '/autot/mopoautot' },
    ],
  },
  {
    icon: '/icons/motorcycle.svg',
    title: 'Pienkoneet',
    slug: 'pienkoneet',
    href: '/pienkoneet',
    subcategories: [
      { icon: '/icons/motorcycle.svg', title: 'Moottoripyörät', slug: 'moottoripyorat', href: '/pienkoneet/moottoripyorat' },
      { icon: '/icons/motorcycle.svg', title: 'Mopot', slug: 'mopot', href: '/pienkoneet/mopot' },
      { icon: '/icons/motorcycle.svg', title: 'Skootterit', slug: 'skootterit', href: '/pienkoneet/skootterit' },
      { icon: '/icons/tractor.svg', title: 'Mönkijät', slug: 'monkijat', href: '/pienkoneet/monkijat' },
      { icon: '/icons/tractor.svg', title: 'Moottorikelkat', slug: 'moottorikelkat', href: '/pienkoneet/moottorikelkat' },
      { icon: '/icons/tractor.svg', title: 'Ruohonleikkurit', slug: 'ruohonleikkurit', href: '/pienkoneet/ruohonleikkurit' },
      { icon: '/icons/boat.svg', title: 'Muut pienkoneet', slug: 'muut-pienkoneet', href: '/pienkoneet/muut-pienkoneet' },
      { icon: '/icons/boat.svg', title: 'Pienkoneiden perävaunut', slug: 'pienkoneiden-peravaunut', href: '/pienkoneet/pienkoneiden-peravaunut' },
    ],
  },
  {
    icon: '/icons/tractor.svg',
    title: 'Maa- ja metsätalouskoneet',
    slug: 'maa-metsatalouskoneet',
    href: '/maa-metsatalouskoneet',
    subcategories: [
      { icon: '/icons/tractor.svg', title: 'Traktorit', slug: 'traktorit', href: '/maa-metsatalouskoneet/traktorit' },
      { icon: '/icons/tractor.svg', title: 'Puimurit', slug: 'puimurit', href: '/maa-metsatalouskoneet/puimurit' },
      { icon: '/icons/tractor.svg', title: 'Muut maatalouskoneet', slug: 'muut-maatalouskoneet', href: '/maa-metsatalouskoneet/muut-maatalouskoneet' },
      { icon: '/icons/tractor.svg', title: 'Traktorin lisälaitteet', slug: 'traktorin-lisalaitteet', href: '/maa-metsatalouskoneet/traktorin-lisalaitteet' },
      { icon: '/icons/tractor.svg', title: 'Traktorin perävaunut', slug: 'traktorin-peravaunut', href: '/maa-metsatalouskoneet/traktorin-peravaunut' },
      { icon: '/icons/tractor.svg', title: 'Metsätraktorit', slug: 'metsatraktorit', href: '/maa-metsatalouskoneet/metsatraktorit' },
      { icon: '/icons/excavator.svg', title: 'Harvesterit', slug: 'harvesterit', href: '/maa-metsatalouskoneet/harvesterit' },
      { icon: '/icons/excavator.svg', title: 'Muut metsäkoneet', slug: 'muut-metsakoneet', href: '/maa-metsatalouskoneet/muut-metsakoneet' },
    ],
  },
  {
    icon: '/icons/excavator.svg',
    title: 'Maanrakennus',
    slug: 'maanrakennus',
    href: '/maanrakennus',
    subcategories: [
      { icon: '/icons/excavator.svg', title: 'Kaivinkoneet', slug: 'kaivinkoneet', href: '/maanrakennus/kaivinkoneet' },
      { icon: '/icons/excavator.svg', title: 'Kurottajat', slug: 'kurrottajat', href: '/maanrakennus/kurrottajat' },
      { icon: '/icons/tractor.svg', title: 'Pyöräkuormaajat', slug: 'pyorakuormaajat', href: '/maanrakennus/pyorakuormaajat' },
      { icon: '/icons/truck.svg', title: 'Tienhoito', slug: 'tienhoito', href: '/maanrakennus/tienhoito' },
      { icon: '/icons/crane.svg', title: 'Nosturit', slug: 'nosturit', href: '/maanrakennus/nosturit' },
      { icon: '/icons/excavator.svg', title: 'Muut maanrakennuslaitteet', slug: 'muut-maanrakennuslaitteet', href: '/maanrakennus/muut-maanrakennuslaitteet' },
      { icon: '/icons/truck.svg', title: 'Maanrakennuslaitteiden perävaunut', slug: 'maanrakennuslaitteiden-peravaunut', href: '/maanrakennus/maanrakennuslaitteiden-peravaunut' },
    ],
  },
  {
    icon: '/icons/truck.svg',
    title: 'Kuorma-autot',
    slug: 'kuorma-autot',
    href: '/kuorma-autot',
    subcategories: [
      { icon: '/icons/truck.svg', title: 'Lavakuljetus', slug: 'lavakuljetus', href: '/kuorma-autot/lavakuljetus' },
      { icon: '/icons/truck.svg', title: 'Lavetit', slug: 'lavetit', href: '/kuorma-autot/lavetit' },
      { icon: '/icons/truck.svg', title: 'Puukuljetus', slug: 'puukuljetus', href: '/kuorma-autot/puukuljetus' },
      { icon: '/icons/truck.svg', title: 'Maansiirto', slug: 'maansiirto', href: '/kuorma-autot/maansiirto' },
      { icon: '/icons/truck.svg', title: 'Kappaletavara', slug: 'kappaletavara', href: '/kuorma-autot/kappaletavara' },
      { icon: '/icons/truck.svg', title: 'Kylmäkuljetus', slug: 'kylmakuljetus', href: '/kuorma-autot/kylmakuljetus' },
      { icon: '/icons/truck.svg', title: 'Hinaus', slug: 'hinaus', href: '/kuorma-autot/hinaus' },
      { icon: '/icons/truck.svg', title: 'Veturit', slug: 'veturit', href: '/kuorma-autot/veturit' },
      { icon: '/icons/bus.svg', title: 'Linja-autot', slug: 'linja-autot', href: '/kuorma-autot/linja-autot' },
      { icon: '/icons/truck.svg', title: 'Muu kuljetuskalusto', slug: 'muu-kuljetuskalusto', href: '/kuorma-autot/muu-kuljetuskalusto' },
      { icon: '/icons/truck.svg', title: 'Raskaat perävaunut', slug: 'raskaat-peravaunut', href: '/kuorma-autot/raskaat-peravaunut' },
    ],
  },
  {
    icon: '/icons/boat.svg',
    title: 'Muut ajoneuvot',
    slug: 'muut-ajoneuvot',
    href: '/muut-ajoneuvot',
    subcategories: [
      { icon: '/icons/boat.svg', title: 'Veneet', slug: 'veneet', href: '/muut-ajoneuvot/veneet' },
      { icon: '/icons/forklift.svg', title: 'Trukit', slug: 'trukit', href: '/muut-ajoneuvot/trukit' },
      { icon: '/icons/boat.svg', title: 'Muut ajoneuvot', slug: 'muut-ajoneuvot', href: '/muut-ajoneuvot/muut-ajoneuvot' },
      { icon: '/icons/truck.svg', title: 'Muut perävaunut', slug: 'muut-peravaunut', href: '/muut-ajoneuvot/muut-peravaunut' },
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(cat => cat.slug === slug);
}

export function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories.find(sub => sub.slug === subcategorySlug);
}
