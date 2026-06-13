export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-sans p-10">
      
      {/* Logo */}
      <h1 className="text-5xl font-bold mb-3 text-[#0ea5e9]">
        AJOTORI
      </h1>

      {/* Slogan */}
      <p className="text-lg text-gray-600 mb-12">
        Löydä ja myy ajoneuvot helposti
      </p>

      {/* Categories */}
      <div className="grid grid-cols-3 gap-5">

        <div className="card">🚗 Autot</div>
        <div className="card">🏍 Motot</div>
        <div className="card">🚜 Maatalouskoneet</div>
        <div className="card">🚧 Maanrakennuskoneet</div>
        <div className="card">🚛 Kuorma-autot</div>
        <div className="card">📦 Muut</div>

      </div>

      {/* styles */}
      <style jsx>{`
        .card {
          padding: 28px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          text-align: center;
          font-size: 18px;
          cursor: pointer;
          transition: 0.2s;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: #0ea5e9;
          color: #0ea5e9;
        }
      `}</style>

    </main>
  );
}
