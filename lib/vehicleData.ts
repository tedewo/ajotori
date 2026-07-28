export const BRAND_SUGGESTIONS = [
  'Toyota',
  'Volvo',
  'Scania',
  'Valtra',
  'John Deere',
  'Komatsu',
  'Ford',
  'Mercedes-Benz',
  'Volkswagen',
  'Massey Ferguson',
  'Case',
  'Caterpillar',
] as const;

export const MODEL_SUGGESTIONS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Hiace', 'Corolla', 'RAV4', 'Land Cruiser'],
  Volvo: ['V70', 'XC60', 'FH16', 'FMX'],
  Scania: ['P250', 'G410', 'R450', 'S500'],
  Valtra: ['N174', 'T174', 'Q series', 'S series'],
  'John Deere': ['6M', '8R', '9R', '6120M'],
  Komatsu: ['PC210', 'D65', 'WA380', 'CX210'],
  Ford: ['Transit', 'Focus', 'Ranger'],
  'Mercedes-Benz': ['Sprinter', 'Actros', 'A-Class'],
  Volkswagen: ['Transporter', 'Golf', 'Crafter'],
  'Massey Ferguson': ['5700', '7700', '8700'],
  Case: ['Maxxum', 'Puma', 'Farmall'],
  Caterpillar: ['320', 'D6', '950'],
};
