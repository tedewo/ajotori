'use client';

import React from 'react';
import { PROVINCES, getMunicipalitiesForProvince } from '@/lib/locations';

type LocationSelectorProps = {
  province: string;
  municipality: string;
  onProvince: (value: string) => void;
  onMunicipality: (value: string) => void;
  provinceLabel?: string;
  municipalityLabel?: string;
  provincePlaceholder?: string;
  municipalityPlaceholder?: string;
};

export default function LocationSelector({
  province,
  municipality,
  onProvince,
  onMunicipality,
  provinceLabel = 'Maakunta',
  municipalityLabel = 'Kaupunki / kunta',
  provincePlaceholder = 'Valitse maakunta',
  municipalityPlaceholder = 'Valitse kaupunki tai kunta',
}: LocationSelectorProps) {
  const provinceOptions = React.useMemo(() => [...PROVINCES].sort((a, b) => a.localeCompare(b, 'fi')), []);
  const municipalityOptions = React.useMemo(() => {
    if (!province) return [];
    return [...getMunicipalitiesForProvince(province)].sort((a, b) => a.localeCompare(b, 'fi'));
  }, [province]);

  const handleProvinceChange = (value: string) => {
    onProvince(value);
    onMunicipality('');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900">{provinceLabel}</label>
        <select
          value={province}
          onChange={(event) => handleProvinceChange(event.target.value)}
          className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
        >
          <option value="">{provincePlaceholder}</option>
          {provinceOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900">{municipalityLabel}</label>
        <select
          value={municipality}
          onChange={(event) => onMunicipality(event.target.value)}
          disabled={!province}
          className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        >
          <option value="">{municipalityPlaceholder}</option>
          {municipalityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
