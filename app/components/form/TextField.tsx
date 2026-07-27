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

export default function TextField({ id, label, value, onChange, placeholder, required }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-2">
        {label} {required ? '*' : ''}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
        required={required}
      />
    </div>
  );
}
