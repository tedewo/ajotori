import Link from 'next/link';

export default function AuthVerifyPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ajotori</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Vahvistus</h1>
        <p className="mt-4 text-sm text-slate-600">
          Jos sähköpostivahvistus on onnistunut, voit jatkaa kirjautumista.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/auth/sign-in" className="rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white">
            Kirjaudu sisään
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Etusivulle
          </Link>
        </div>
      </div>
    </main>
  );
}
