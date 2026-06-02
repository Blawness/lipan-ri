import Link from "next/link";

export function CtaKontak() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-navy-900">
        Ada Sengketa atau Dugaan Penyalahgunaan Aset Negara?
      </h2>
      <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
        Sampaikan laporan atau pertanyaan Anda. Kami hadir untuk masyarakat.
      </p>
      <Link
        href="/kontak"
        className="inline-flex items-center gap-2 mt-7 px-7 py-3 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
      >
        Hubungi Kami
      </Link>
    </section>
  );
}
