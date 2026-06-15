import React from 'react';

export default function ComingSoon() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <img src="/icons/logo.svg" alt="Ajotori" className="h-20 w-auto" />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">Ajotori</h1>

        <p className="mt-4 text-lg text-slate-700">Suomen uusi ajoneuvokauppapaikka avautuu pian.</p>

        <p className="mt-6 text-sm text-slate-600">Sivusto on tällä hetkellä kehitysvaiheessa.</p>

        <div className="mt-10 text-sm text-slate-600">© 2026 Ajotori</div>

        <div className="mt-8">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0ca4dd]"
          >
            Ota yhteyttä
          </a>
        </div>
      </div>
    </main>
  );
}
