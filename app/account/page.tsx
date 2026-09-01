import Link from 'next/link';

import { createServerClient, getCurrentUser } from '@/lib/supabase/server';

type AccountProfile = {
  display_name?: string | null;
  role?: string | null;
  seller_type?: string | null;
};

export default async function AccountPage() {
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!hasSupabase) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Oma tili</h1>
          <p className="mt-4 text-sm text-slate-600">
            Supabase-yhteys ei ole vielä määritetty. Aseta NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env-tiedostoon.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = await getCurrentUser();

  if (error || !data.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Et ole kirjautunut</h1>
          <p className="mt-4 text-sm text-slate-600">Kirjaudu sisään nähdäksesi tilisi tiedot.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/auth/sign-in" className="rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white">
              Kirjaudu sisään
            </Link>
            <Link href="/auth/sign-up" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Luo tili
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createServerClient();
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  const profile = profileData as AccountProfile | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Oma tili</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{profile?.display_name ?? data.user.email ?? 'Käyttäjä'}</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-[#0ea5e9] hover:text-[#0ca4dd]">Etusivulle</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sähköposti</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{data.user.email}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tili</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{profile?.role ?? 'user'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Myyjätyyppi</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{profile?.seller_type ?? 'private'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sähköpostivahvistus</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{data.user.email_confirmed_at ? 'Vahvistettu' : 'Odottaa vahvistusta'}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
