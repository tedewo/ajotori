'use client';

import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createBrowserClient, hasSupabaseConfig } from '@/lib/supabase/client';

export function AuthNav() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!hasSupabaseConfig()) {
      return;
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (!error) {
      setSession(null);
      router.push('/');
      router.refresh();
    }
  }

  if (loading) {
    return (
      <nav className="flex items-center gap-4 text-sm text-slate-500">
        <span>Ladataan…</span>
      </nav>
    );
  }

  if (!hasSupabaseConfig()) {
    return (
      <nav className="flex items-center gap-5">
        <Link href="/auth/sign-up" className="text-sm text-slate-700 hover:text-[#0ea5e9]">
          Luo tili
        </Link>
        <Link href="/auth/sign-in" className="ml-2 rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#0ca4dd]">
          Kirjaudu sisään
        </Link>
      </nav>
    );
  }

  if (session) {
    return (
      <nav className="flex items-center gap-5">
        <Link href="/account" className="text-sm text-slate-700 hover:text-[#0ea5e9]">
          Oma tili
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="ml-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-700"
        >
          Kirjaudu ulos
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-5">
      <Link href="/auth/sign-up" className="text-sm text-slate-700 hover:text-[#0ea5e9]">
        Luo tili
      </Link>
      <Link href="/auth/sign-in" className="ml-2 rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#0ca4dd]">
        Kirjaudu sisään
      </Link>
    </nav>
  );
}
