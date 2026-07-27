'use client';

import React from 'react';

export default function CheckboxGroup({ label, options = [], values = [], onChange }: { label: string; options: string[]; values: string[]; onChange: (vals: string[]) => void; }) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };

  return (
    <div>
      <div className="block text-sm font-medium text-slate-900 mb-2">{label}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-3 rounded-[24px] border border-slate-300 bg-white px-4 py-3">
            <input type="checkbox" checked={values.includes(opt)} onChange={() => toggle(opt)} className="h-4 w-4" />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
