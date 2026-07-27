'use client';

import React from 'react';

const regions = ['Uusimaa', 'Pirkanmaa', 'Varsinais-Suomi', 'Keski-Suomi', 'Pohjois-Pohjanmaa'];
const citiesByRegion: Record<string, string[]> = {
  Uusimaa: ['Helsinki', 'Espoo', 'Vantaa'],
  Pirkanmaa: ['Tampere', 'Nokia', 'Valkeakoski'],
  'Varsinais-Suomi': ['Turku', 'Salo', 'Kaarina'],
  'Keski-Suomi': ['Jyväskylä', 'Jämsä', 'Äänekoski'],
  'Pohjois-Pohjanmaa': ['Oulu', 'Raahe', 'Kuusamo'],
};

export default function LocationSelector({ region, city, onRegion, onCity }: { region: string; city: string; onRegion: (v: string) => void; onCity: (v: string) => void; }) {
  const cityOptions = region ? citiesByRegion[region] ?? [] : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Maakunta</label>
        <select value={region} onChange={(e) => onRegion(e.target.value)} className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900">
          <option value="">Valitse maakunta</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Kaupunki / kunta</label>
        <select value={city} onChange={(e) => onCity(e.target.value)} disabled={!region} className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900">
          <option value="">Valitse kaupunki</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
