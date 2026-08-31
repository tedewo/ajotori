"use client";

import { useState } from 'react';
import type { Listing } from '@/lib/listings';

export default function ListingGallery({ listing }: { listing: Listing }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = listing.images && listing.images.length > 0 ? listing.images : ['/icons/car.svg'];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <img src={images[activeIndex]} alt={listing.title} className="h-[360px] w-full object-cover md:h-[500px]" />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-2xl border transition ${
                index === activeIndex ? 'border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img src={image} alt={`${listing.title} ${index + 1}`} className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
