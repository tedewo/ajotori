import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJOTORI – Ajoneuvomarkkinapaikka",
  description: "AJOTORI auttaa sinua löytämään ja myymään ajoneuvoja nopeasti ja luotettavasti.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className="bg-[#f8fafc] text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <img src="/icons/logo.svg" alt="Ajotori" className="h-14 w-auto rounded-lg shadow-sm" />
                <p className="text-sm text-slate-500 hidden sm:block">Myy ja löydä ajoneuvot helposti</p>
              </div>

              <nav className="flex items-center gap-5">
                <a href="#" className="text-sm text-slate-700 hover:text-[#0ea5e9]">Luo tili</a>
                <a href="#" className="ml-2 rounded-full bg-[#0ea5e9] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#0ca4dd]">Kirjaudu sisään</a>
              </nav>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
