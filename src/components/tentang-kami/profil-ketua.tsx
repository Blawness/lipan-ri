"use client";

import {
    Quote,
    Target,
    Lightbulb,
    Camera,
    GraduationCap,
    Briefcase,
    Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ProfilKetuaContent } from "@/lib/page-content";
import { SafeImage } from "@/components/safe-image";

/**
 * Foto dokumentasi yang tampil di profil ketua — subset kolom tabel `media`,
 * diambil per album lewat `getMediaByAlbum` di server component.
 */
export type FotoDokumentasi = {
    id: number;
    url: string;
    altText: string | null;
};

/**
 * Satu baris riwayat pada linimasa. `utama` adalah jabatan/jurusan dan
 * `sekunder` institusi/perusahaan/organisasi — bentuk seragam supaya tiga
 * daftar dengan nama field berbeda bisa memakai satu komponen.
 */
type RiwayatItem = { tahun: string; utama: string; sekunder: string };

function Riwayat({ items }: { items: RiwayatItem[] }) {
    return (
        <ol className="relative space-y-4 border-l border-navy-100 pl-5">
            {items.map((item, i) => (
                <li key={i} className="relative">
                    <span
                        className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-gold-400"
                        aria-hidden="true"
                    />
                    <p className="text-xs font-semibold tracking-wide text-gold-600">
                        {item.tahun}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-navy-900">
                        {item.utama}
                    </p>
                    <p className="text-sm leading-snug text-muted-foreground">
                        {item.sekunder}
                    </p>
                </li>
            ))}
        </ol>
    );
}

function BackgroundFigure({
    side,
    imageSrc,
}: {
    side: "left" | "right";
    imageSrc: string;
}) {
    const position = side === "left" ? "-left-10" : "-right-10";
    const mask =
        side === "left"
            ? "linear-gradient(to right, black 0%, black 42%, rgba(0,0,0,0.65) 68%, transparent 100%)"
            : "linear-gradient(to left, black 0%, black 42%, rgba(0,0,0,0.65) 68%, transparent 100%)";

    return (
        <div
            className={`pointer-events-none absolute inset-y-0 ${position} hidden w-[50%] overflow-hidden md:block`}
            aria-hidden="true"
            style={{ WebkitMaskImage: mask, maskImage: mask }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal dari Wikimedia Commons */}
            <img
                src={imageSrc}
                alt=""
                className="h-full w-full object-cover object-top opacity-34 saturate-75 contrast-95"
                style={{
                    objectPosition: side === "left" ? "0% top" : "100% top",
                }}
            />
            <div className="absolute inset-0 bg-navy-900/35" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-900 via-navy-900/70 to-transparent" />
        </div>
    );
}

function Section({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

export function ProfilKetua({
    data,
    galeri = [],
}: {
    data: ProfilKetuaContent;
    galeri?: FotoDokumentasi[];
}) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Section delay={0}>
                <div className="mb-8">
                    <div className="mb-6 text-center">
                        <div className="mb-2 flex items-center justify-center gap-2">
                            <span className="h-px w-6 bg-gold-400/60" />
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
                                Profil Ketua Umum
                            </p>
                            <span className="h-px w-6 bg-gold-400/60" />
                        </div>
                        <h1 className="font-heading text-2xl font-extrabold leading-tight text-navy-950 md:text-3xl">
                            {data.nama}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Ketua Umum LIPAN-RI · Putra Asli Banyumas
                        </p>
                        {data.lahir && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Lahir: {data.lahir}
                            </p>
                        )}
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 px-8 pb-8 pt-36 border-l-4 border-gold-400">
                        <BackgroundFigure side="left" imageSrc="/presiden-ri.jpg" />
                        <BackgroundFigure side="right" imageSrc="/wapres-ri.jpg" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,31,60,0.72)_0%,rgba(15,31,60,0.56)_24%,rgba(15,31,60,0.24)_44%,rgba(15,31,60,0)_70%)]" />
                        <div
                            className="pointer-events-none absolute top-5 left-1/2 z-20 hidden h-28 w-44 -translate-x-1/2 overflow-hidden md:block"
                            aria-hidden="true"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal dari Wikimedia Commons */}
                            <img
                                src="/garuda-pancasila.png"
                                alt=""
                                className="h-full w-full object-contain opacity-60 saturate-110 contrast-125"
                            />
                        </div>
                        <div className="absolute inset-0 opacity-[0.04]">
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage:
                                        "radial-gradient(circle at 50% 30%, white 1px, transparent 1px)",
                                    backgroundSize: "40px 40px",
                                }}
                            />
                        </div>

                        <div className="relative z-10">
                            <div className="relative mx-auto w-40 md:w-48">
                                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold-400/20 via-gold-400/5 to-transparent blur-md" />
                                <div className="relative h-52 w-40 overflow-hidden rounded-2xl border border-white/10 bg-white/8 shadow-lg shadow-navy-950/30 md:h-60 md:w-48">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal */}
                                    <img
                                        src="/ketua-harun-prayitno.png"
                                        alt={data.nama}
                                        className="h-full w-full object-cover object-top"
                                    />
                                </div>
                                <div className="mt-3 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
                                        Ketua Umum LIPAN-RI
                                    </p>
                                    <p className="mt-1 text-xs leading-snug text-navy-200/80">
                                        {data.nama}
                                    </p>
                                </div>
                            </div>

                            <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-relaxed text-navy-200/80">
                                Dalam semangat pengabdian kepada bangsa dan
                                negara, LIPAN-RI berperan mengawal kepentingan
                                masyarakat pada bidang aset negara dan
                                pertanahan.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            <Section delay={0.15}>
                <div className="mb-8">
                    <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                        <span className="h-4 w-1 rounded-full bg-gold-400" />
                        <Quote className="h-4 w-4" /> Semboyan Jati Diri
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.semboyan.map((s: string, i: number) => (
                            <div
                                key={i}
                                className="bg-navy-50 border border-navy-100 rounded-xl px-5 py-4 text-sm text-navy-800 italic"
                            >
                                <span className="text-gold-500 text-xs mr-2">
                                    {i + 1}.
                                </span>
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section delay={0.25}>
                <div className="mb-8">
                    <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                        <span className="h-4 w-1 rounded-full bg-gold-400" />
                        Latar Belakang
                    </h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        {data.latarBelakang.map((p: string, i: number) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>
                </div>
            </Section>

            {data.pendidikan?.length > 0 && (
                <Section delay={0.35}>
                    <div className="mb-8">
                        <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                            <span className="h-4 w-1 rounded-full bg-gold-400" />
                            <GraduationCap className="h-4 w-4" /> Riwayat
                            Pendidikan
                        </h2>
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {data.pendidikan.map((p, i) => (
                                <li
                                    key={i}
                                    className="rounded-xl border border-navy-100 bg-navy-50 px-4 py-3"
                                >
                                    <p className="text-xs font-semibold tracking-wide text-gold-600">
                                        {p.tahun}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-navy-900">
                                        {p.jurusan}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                        {p.institusi}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Section>
            )}

            {(data.pekerjaan?.length > 0 || data.organisasi?.length > 0) && (
                <Section delay={0.4}>
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.pekerjaan?.length > 0 && (
                            <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                                    <Briefcase className="h-4 w-4" /> Riwayat
                                    Pekerjaan
                                </h2>
                                <Riwayat
                                    items={data.pekerjaan.map((k) => ({
                                        tahun: k.tahun,
                                        utama: k.jabatan,
                                        sekunder: k.perusahaan,
                                    }))}
                                />
                            </div>
                        )}
                        {data.organisasi?.length > 0 && (
                            <div className="bg-white border border-gold-400/15 rounded-2xl p-6 shadow-sm">
                                <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                                    <Users className="h-4 w-4" /> Riwayat
                                    Organisasi
                                </h2>
                                <Riwayat
                                    items={data.organisasi.map((o) => ({
                                        tahun: o.tahun,
                                        utama: o.jabatan,
                                        sekunder: o.organisasi,
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                </Section>
            )}

            <Section delay={0.45}>
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-navy-50 to-navy-100/50 border border-navy-100 rounded-2xl p-6 md:p-8">
                        <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                            <Lightbulb className="h-4 w-4" /> Motivasi
                            Pengabdian
                        </h2>
                        <p className="text-navy-800 leading-relaxed italic border-l-2 border-gold-400/40 pl-4">
                            {data.motivasi}
                        </p>
                    </div>
                </div>
            </Section>

            {galeri.length > 0 && (
                <Section delay={0.5}>
                    <div className="mb-8">
                        <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                            <span className="h-4 w-1 rounded-full bg-gold-400" />
                            <Camera className="h-4 w-4" /> Dokumentasi Kegiatan
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {galeri.map((foto) => (
                                <figure
                                    key={foto.id}
                                    className="group overflow-hidden rounded-xl border border-navy-100 bg-navy-50 transition-colors hover:border-gold-400/40"
                                >
                                    <div className="aspect-[3/4] overflow-hidden">
                                        <SafeImage
                                            src={foto.url}
                                            alt={
                                                foto.altText ??
                                                "Dokumentasi kegiatan Ketua Umum LIPAN-RI"
                                            }
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    {foto.altText && (
                                        <figcaption className="px-3 py-2 text-xs leading-snug text-muted-foreground">
                                            {foto.altText}
                                        </figcaption>
                                    )}
                                </figure>
                            ))}
                        </div>
                    </div>
                </Section>
            )}

            <Section delay={0.55}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gold-400/15 rounded-2xl p-6 shadow-sm">
                        <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                            <Target className="h-4 w-4" /> Visi
                        </h2>
                        <p className="text-muted-foreground leading-relaxed italic">
                            &ldquo;{data.visi}&rdquo;
                        </p>
                    </div>
                    <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
                            Misi
                        </h2>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground leading-relaxed text-sm">
                            {data.misi.map((m: string, i: number) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            </Section>
        </div>
    );
}
