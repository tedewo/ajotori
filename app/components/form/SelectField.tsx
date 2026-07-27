'use client';

import React from 'react';

export default function SelectField({ id, label, value, onChange, options = [], disabled = false }: { id: string; label: string; value: string; onChange: (v: string) => void; options?: string[]; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-2">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900">
        <option value="">Valitse</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
