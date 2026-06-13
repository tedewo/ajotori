export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-ajotori-600 text-xl font-bold text-white shadow-lg shadow-ajotori-200/50">
              A
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">AJOTORI</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Moderni ajoneuvomarkkina suomalaisille</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 sm:justify-end">
            <a href="#categories" className="transition hover:text-ajotori-600">Kategoriat</a>
            <a href="#featured" className="transition hover:text-ajotori-600">Suositellut</a>
            <a href="#contact" className="transition hover:text-ajotori-600">Yhteys</a>
            <a href="#" className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-200">Myy nopeasti</a>
          </nav>
        </header>

        <section className="mt-10 grid gap-10 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/50 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-ajotori-600">Osto ja myynti</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Löydä paras ajoneuvo tai julkaise luotettava myynti-ilmoitus.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">AJOTORI yhdistää myyjät ja ostajat läpinäkyvästi. Tutki ajoneuvoluokkia, suodata hakua ja ota yhteyttä helposti suoraan ilmoituksiin.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-[1.6fr_0.9fr]">
              <label className="relative block">
                <span className="sr-only">Haku</span>
                <input
                  type="search"
                  placeholder="Hae autoa, merkkiä tai paikkaa"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-ajotori-600 focus:ring-2 focus:ring-ajotori-100"
                />
              </label>
              <button className="inline-flex items-center justify-center rounded-3xl bg-ajotori-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-ajotori-700">
                Hae nyt
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-4 py-2">Suomalaiset myyjät</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">Nopeat vastaukset</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">Luotettavat kohteet</span>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] bg-gradient-to-br from-ajotori-500 to-sky-700 p-6 text-white shadow-lg shadow-ajotori-300/30">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-100">Suosittuja kategorioita</p>
              <div className="mt-6 grid gap-3">
                <span className="block rounded-3xl bg-white/10 px-4 py-4">Autot</span>
                <span className="block rounded-3xl bg-white/10 px-4 py-4">Kuorma-autot</span>
                <span className="block rounded-3xl bg-white/10 px-4 py-4">Maanrakennus</span>
              </div>
            </div>
            <div className="rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/40">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Myynti-ilmoitus valmiina</p>
              <p className="mt-3 text-slate-700">Julkaise ilmoitus muutamassa minuutissa ja tavoita ostajat ympäri Suomen.</p>
              <button className="mt-6 inline-flex items-center justify-center rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Käynnistä myynti
              </button>
            </div>
          </aside>
        </section>

        <section id="categories" className="mt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-ajotori-600">Kategorioita</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">Selaa ajoneuvoryhmiä</h3>
            </div>
            <a href="#" className="text-sm font-semibold text-ajotori-600 transition hover:text-ajotori-700">Näytä kaikki kategoriat</a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { icon: '🚗', title: 'Henkilöautot', description: 'Nopeat, luotettavat autot jokaiseen tarpeeseen.' },
              { icon: '🏍', title: 'Moottoripyörät', description: 'Valikoima kevyt- ja sporttipyöriä.' },
              { icon: '🚜', title: 'Maatalouskoneet', description: 'Traktorit ja työkoneet maatiloille.' },
              { icon: '🚧', title: 'Maanrakennuskoneet', description: 'Tehokkaat koneet työmaille.' },
              { icon: '🚛', title: 'Kuorma-autot', description: 'Kuljetuskalusto ja vaihtolavakuljetukset.' },
              { icon: '📦', title: 'Muut ajoneuvot', description: 'Erikoiskohteet ja varusteet.' },
            ].map((category) => (
              <article key={category.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-ajotori-500 hover:shadow-md">
                <div className="text-4xl">{category.icon}</div>
                <h4 className="mt-5 text-xl font-semibold">{category.title}</h4>
                <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="featured" className="mt-16 pb-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Suositellut myynti-ilmoitukset</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">Viimeisimmät ajoneuvot myynnissä</h3>
            </div>
            <a href="#" className="text-sm font-semibold text-ajotori-600 transition hover:text-ajotori-700">Näytä lisää</a>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {[
              { title: 'Mercedes-Benz C 220d', subtitle: 'Helsinki • 2019 • 150 000 km', price: '29 900 €' },
              { title: 'Volvo FM 420', subtitle: 'Tampere • 2021 • 450 000 km', price: '74 500 €' },
              { title: 'Case IH Puma 150', subtitle: 'Oulu • 2020 • 3 200 h', price: '69 000 €' },
            ].map((item) => (
              <article key={item.title} className="overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/40 transition hover:-translate-y-1">
                <div className="h-56 bg-slate-100 p-6 text-slate-400">
                  <div className="flex h-full flex-col justify-between">
                    <span className="text-sm uppercase tracking-[0.35em]">Esittely</span>
                    <p className="text-3xl font-semibold text-slate-950">{item.title}</p>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{item.subtitle}</p>
                  <p className="text-lg font-semibold text-slate-950">{item.price}</p>
                  <button className="w-full rounded-3xl bg-ajotori-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ajotori-700">Näytä ilmoitus</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
