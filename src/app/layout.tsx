import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading-family",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lipan-ri.com"),
  title: {
    default: "LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    template: "%s | LIPAN RI",
  },
  description:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia. Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "LIPAN RI",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${jakarta.variable} font-sans min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
