export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans p-10">
      
      {/* Logo */}
      <h1 className="text-5xl font-bold mb-3 text-sky-500">
        AJOTORI
      </h1>

      {/* Slogan */}
      <p className="text-lg text-gray-600 mb-12">
        Löydä ja myy ajoneuvot helposti
      </p>

      {/* Categories */}
      <div className="grid grid-cols-3 gap-5">

        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          🚗 Autot
        </div>
        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          🏍 Motot
        </div>
        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          🚜 Maatalouskoneet
        </div>
        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          🚧 Maanrakennuskoneet
        </div>
        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          🚛 Kuorma-autot
        </div>
        <div className="p-7 rounded-lg bg-slate-50 border border-slate-200 text-center text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-sky-500 hover:text-sky-500">
          📦 Muut
        </div>

      </div>

    </main>
  );
}
