import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading-family",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lipan-ri.org"),
  title: {
    default: "LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    template: "%s | LIPAN RI",
  },
  description:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia. Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "LIPAN RI",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
