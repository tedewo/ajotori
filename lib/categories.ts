export const SUBCATEGORY_SLUGS = {
  henkiloautot: 'henkiloautot',
  pakettiautot: 'pakettiautot',
  matkailuautot: 'matkailuautot',
  lavaautot: 'lava-autot',
  kevyetkuormaautot: 'kevyet-kuorma-autot',
  autonperavaunut: 'auton-peravaunut',
  mopoautot: 'mopoautot',
  moottoripyorat: 'moottoripyorat',
  mopot: 'mopot',
  skootterit: 'skootterit',
  monkijat: 'monkijat',
  moottorikelkat: 'moottorikelkat',
  ruohonleikkurit: 'ruohonleikkurit',
  muutpienkoneet: 'muut-pienkoneet',
  pienkoneidenperavaunut: 'pienkoneiden-peravaunut',
  traktorit: 'traktorit',
  puimurit: 'puimurit',
  muutmaatalouskoneet: 'muut-maatalouskoneet',
  traktorinlisalaitteet: 'traktorin-lisalaitteet',
  traktorinperavaunut: 'traktorin-peravaunut',
  metsatraktorit: 'metsatraktorit',
  harvesterit: 'harvesterit',
  muutmetsakoneet: 'muut-metsakoneet',
  kaivinkoneet: 'kaivinkoneet',
  kurrottajat: 'kurrottajat',
  pyorakuormaajat: 'pyorakuormaajat',
  tienhoito: 'tienhoito',
  nosturit: 'nosturit',
  muutmaanrakennuslaitteet: 'muut-maanrakennuslaitteet',
  maanrakennuslaitteidenperavaunut: 'maanrakennuslaitteiden-peravaunut',
  lavakuljetus: 'lavakuljetus',
  lavetit: 'lavetit',
  puukuljetus: 'puukuljetus',
  maansiirto: 'maansiirto',
  kappaletavara: 'kappaletavara',
  kylmakuljetus: 'kylmakuljetus',
  hinaus: 'hinaus',
  veturit: 'veturit',
  linjaautot: 'linja-autot',
  muukuljetuskalusto: 'muu-kuljetuskalusto',
  raskaatperavaunut: 'raskaat-peravaunut',
  veneet: 'veneet',
  trukit: 'trukit',
  muutajoneuvot: 'muut-ajoneuvot',
  muutperavaunut: 'muut-peravaunut',
} as const;

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
      { icon: '/icons/car.svg', title: 'Henkilöautot', slug: SUBCATEGORY_SLUGS.henkiloautot, href: '/autot/henkiloautot' },
      { icon: '/icons/truck.svg', title: 'Pakettiautot', slug: SUBCATEGORY_SLUGS.pakettiautot, href: '/autot/pakettiautot' },
      { icon: '/icons/car.svg', title: 'Matkailuautot', slug: SUBCATEGORY_SLUGS.matkailuautot, href: '/autot/matkailuautot' },
      { icon: '/icons/truck.svg', title: 'Lava-autot', slug: SUBCATEGORY_SLUGS.lavaautot, href: '/autot/lava-autot' },
      { icon: '/icons/truck.svg', title: 'Kevyt kuorma-autot', slug: SUBCATEGORY_SLUGS.kevyetkuormaautot, href: '/autot/kevyet-kuorma-autot' },
      { icon: '/icons/truck.svg', title: 'Auton perävaunut', slug: SUBCATEGORY_SLUGS.autonperavaunut, href: '/autot/auton-peravaunut' },
      { icon: '/icons/truck.svg', title: 'Mopoautot', slug: SUBCATEGORY_SLUGS.mopoautot, href: '/autot/mopoautot' },
    ],
  },
  {
    icon: '/icons/motorcycle.svg',
    title: 'Pienkoneet',
    slug: 'pienkoneet',
    href: '/pienkoneet',
    subcategories: [
      { icon: '/icons/motorcycle.svg', title: 'Moottoripyörät', slug: SUBCATEGORY_SLUGS.moottoripyorat, href: '/pienkoneet/moottoripyorat' },
      { icon: '/icons/motorcycle.svg', title: 'Mopot', slug: SUBCATEGORY_SLUGS.mopot, href: '/pienkoneet/mopot' },
      { icon: '/icons/motorcycle.svg', title: 'Skootterit', slug: SUBCATEGORY_SLUGS.skootterit, href: '/pienkoneet/skootterit' },
      { icon: '/icons/tractor.svg', title: 'Mönkijät', slug: SUBCATEGORY_SLUGS.monkijat, href: '/pienkoneet/monkijat' },
      { icon: '/icons/tractor.svg', title: 'Moottorikelkat', slug: SUBCATEGORY_SLUGS.moottorikelkat, href: '/pienkoneet/moottorikelkat' },
      { icon: '/icons/tractor.svg', title: 'Ruohonleikkurit', slug: SUBCATEGORY_SLUGS.ruohonleikkurit, href: '/pienkoneet/ruohonleikkurit' },
      { icon: '/icons/boat.svg', title: 'Muut pienkoneet', slug: SUBCATEGORY_SLUGS.muutpienkoneet, href: '/pienkoneet/muut-pienkoneet' },
      { icon: '/icons/boat.svg', title: 'Pienkoneiden perävaunut', slug: SUBCATEGORY_SLUGS.pienkoneidenperavaunut, href: '/pienkoneet/pienkoneiden-peravaunut' },
    ],
  },
  {
    icon: '/icons/tractor.svg',
    title: 'Maa- ja metsätalouskoneet',
    slug: 'maa-metsatalouskoneet',
    href: '/maa-metsatalouskoneet',
    subcategories: [
      { icon: '/icons/tractor.svg', title: 'Traktorit', slug: SUBCATEGORY_SLUGS.traktorit, href: '/maa-metsatalouskoneet/traktorit' },
      { icon: '/icons/tractor.svg', title: 'Puimurit', slug: SUBCATEGORY_SLUGS.puimurit, href: '/maa-metsatalouskoneet/puimurit' },
      { icon: '/icons/tractor.svg', title: 'Muut maatalouskoneet', slug: SUBCATEGORY_SLUGS.muutmaatalouskoneet, href: '/maa-metsatalouskoneet/muut-maatalouskoneet' },
      { icon: '/icons/tractor.svg', title: 'Traktorin lisälaitteet', slug: SUBCATEGORY_SLUGS.traktorinlisalaitteet, href: '/maa-metsatalouskoneet/traktorin-lisalaitteet' },
      { icon: '/icons/tractor.svg', title: 'Traktorin perävaunut', slug: SUBCATEGORY_SLUGS.traktorinperavaunut, href: '/maa-metsatalouskoneet/traktorin-peravaunut' },
      { icon: '/icons/tractor.svg', title: 'Metsätraktorit', slug: SUBCATEGORY_SLUGS.metsatraktorit, href: '/maa-metsatalouskoneet/metsatraktorit' },
      { icon: '/icons/excavator.svg', title: 'Harvesterit', slug: SUBCATEGORY_SLUGS.harvesterit, href: '/maa-metsatalouskoneet/harvesterit' },
      { icon: '/icons/excavator.svg', title: 'Muut metsäkoneet', slug: SUBCATEGORY_SLUGS.muutmetsakoneet, href: '/maa-metsatalouskoneet/muut-metsakoneet' },
    ],
  },
  {
    icon: '/icons/excavator.svg',
    title: 'Maanrakennus',
    slug: 'maanrakennus',
    href: '/maanrakennus',
    subcategories: [
      { icon: '/icons/excavator.svg', title: 'Kaivinkoneet', slug: SUBCATEGORY_SLUGS.kaivinkoneet, href: '/maanrakennus/kaivinkoneet' },
      { icon: '/icons/excavator.svg', title: 'Kurottajat', slug: SUBCATEGORY_SLUGS.kurrottajat, href: '/maanrakennus/kurrottajat' },
      { icon: '/icons/tractor.svg', title: 'Pyöräkuormaajat', slug: SUBCATEGORY_SLUGS.pyorakuormaajat, href: '/maanrakennus/pyorakuormaajat' },
      { icon: '/icons/truck.svg', title: 'Tienhoito', slug: SUBCATEGORY_SLUGS.tienhoito, href: '/maanrakennus/tienhoito' },
      { icon: '/icons/crane.svg', title: 'Nosturit', slug: SUBCATEGORY_SLUGS.nosturit, href: '/maanrakennus/nosturit' },
      { icon: '/icons/excavator.svg', title: 'Muut maanrakennuslaitteet', slug: SUBCATEGORY_SLUGS.muutmaanrakennuslaitteet, href: '/maanrakennus/muut-maanrakennuslaitteet' },
      { icon: '/icons/truck.svg', title: 'Maanrakennuslaitteiden perävaunut', slug: SUBCATEGORY_SLUGS.maanrakennuslaitteidenperavaunut, href: '/maanrakennus/maanrakennuslaitteiden-peravaunut' },
    ],
  },
  {
    icon: '/icons/truck.svg',
    title: 'Kuorma-autot',
    slug: 'kuorma-autot',
    href: '/kuorma-autot',
    subcategories: [
      { icon: '/icons/truck.svg', title: 'Lavakuljetus', slug: SUBCATEGORY_SLUGS.lavakuljetus, href: '/kuorma-autot/lavakuljetus' },
      { icon: '/icons/truck.svg', title: 'Lavetit', slug: SUBCATEGORY_SLUGS.lavetit, href: '/kuorma-autot/lavetit' },
      { icon: '/icons/truck.svg', title: 'Puukuljetus', slug: SUBCATEGORY_SLUGS.puukuljetus, href: '/kuorma-autot/puukuljetus' },
      { icon: '/icons/truck.svg', title: 'Maansiirto', slug: SUBCATEGORY_SLUGS.maansiirto, href: '/kuorma-autot/maansiirto' },
      { icon: '/icons/truck.svg', title: 'Kappaletavara', slug: SUBCATEGORY_SLUGS.kappaletavara, href: '/kuorma-autot/kappaletavara' },
      { icon: '/icons/truck.svg', title: 'Kylmäkuljetus', slug: SUBCATEGORY_SLUGS.kylmakuljetus, href: '/kuorma-autot/kylmakuljetus' },
      { icon: '/icons/truck.svg', title: 'Hinaus', slug: SUBCATEGORY_SLUGS.hinaus, href: '/kuorma-autot/hinaus' },
      { icon: '/icons/truck.svg', title: 'Veturit', slug: SUBCATEGORY_SLUGS.veturit, href: '/kuorma-autot/veturit' },
      { icon: '/icons/bus.svg', title: 'Linja-autot', slug: SUBCATEGORY_SLUGS.linjaautot, href: '/kuorma-autot/linja-autot' },
      { icon: '/icons/truck.svg', title: 'Muu kuljetuskalusto', slug: SUBCATEGORY_SLUGS.muukuljetuskalusto, href: '/kuorma-autot/muu-kuljetuskalusto' },
      { icon: '/icons/truck.svg', title: 'Raskaat perävaunut', slug: SUBCATEGORY_SLUGS.raskaatperavaunut, href: '/kuorma-autot/raskaat-peravaunut' },
    ],
  },
  {
    icon: '/icons/boat.svg',
    title: 'Muut ajoneuvot',
    slug: 'muut-ajoneuvot',
    href: '/muut-ajoneuvot',
    subcategories: [
      { icon: '/icons/boat.svg', title: 'Veneet', slug: SUBCATEGORY_SLUGS.veneet, href: '/muut-ajoneuvot/veneet' },
      { icon: '/icons/forklift.svg', title: 'Trukit', slug: SUBCATEGORY_SLUGS.trukit, href: '/muut-ajoneuvot/trukit' },
      { icon: '/icons/boat.svg', title: 'Muut ajoneuvot', slug: SUBCATEGORY_SLUGS.muutajoneuvot, href: '/muut-ajoneuvot/muut-ajoneuvot' },
      { icon: '/icons/truck.svg', title: 'Muut perävaunut', slug: SUBCATEGORY_SLUGS.muutperavaunut, href: '/muut-ajoneuvot/muut-peravaunut' },
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
