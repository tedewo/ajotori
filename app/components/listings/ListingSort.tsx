type ListingSortProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ListingSort({ value, onChange }: ListingSortProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <span className="font-medium">Järjestä:</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0ea5e9]"
      >
        <option value="newest">Uusimmat</option>
        <option value="price-asc">Halvin ensin</option>
        <option value="price-desc">Kallein ensin</option>
        <option value="year-desc">Vuosimalli uusin</option>
        <option value="year-asc">Vuosimalli vanhin</option>
      </select>
    </label>
  );
}
