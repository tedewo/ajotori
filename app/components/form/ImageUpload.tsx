'use client';

import React from 'react';

export default function ImageUpload({ images, onAdd, onRemove, max = 6, maxMb = 10 }: { images: File[]; onAdd: (files: File[]) => void; onRemove: (index: number) => void; max?: number; maxMb?: number; }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    onAdd(files);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Maksimissaan {max} kuvaa. Maksimi {maxMb} Mt / kuva.</p>
        </div>
        <div className="text-sm text-slate-600">{`${images.length} / ${max} kuvaa lisätty`}</div>
      </div>
      <label className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50 cursor-pointer">
        <div>Lisää kuvia</div>
        <input type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
      </label>
      {images.length > 0 && (
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          {images.map((img, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="truncate">{img.name}</div>
              <button type="button" onClick={() => onRemove(i)} className="text-sm text-red-600">Poista</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
