'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createBrowserClient, hasSupabaseConfig } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!hasSupabaseConfig()) {
      setError('Supabase-määritykset puuttuvat. Lisää NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env-tiedostoon.');
      setIsSubmitting(false);
      return;
    }

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-16">
      <div className="mx-auto max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ajotori</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Kirjaudu sisään</h1>
        <p className="mt-3 text-sm text-slate-600">Kirjaudu jatkaaksesi ilmoitusten hallintaa.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Sähköposti
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0ea5e9] focus:bg-white focus:ring-2 focus:ring-[#0ea5e91a]"
              placeholder="nimi@esimerkki.fi"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Salasana
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0ea5e9] focus:bg-white focus:ring-2 focus:ring-[#0ea5e91a]"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0ca4dd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Ei tiliä?{' '}
          <Link href="/auth/sign-up" className="font-semibold text-[#0ea5e9] hover:text-[#0ca4dd]">
            Luo tili
          </Link>
        </p>
      </div>
    </main>
  );
}
