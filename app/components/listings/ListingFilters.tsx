import { categories } from '@/lib/categories';
import { getMunicipalitiesForProvince, PROVINCES } from '@/lib/locations';

export type ListingFilterState = {
  category: string;
  subcategory: string;
  province: string;
  municipality: string;
  brand: string;
  model: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  powerSource: string;
  transmission: string;
};

type ListingFiltersProps = {
  filters: ListingFilterState;
  onChange: (field: keyof ListingFilterState, value: string) => void;
  initialCategory?: string;
  initialSubcategory?: string;
};

export default function ListingFilters({
  filters,
  onChange,
  initialCategory,
  initialSubcategory,
}: ListingFiltersProps) {
  const selectedCategory = categories.find((category) => category.slug === (initialCategory || filters.category));
  const subcategories = selectedCategory?.subcategories ?? [];
  const municipalityOptions = filters.province ? getMunicipalitiesForProvince(filters.province) : [];

  const categoryOptions = categories.map((category) => ({
    value: category.slug,
    label: category.title,
  }));

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Rajaa ilmoituksia</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Pääkategoria</span>
          <select
            value={initialCategory || filters.category}
            onChange={(event) => {
              onChange('category', event.target.value);
              onChange('subcategory', '');
            }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
          >
            <option value="">Kaikki</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Alikategoria</span>
          <select
            value={initialSubcategory || filters.subcategory}
            onChange={(event) => onChange('subcategory', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            disabled={!(initialCategory || filters.category) && subcategories.length === 0}
          >
            <option value="">Kaikki</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Maakunta</span>
          <select
            value={filters.province}
            onChange={(event) => {
              onChange('province', event.target.value);
              onChange('municipality', '');
            }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
          >
            <option value="">Kaikki</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Kunta / kaupunki</span>
          <select
            value={filters.municipality}
            onChange={(event) => onChange('municipality', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            disabled={!filters.province}
          >
            <option value="">Kaikki</option>
            {municipalityOptions.map((municipality) => (
              <option key={municipality} value={municipality}>
                {municipality}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Merkki</span>
          <input
            value={filters.brand}
            onChange={(event) => onChange('brand', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="Esim. Ford"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Malli</span>
          <input
            value={filters.model}
            onChange={(event) => onChange('model', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="Esim. Focus"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Hinta min</span>
          <input
            type="number"
            min="0"
            value={filters.priceMin}
            onChange={(event) => onChange('priceMin', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="0"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Hinta max</span>
          <input
            type="number"
            min="0"
            value={filters.priceMax}
            onChange={(event) => onChange('priceMax', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="100000"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Vuosimalli min</span>
          <input
            type="number"
            min="1900"
            max="2100"
            value={filters.yearMin}
            onChange={(event) => onChange('yearMin', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="2015"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Vuosimalli max</span>
          <input
            type="number"
            min="1900"
            max="2100"
            value={filters.yearMax}
            onChange={(event) => onChange('yearMax', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
            placeholder="2025"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Käyttövoima</span>
          <select
            value={filters.powerSource}
            onChange={(event) => onChange('powerSource', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
          >
            <option value="">Kaikki</option>
            <option value="Bensiini">Bensiini</option>
            <option value="Diesel">Diesel</option>
            <option value="Sähkö">Sähkö</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block font-medium">Vaihteisto</span>
          <select
            value={filters.transmission}
            onChange={(event) => onChange('transmission', event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-[#0ea5e9] focus:bg-white"
          >
            <option value="">Kaikki</option>
            <option value="Automaattinen">Automaattinen</option>
            <option value="Manuaalinen">Manuaalinen</option>
            <option value="CVT">CVT</option>
          </select>
        </label>
      </div>
    </div>
  );
}
