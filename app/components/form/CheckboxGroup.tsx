'use client';

import React, { useState } from 'react';

export default function CheckboxGroup({ label, options = [], values = [], onChange }: { label: string; options: string[]; values: string[]; onChange: (vals: string[]) => void; }) {
  const [customValue, setCustomValue] = useState('');

  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };

  const addCustomValue = () => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setCustomValue('');
  };

  const removeCustomValue = (opt: string) => {
    onChange(values.filter((v) => v !== opt));
  };

  return (
    <div>
      <div className="block text-sm font-medium text-slate-900 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-4 py-3 text-sm font-medium transition ${checked ? 'border-[#0ea5e9] bg-[#0ea5e9] text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {values.filter((value) => value && !options.includes(value)).map((value) => (
          <span key={value} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {value}
            <button type="button" aria-label={`Poista ${value}`} onClick={() => removeCustomValue(value)} className="text-slate-500 hover:text-slate-900">×</button>
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3">
        <label htmlFor={`${label}-custom`} className="block text-sm font-medium text-slate-900">Lisää varuste</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={`${label}-custom`}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomValue();
              }
            }}
            placeholder="Esim. Nahkasisusta"
            className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
          />
          <button type="button" onClick={addCustomValue} className="rounded-[24px] bg-[#0ea5e9] px-4 py-3 text-sm font-semibold text-white">Lisää</button>
        </div>
      </div>
    </div>
  );
}
