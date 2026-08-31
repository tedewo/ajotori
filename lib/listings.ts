export type SellerType = 'private' | 'company';

export interface Listing {
  id: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  title: string;
  year: number;
  price: number;
  mileage?: number;
  powerSource: string;
  transmission: string;
  province: string;
  municipality: string;
  images: string[];
  description: string;
  technicalSpecs: Record<string, string>;
  features: string[];
  sellerType: SellerType;
  sellerName: string;
  sellerPhone?: string;
  sellerEmail?: string;
  externalListingUrl?: string;
  createdAt: string;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(value?: number): string {
  if (!value) return '';
  return `${new Intl.NumberFormat('fi-FI').format(value)} km`;
}

export const mockListings: Listing[] = [
  {
    id: 'ford-focus-2018',
    category: 'autot',
    subcategory: 'henkiloautot',
    brand: 'Ford',
    model: 'Focus',
    title: 'Ford Focus 1.6 EcoBoost',
    year: 2018,
    price: 18900,
    mileage: 104500,
    powerSource: 'Bensiini',
    transmission: 'Manuaalinen',
    province: 'Uusimaa',
    municipality: 'Espoo',
    images: [
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Hyvin säilynyt ja huollettu perheauto, jossa on viimeisimmät huolto- ja vakuutustiedot kunnossa. Auto on käytetty arjen ajoon ja säilytetty talvisin sekä verhoilkuissa kiiltävä.',
    technicalSpecs: {
      Moottori: '1.6 EcoBoost 125 hv',
      Polttoaine: 'Bensiini',
      Vaihteisto: 'Manuaalinen 6-vaihteinen',
      Vetotapa: 'Etuveto',
      Väri: 'Musta',
    },
    features: ['Pysäköintitutka', 'Kamera', 'Säädettävä ohjauspyörä', 'Kunnon ilmastointi', 'Autonäyttö'],
    sellerType: 'private',
    sellerName: 'Mika K.',
    sellerPhone: '+358 40 123 4567',
    createdAt: '2026-08-15T09:00:00.000Z',
  },
  {
    id: 'volvo-xc60-2020',
    category: 'autot',
    subcategory: 'henkiloautot',
    brand: 'Volvo',
    model: 'XC60',
    title: 'Volvo XC60 2.0 D4 Momentum',
    year: 2020,
    price: 38900,
    mileage: 88300,
    powerSource: 'Diesel',
    transmission: 'Automaattinen',
    province: 'Pirkanmaa',
    municipality: 'Tampere',
    images: [
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Säästeliäs ja turvallinen SUV, joka on pitkään huollettu ja siivottu pääsääntöisesti kaupunkiajossa. Auto sisältää laajan varustelun ja modernin infotainment-järjestelmän.',
    technicalSpecs: {
      Moottori: '2.0 D4 190 hv',
      Polttoaine: 'Diesel',
      Vaihteisto: 'Automaattinen 8-vaihteinen',
      Vetotapa: 'Neliveto',
      Väri: 'Harmaa',
    },
    features: ['Adapt. vakionopeudensäädin', 'Napaohjaus', 'Pysäköintiautonohjaus', 'LED-valot', 'Lämmityspenkit'],
    sellerType: 'company',
    sellerName: 'AutoAri Oy',
    sellerPhone: '+358 50 456 7890',
    externalListingUrl: 'https://www.automyymala.fi/myytavat/vollo/xc60/2020-12345',
    createdAt: '2026-08-29T11:30:00.000Z',
  },
  {
    id: 'mercedes-sprinter-2021',
    category: 'autot',
    subcategory: 'pakettiautot',
    brand: 'Mercedes-Benz',
    model: 'Sprinter',
    title: 'Mercedes-Benz Sprinter 314 CDI',
    year: 2021,
    price: 46200,
    mileage: 158000,
    powerSource: 'Diesel',
    transmission: 'Manuaalinen',
    province: 'Varsinais-Suomi',
    municipality: 'Turku',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Käyttöautoon sopiva sprinter, jolla on hyvä kuormatilavuus ja vakaa ajo-ominaisuus. Vasta huollettu ja valmistelussa myyntiin.',
    technicalSpecs: {
      Moottori: '2.1 CDI 114 hv',
      Polttoaine: 'Diesel',
      Vaihteisto: 'Manuaalinen 6-vaihteinen',
      Kuorma: '4,2 m³',
      Väri: 'Valkea',
    },
    features: ['Kaksiosainen takaovi', 'Lämpöeristetty', 'Jarrutuki', 'Säädettävä istuin', 'Työvalot'],
    sellerType: 'company',
    sellerName: 'Kaupunkikuljetus Oy',
    externalListingUrl: 'https://www.kaupunkikuljetus.fi/ajoneuvot/mb-sprinter-314/2021',
    createdAt: '2026-08-10T08:00:00.000Z',
  },
  {
    id: 'john-deere-6120r-2017',
    category: 'maatalouskoneet',
    subcategory: 'traktorit',
    brand: 'John Deere',
    model: '6120R',
    title: 'John Deere 6120R Premium',
    year: 2017,
    price: 89400,
    mileage: 2610,
    powerSource: 'Diesel',
    transmission: 'Automaattinen',
    province: 'Pohjanmaa',
    municipality: 'Seinäjoki',
    images: [
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1592838371646-9d16ae7fb3d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534569685562-28431d1f1411?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Korkeatasoinen traktori, joka on valmisteltu vaativaan maa- ja metsätöihin. Hyvä luokittelu, hyvä seisonti ja huoltokirja mukana.',
    technicalSpecs: {
      Teho: '140 hv',
      Polttoaine: 'Diesel',
      Vaihteisto: 'IVT',
      Telimalli: '4x4',
      Vuosimalli: '2017',
    },
    features: ['Jarrutusteho', 'PTO', 'Korkeahko istuin', 'Avaruus', 'Kaasutin'],
    sellerType: 'private',
    sellerName: 'Timo H.',
    sellerPhone: '+358 44 889 3344',
    createdAt: '2026-08-20T13:15:00.000Z',
  },
  {
    id: 'massey-ferguson-6713-2020',
    category: 'maatalouskoneet',
    subcategory: 'traktorit',
    brand: 'Massey Ferguson',
    model: '6713',
    title: 'Massey Ferguson 6713',
    year: 2020,
    price: 76000,
    mileage: 1450,
    powerSource: 'Diesel',
    transmission: 'Manuaalinen',
    province: 'Keski-Suomi',
    municipality: 'Jyväskylä',
    images: [
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Käytetty maanviljelyyn tarkoitettu traktori, jolla tehokas mutta tasainen suorituskyky. Käytössä pääasiassa kyntö- ja puintityössä.',
    technicalSpecs: {
      Teho: '130 hv',
      Polttoaine: 'Diesel',
      Vaihteisto: 'Manuaalinen 12/12',
      Telimalli: '4x4',
      Väri: 'Sininen',
    },
    features: ['PTO', 'Kytkin', 'Kuumennin', 'Korkea ohjaamo', 'Kokemusta'],
    sellerType: 'company',
    sellerName: 'MaatalousKoneet Oy',
    externalListingUrl: 'https://www.maatalouskoneet.fi/tuotteet/massey-ferguson-6713/2020',
    createdAt: '2026-08-04T12:00:00.000Z',
  },
  {
    id: 'yamaha-r1-2022',
    category: 'pienkoneet',
    subcategory: 'moottoripyorat',
    brand: 'Yamaha',
    model: 'R1',
    title: 'Yamaha YZF-R1 2022',
    year: 2022,
    price: 16200,
    mileage: 9800,
    powerSource: 'Bensiini',
    transmission: 'Manuaalinen',
    province: 'Uusimaa',
    municipality: 'Helsinki',
    images: [
      'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540317708786-5f6a3a0f3c5a?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Urheilu- ja kilpamoottoripyörä, jossa kovaa suorituskykyä ja sporttinen varustelu. Kunto on loistava ja ajettu lähinnä kesäkaudella.',
    technicalSpecs: {
      Moottori: '998 cm³',
      Polttoaine: 'Bensiini',
      Vaihteisto: '6-vaihteinen',
      Teho: '200 hv',
      Väri: 'Musta',
    },
    features: ['Ride-by-wire', 'ABS', 'Launch control', 'Öljynsäädin', 'Traction control'],
    sellerType: 'private',
    sellerName: 'Janne R.',
    createdAt: '2026-08-26T10:20:00.000Z',
  },
  {
    id: 'boat-alu-2021',
    category: 'veneet',
    subcategory: 'veneet',
    brand: 'Bayliner',
    model: '185',
    title: 'Bayliner 185 Bowrider',
    year: 2021,
    price: 36500,
    mileage: 230,
    powerSource: 'Bensiini',
    transmission: 'Automaattinen',
    province: 'Varsinais-Suomi',
    municipality: 'Naantali',
    images: [
      'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    ],
    description:
      'Loma- ja perheveneenä käytetty, hyvin säilynyt alus. Moottori sekä omistaja- ja huoltohistoria on dokumentoitu.',
    technicalSpecs: {
      Pituus: '5.5 m',
      Moottori: 'Mercury 90 hv',
      Vaihteisto: 'Automaattinen',
      Polttoaine: 'Bensiini',
      Väri: 'Valkea',
    },
    features: ['Katos', 'Säilytystila', 'Säädettävä penkki', 'Kaukosäädin', 'Kansitori'],
    sellerType: 'private',
    sellerName: 'Harri S.',
    createdAt: '2026-08-12T17:45:00.000Z',
  },
];

export function getListingById(listingId: string): Listing | undefined {
  return mockListings.find((listing) => listing.id === listingId);
}

export function getListingsForCategory(categorySlug?: string, subcategorySlug?: string): Listing[] {
  return mockListings.filter((listing) => {
    if (categorySlug && listing.category !== categorySlug) return false;
    if (subcategorySlug && listing.subcategory !== subcategorySlug) return false;
    return true;
  });
}
