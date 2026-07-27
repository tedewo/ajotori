'use client';

import React from 'react';

export default function ProgressBar({ steps, active }: { steps: string[]; active: number }) {
  return (
    <nav className="sticky top-0 z-10 bg-slate-50 px-4 py-3 sm:rounded-b-lg sm:shadow-sm">
      <ol className="flex gap-3 overflow-auto">
        {steps.map((s, i) => {
          const status = i < active ? 'done' : i === active ? 'active' : 'upcoming';
          return (
            <li key={s} className={`px-3 py-2 rounded-full text-sm ${status === 'active' ? 'bg-[#0ea5e9] text-white' : status === 'done' ? 'bg-slate-200 text-slate-700' : 'bg-white text-slate-700'}`}>
              {s}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
