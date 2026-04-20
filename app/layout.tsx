import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";
import { ChefHat, Network, Search } from "lucide-react";
import "@/app/globals.css";
import "@xyflow/react/dist/style.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Recipedia",
  description: "Curated recipe exploration for home cooks: cuisines, lineages, techniques, variations, and knowledge maps."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable}`}>
        <div className="site-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <span className="brand-mark">R</span>
                <span>Recipedia</span>
              </Link>
              <nav className="nav" aria-label="Primary navigation">
                <Link href="/">
                  <ChefHat size={16} /> Explore
                </Link>
                <Link href="/cuisines/italian">
                  <ChefHat size={16} /> Cuisines
                </Link>
                <Link href="/categories/burgers">
                  <ChefHat size={16} /> Families
                </Link>
                <Link href="/graph">
                  <Network size={16} /> Map
                </Link>
                <Link href="/admin/import">
                  <Search size={16} /> Import
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
