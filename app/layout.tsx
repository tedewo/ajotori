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
      <body className="bg-slate-50 text-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
