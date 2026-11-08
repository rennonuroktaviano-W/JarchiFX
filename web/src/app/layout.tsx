import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "JarchiFX — Kelas Trading Forex",
    template: "%s · JarchiFX",
  },
  description:
    "Kelas trading forex terstruktur dengan akses komunitas Discord melalui kode redeem otomatis.",
  openGraph: {
    title: "JarchiFX — Kelas Trading Forex",
    description:
      "Belajar forex dengan sistem, bukan tebak-tebakan. Akses komunitas Discord lewat kode redeem otomatis.",
    type: "website",
    locale: "id_ID",
    siteName: "JarchiFX",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-base text-ink">
        <a className="skip-link" href="#main">
          Langsung ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
