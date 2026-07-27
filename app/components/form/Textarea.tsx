'use client';

import React from 'react';

export default function Textarea({ id, label, value, onChange, maxLength = 3000 }: { id: string; label: string; value: string; onChange: (v: string) => void; maxLength?: number }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-2">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} rows={6} className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900" />
      <p className="mt-2 text-sm text-slate-500">{`${value.length} / ${maxLength} merkkiä`}</p>
    </div>
  );
}
