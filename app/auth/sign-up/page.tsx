'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createBrowserClient, hasSupabaseConfig } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!hasSupabaseConfig()) {
      setError('Supabase-määritykset puuttuvat. Lisää NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env-tiedostoon.');
      setIsSubmitting(false);
      return;
    }

    const supabase = createBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError('Tämä sähköpostiosoite on jo käytössä.');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Tili luotu. Tarkista sähköpostisi vahvistuslinkki ennen kuin kirjaudut sisään.');
    setIsSubmitting(false);
    setEmail('');
    setPassword('');
    setDisplayName('');

    setTimeout(() => router.push('/auth/sign-in'), 2000);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-16">
      <div className="mx-auto max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ajotori</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Luo tili</h1>
        <p className="mt-3 text-sm text-slate-600">Rekisteröidy ilmoituksia varten.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Näyttönimi
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0ea5e9] focus:bg-white focus:ring-2 focus:ring-[#0ea5e91a]"
              placeholder="Matti Meikäläinen"
            />
          </label>

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
              minLength={6}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0ea5e9] focus:bg-white focus:ring-2 focus:ring-[#0ea5e91a]"
              placeholder="Vähintään 6 merkkiä"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}

          {success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0ca4dd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Luodaan tiliä...' : 'Luo tili'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Onko sinulla jo tili?{' '}
          <Link href="/auth/sign-in" className="font-semibold text-[#0ea5e9] hover:text-[#0ca4dd]">
            Kirjaudu sisään
          </Link>
        </p>
      </div>
    </main>
  );
}
