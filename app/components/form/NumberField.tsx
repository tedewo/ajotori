'use client';

import React from 'react';

type Props = {
  id: string;
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
};

export default function NumberField({ id, label, value, onChange, placeholder, required }: Props) {
  const showOptionalHint = !required && label.toLowerCase().includes('valinnainen');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-2">
        {label} {required ? '*' : ''}
      </label>
      {showOptionalHint ? <p className="mb-2 text-xs text-slate-500">Valinnainen</p> : null}
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
        required={required}
      />
    </div>
  );
}
