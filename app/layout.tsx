import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AJOTORI - Vehicle Marketplace",
  description: "Find and sell vehicles easily",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
