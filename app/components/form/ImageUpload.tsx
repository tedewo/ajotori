'use client';

import React, { useRef } from 'react';

type Props = {
  images: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
  max?: number;
  maxMb?: number;
  error?: string;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ images, onAdd, onRemove, onReorder, max = 6, maxMb = 10, error }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (files: File[]) => {
    onAdd(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const files = Array.from(dt.files).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (files.length > 0) handleFiles(files);
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(from) && typeof onReorder === 'function') {
      onReorder(from, toIndex);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Maksimissaan {max} kuvaa. Maksimi {maxMb} Mt / kuva.</p>
        </div>
        <div className="text-sm text-slate-600">{`${images.length} / ${max} kuvaa lisätty`}</div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="mt-4 rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-lg font-medium text-slate-700">+ Lisää kuvia</div>
          <div className="text-sm text-slate-500">Vedä kuvat tähän tai valitse tiedostot</div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleChange} className="mt-3 hidden" />
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 rounded-md bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200">Valitse tiedostot</button>
        </div>
        <div className="mt-3 text-xs text-slate-400">{!images.length ? 'Ei kuvia lisättynä.' : images.length === 1 ? 'Ensimmäisestä kuvasta tulee ilmoituksen pääkuva.' : ''}</div>
        <div className="mt-2 text-xs text-slate-400">📸 Vinkki: Lisää ensimmäiseksi kuva, jossa koko ajoneuvo näkyy hyvin. Se toimii ilmoituksen pääkuvana ja näkyy hakutuloksissa.</div>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((file, i) => {
          const url = URL.createObjectURL(file);
          const sizeKb = Math.round(file.size / 1024);
          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              className="relative rounded-lg border border-slate-200 bg-slate-50 p-2"
            >
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-yellow-300 px-2 py-0.5 text-xs font-semibold">Pääkuva</span>
              )}
              <img src={url} alt={file.name} className="h-24 w-full object-cover rounded-md" />
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="truncate pr-2">{file.name}</div>
                <div className="text-slate-500">{sizeKb} KB</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => onRemove(i)} className="text-sm text-red-600">Poista</button>
                <div className="text-xs text-slate-500">Vedä järjestykseen</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
