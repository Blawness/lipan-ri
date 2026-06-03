"use client";

import { Quote, Target, Lightbulb } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ProfilKetuaContent } from "@/lib/page-content";

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

export function ProfilKetua({ data }: { data: ProfilKetuaContent }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Section delay={0}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8 mb-8 border-l-4 border-gold-400">
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
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-center">
              <div className="relative mx-auto md:mx-0">
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold-400/20 via-gold-400/5 to-transparent blur-md" />
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal */}
                  <img
                    src="/ketua-harun-prayitno.png"
                    alt={data.nama}
                    className="mx-auto h-44 w-36 md:h-56 md:w-44 rounded-2xl object-cover object-top ring-1 ring-gold-400/30 shadow-xl"
                  />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-6 bg-gold-400/40" />
                  <p className="text-xs font-semibold text-gold-300 uppercase tracking-[0.2em]">
                    Ketua Umum LIPAN-RI
                  </p>
                </div>
                <p className="text-sm text-navy-300 mb-3">
                  Putra Asli Banyumas
                </p>
                <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {data.nama}
                </h1>
                <div className="mt-4 h-0.5 w-16 bg-gradient-to-r from-gold-400 to-transparent rounded-full" />
              </div>
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
                <span className="text-gold-500 text-xs mr-2">{i + 1}.</span>
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

      <Section delay={0.35}>
        <div className="mb-8">
          <div className="bg-gradient-to-br from-navy-50 to-navy-100/50 border border-navy-100 rounded-2xl p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-navy-900 text-sm font-semibold uppercase tracking-wider mb-4">
              <Lightbulb className="h-4 w-4" /> Motivasi Pengabdian
            </h2>
            <p className="text-navy-800 leading-relaxed italic border-l-2 border-gold-400/40 pl-4">
              {data.motivasi}
            </p>
          </div>
        </div>
      </Section>

      <Section delay={0.45}>
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
