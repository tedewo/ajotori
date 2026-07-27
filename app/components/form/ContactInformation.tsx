'use client';

import React from 'react';

export default function ContactInformation({ phone, email, onPhone, onEmail }: { phone: string; email: string; onPhone: (v: string) => void; onEmail: (v: string) => void; }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Puhelinnumero *</label>
        <input value={phone} onChange={(e) => onPhone(e.target.value)} required className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Sähköpostiosoite *</label>
        <input type="email" value={email} onChange={(e) => onEmail(e.target.value)} required className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900" />
      </div>
    </div>
  );
}
