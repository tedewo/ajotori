import Link from 'next/link';
import ComingSoon from '../components/ComingSoon';
import { COMING_SOON } from '../lib/featureFlags';

export default function Home() {
  if (COMING_SOON) return <ComingSoon />;

  return (
    <main className="min-h-screen">
      <div className="mx-auto container-center py-10">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-md">
            <p className="text-xs font-medium uppercase text-slate-500">OSTO JA MYYNTI</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">Löydä etsimäsi ajoneuvo tai myy vanha uuteen kotiin.</h1>

            <div className="mt-6 flex w-full gap-3">
              <label className="flex-1">
                <input
                  type="search"
                  aria-label="Hae ajoneuvoa"
                  placeholder="Hae autoa, merkkiä tai paikkaa"
                  className="w-full rounded-[28px] border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e91a]"
                />
              </label>
              <button className="rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0ca4dd]">Hae</button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="h-8 w-40 rounded-full bg-slate-100" aria-hidden="true"></span>
              <span className="h-8 w-32 rounded-full bg-slate-100" aria-hidden="true"></span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm h-56 flex items-center justify-center text-slate-400">
              <span>Mainosalue</span>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Myy ajoneuvosi helposti</h3>
                  <p className="mt-2 text-sm text-slate-600">Luo ilmoitus ilmaiseksi</p>
                </div>
                <button className="inline-flex items-center justify-center rounded-[28px] bg-[#0ea5e9] px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#0ca4dd]">
                  Luo ilmoitus
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900">Selaa ajoneuvoryhmiä</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '/icons/car.svg', title: 'Autot', href: '/autot' },
              { icon: '/icons/motorcycle.svg', title: 'Pienkoneet', href: '/pienkoneet' },
              { icon: '/icons/tractor.svg', title: 'Maa- ja metsätalouskoneet', href: '/maa-metsatalouskoneet' },
              { icon: '/icons/excavator.svg', title: 'Maanrakennuskoneet', href: '/maanrakennus' },
              { icon: '/icons/truck.svg', title: 'Kuorma-autot', href: '/kuorma-autot' },
              { icon: '/icons/boat.svg', title: 'Muut ajoneuvot', href: '/muut-ajoneuvot' },
            ].map((cat) => (
              cat.href ? (
                <Link key={cat.title} href={cat.href}>
                  <article className="flex items-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md">
                    <img src={cat.icon} alt="" className="h-12 w-12" />
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">{cat.title}</h4>
                    </div>
                  </article>
                </Link>
              ) : (
                <article key={cat.title} className="flex items-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md">
                  <img src={cat.icon} alt="" className="h-12 w-12" />
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{cat.title}</h4>
                  </article>
              )
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Muut tuoteryhmät</h3>
              <div className="mt-4 space-y-3">
                <a href="#" className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Renkaat ja vanteet</a>
                <a href="#" className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Varaosat</a>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Viimeisimmät julkaisut</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { image: '/icons/car.svg', title: 'Ford Transit', price: '32 500 €' },
                  { image: '/icons/tractor.svg', title: 'John Deere 6120', price: '89 000 €' },
                  { image: '/icons/motorcycle.svg', title: 'Honda CBR 650R', price: '9 200 €' },
                ].map((item) => (
                  <a key={item.title} href="#" className="group block rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                    <div className="flex items-center gap-4">
                      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-sm">
                        <img src={item.image} alt="" className="h-12 w-12" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#0ea5e9]">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.price}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900">Tietosuojaseloste</a>
              <a href="#" className="hover:text-slate-900">Käyttöehdot</a>
              <a href="#" className="hover:text-slate-900">Yhteystiedot</a>
            </div>
            <div>© 2026 Ajotori</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
                                  cat.href ? (
                                    <Link key={cat.title} href={cat.href}>
                                      <article className="flex items-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md">
                                        <img src={cat.icon} alt="" className="h-12 w-12" />
                                        <div>
                                          <h4 className="text-lg font-semibold text-slate-900">{cat.title}</h4>
                                        </div>
                                      </article>
                                    </Link>
                                  ) : (
                                    <article key={cat.title} className="flex items-center gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md">
                                      <img src={cat.icon} alt="" className="h-12 w-12" />
                                      <div>
                                        <h4 className="text-lg font-semibold text-slate-900">{cat.title}</h4>
                                      </article>
                                  )
                                ))}
                              </div>

                              <div className="mt-10 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                                  <h3 className="text-xl font-semibold text-slate-900">Muut tuoteryhmät</h3>
                                  <div className="mt-4 space-y-3">
                                    <a href="#" className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Renkaat ja vanteet</a>
                                    <a href="#" className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">Varaosat</a>
                                  </div>
                                </div>

                                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                                  <h3 className="text-xl font-semibold text-slate-900">Viimeisimmät julkaisut</h3>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {[
                                      { image: '/icons/car.svg', title: 'Ford Transit', price: '32 500 €' },
                                      { image: '/icons/tractor.svg', title: 'John Deere 6120', price: '89 000 €' },
                                      { image: '/icons/motorcycle.svg', title: 'Honda CBR 650R', price: '9 200 €' },
                                    ].map((item) => (
                                      <a key={item.title} href="#" className="group block rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                                        <div className="flex items-center gap-4">
                                          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-sm">
                                            <img src={item.image} alt="" className="h-12 w-12" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900 group-hover:text-[#0ea5e9]">{item.title}</p>
                                            <p className="mt-1 text-sm text-slate-600">{item.price}</p>
                                          </div>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </section>

                            <footer className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-600">
                              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex gap-4">
                                  <a href="#" className="hover:text-slate-900">Tietosuojaseloste</a>
                                  <a href="#" className="hover:text-slate-900">Käyttöehdot</a>
                                  <a href="#" className="hover:text-slate-900">Yhteystiedot</a>
                                </div>
                                <div>© 2026 Ajotori</div>
                              </div>
                            </footer>
                          </div>
                        </main>
                      );
                    }
