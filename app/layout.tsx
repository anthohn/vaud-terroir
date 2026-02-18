import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Alegreya } from "next/font/google";

const fontMain = Alegreya({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-main",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
};

export const metadata: Metadata = {
  title: "VaudTerroir",
  description: "Application pour la découverte des produits du terroir vaudois",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${fontMain.className} ${fontMain.variable} antialiased text-gray-800`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}