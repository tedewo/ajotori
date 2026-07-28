'use client';

import React from 'react';
import { BRAND_SUGGESTIONS, MODEL_SUGGESTIONS_BY_BRAND } from '@/lib/vehicleData';

type SmartTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  mode?: 'brand' | 'model';
  suggestionSource?: string;
};

export default function SmartTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  mode = 'brand',
  suggestionSource,
}: SmartTextFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const suggestions = React.useMemo(() => {
    if (mode === 'model') {
      const source = suggestionSource ? suggestionSource.trim() : '';
      const baseSuggestions = source ? MODEL_SUGGESTIONS_BY_BRAND[source] ?? [] : [];
      return baseSuggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase()));
    }

    return BRAND_SUGGESTIONS.filter((item) => item.toLowerCase().includes(value.toLowerCase()));
  }, [mode, suggestionSource, value]);

  const showSuggestions = isFocused && value.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-900">
        {label} {required ? '*' : ''}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 120)}
        placeholder={placeholder}
        className="w-full rounded-[24px] border border-slate-300 bg-white px-4 py-3 text-slate-900"
        required={required}
        autoComplete="off"
      />
      {showSuggestions ? (
        <ul className="absolute z-10 mt-2 w-full rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
          {suggestions.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="w-full rounded-[16px] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
