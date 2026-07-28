export const PROVINCES = [
  'Ahvenanmaa',
  'Etelä-Karjala',
  'Etelä-Pohjanmaa',
  'Etelä-Savo',
  'Kainuu',
  'Kanta-Häme',
  'Keski-Pohjanmaa',
  'Keski-Suomi',
  'Kymenlaakso',
  'Lappi',
  'Pohjanmaa',
  'Pohjois-Karjala',
  'Pohjois-Pohjanmaa',
  'Pohjois-Savo',
  'Pirkanmaa',
  'Päijät-Häme',
  'Satakunta',
  'Uusimaa',
  'Varsinais-Suomi',
] as const;

export const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = Object.freeze({
  Ahvenanmaa: ['Maarianhamina', 'Finström', 'Föglö', 'Geta', 'Hammarland', 'Jomala', 'Kumlinge', 'Lemland', 'Lumparland', 'Saltvik', 'Sund', 'Vårdö'],
  'Etelä-Karjala': ['Imatra', 'Lappeenranta', 'Lemi', 'Luumäki', 'Parikkala', 'Rautjärvi', 'Ruokolahti', 'Saari', 'Savitaipale', 'Taipalsaari', 'Valkeala', 'Villmanstrand'],
  'Etelä-Pohjanmaa': ['Alajärvi', 'Alavus', 'Evijärvi', 'Ilmajoki', 'Isojoki', 'Jalasjärvi', 'Kauhajoki', 'Kauhava', 'Kuortane', 'Kurikka', 'Lappajärvi', 'Seinäjoki', 'Soini', 'Teuva', 'Vimpeli', 'Ähtäri'],
  'Etelä-Savo': ['Hirvensalmi', 'Kangasniemi', 'Mikkeli', 'Mäntyharju', 'Pertunmaa', 'Pieksämäki', 'Punkaharju', 'Rantasalmi', 'Savonlinna', 'Sulkava', 'Virtasalmi'],
  Kainuu: ['Kajaani', 'Kuhmo', 'Puolanka', 'Ristijärvi', 'Sotkamo', 'Suomussalmi', 'Vuolijoki'],
  'Kanta-Häme': ['Forssa', 'Hämeenlinna', 'Janakkala', 'Riihimäki', 'Tammela', 'Ypäjä'],
  'Keski-Pohjanmaa': ['Halsua', 'Kannus', 'Kaustinen', 'Kokkola', 'Lestijärvi', 'Perho', 'Toholampi', 'Veteli'],
  'Keski-Suomi': ['Joutsa', 'Jyväskylä', 'Jämsä', 'Keuruu', 'Kuhmoinen', 'Kyyjärvi', 'Laukaa', 'Multia', 'Muurame', 'Petäjävesi', 'Saarijärvi', 'Toivakka', 'Uurainen', 'Äänekoski'],
  Kymenlaakso: ['Hamina', 'Kotka', 'Kouvola', 'Miehikkälä', 'Pyhtää', 'Virolahti'],
  Lappi: ['Enontekiö', 'Inari', 'Kemi', 'Kemijärvi', 'Keminmaa', 'Kittilä', 'Kolari', 'Muonio', 'Pello', 'Posio', 'Ranua', 'Rovaniemi', 'Salla', 'Savukoski', 'Simo', 'Sodankylä', 'Tervola', 'Utsjoki', 'Ylitornio'],
  Pohjanmaa: ['Kaskinen', 'Korsnäs', 'Kristinestad', 'Luoto', 'Maalahti', 'Mustasaari', 'Närpiö', 'Pedersören kunta', 'Vaasa', 'Vöyri'],
  'Pohjois-Karjala': ['Ilomantsi', 'Joensuu', 'Juuka', 'Kitee', 'Lieksa', 'Nurmes', 'Outokumpu', 'Polvijärvi', 'Rääkkylä', 'Tohmajärvi'],
  'Pohjois-Pohjanmaa': ['Haapajärvi', 'Haapavesi', 'Hailuoto', 'Ii', 'Kalajoki', 'Kempele', 'Kiiminki', 'Kostamus', 'Kuusamo', 'Liminka', 'Lumijoki', 'Merijärvi', 'Muhos', 'Nivala', 'Oulainen', 'Oulu', 'Pudasjärvi', 'Pyhäjoki', 'Pyhäjärvi', 'Pyhäntä', 'Raahe', 'Reisjärvi', 'Sievi', 'Siikajoki', 'Siikalatva', 'Taivalkoski', 'Tyrnävä', 'Utajärvi', 'Vihanti', 'Yli-Ii'],
  'Pohjois-Savo': ['Iisalmi', 'Juankoski', 'Kaavi', 'Keitele', 'Kiuruvesi', 'Kuopio', 'Lapinlahti', 'Leppävirta', 'Pielavesi', 'Rautalampi', 'Rautavaara', 'Siilinjärvi', 'Sonkajärvi', 'Suonenjoki', 'Tervo', 'Varkaus', 'Vesanto', 'Vieremä'],
  Pirkanmaa: ['Ikaalinen', 'Kangasala', 'Lempäälä', 'Mänttä-Vilppula', 'Nokia', 'Orivesi', 'Pirkkala', 'Punkalaidun', 'Tampere', 'Urjala', 'Valkeakoski', 'Vesilahti', 'Virrat', 'Ylöjärvi'],
  'Päijät-Häme': ['Artjärvi', 'Asikkala', 'Hartola', 'Heinola', 'Hollola', 'Kärkölä', 'Lahti', 'Orimattila', 'Padasjoki', 'Sysmä'],
  Satakunta: ['Eura', 'Eurajoki', 'Harjavalta', 'Honkajoki', 'Huittinen', 'Jämjjärvi', 'Kankaanpää', 'Karvia', 'Kokemäki', 'Merikarvia', 'Nakkila', 'Pomarkku', 'Pori', 'Rauma', 'Siikainen', 'Säkylä', 'Ulvila'],
  Uusimaa: ['Espoo', 'Helsinki', 'Hyvinkää', 'Järvenpää', 'Karkkila', 'Kauniainen', 'Kerava', 'Kirkkonummi', 'Lohja', 'Loviisa', 'Mäntsälä', 'Nurmijärvi', 'Pornainen', 'Porvoo', 'Riihimäki', 'Sipoo', 'Siuntio', 'Tuusula', 'Vantaa', 'Vihti'],
  'Varsinais-Suomi': ['Aura', 'Kaarina', 'Koski Tl', 'Kustavi', 'Kuusjoki', 'Laitila', 'Lieto', 'Loimaa', 'Marttila', 'Masku', 'Mynämäki', 'Naantali', 'Nousiainen', 'Oripää', 'Paimio', 'Parainen', 'Pyhäranta', 'Pöytyä', 'Raisio', 'Rusko', 'Salo', 'Sauvo', 'Somero', 'Taivassalo', 'Turku', 'Uusikaupunki', 'Vehmaa'],
});

export function getMunicipalitiesForProvince(province: string) {
  return MUNICIPALITIES_BY_PROVINCE[province] ?? [];
}
