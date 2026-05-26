import { getAllPages } from "@/lib/pages";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami",
};

export default async function TentangKamiPage() {
  const pages = await getAllPages();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Tentang Kami</h1>
        <p className="mt-2 text-blue-200">
          Informasi seputar LIPAN RI — lembaga, pimpinan, dan struktur organisasi
        </p>
      </div>

      <div className="grid gap-3">
        {pages.map((page) => (
          <Link
            key={page.slug}
            href={`/tentang-kami/${page.slug}`}
            className="block p-4 rounded-lg border border-blue-100 hover:border-blue-400 hover:shadow-md hover:bg-blue-50/50 transition-all"
          >
            <h2 className="font-semibold text-blue-900">{page.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
