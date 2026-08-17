import { HUT_RI } from "@/lib/hut-ri";

export function UcapanHutRi() {
  return (
    <section className="relative overflow-hidden border-y border-navy-100 bg-gradient-to-br from-white via-navy-50/40 to-white py-16 md:py-20">
      {/* Sapuan merah-putih tipis, sejalan dengan bannernya */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-600/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent"
      />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-14">
          <div className="relative mx-auto w-full max-w-xs md:mx-0 md:max-w-none">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent blur-md" />
            {/* eslint-disable-next-line @next/next/no-img-element -- aset lokal */}
            <img
              src={HUT_RI.gambar}
              alt={HUT_RI.gambarAlt}
              width={1280}
              height={1600}
              className="relative w-full rounded-2xl object-cover shadow-2xl shadow-navy-950/20 ring-1 ring-navy-900/10"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-6 bg-red-500/50" />
              <p className="text-xs font-semibold tracking-[0.2em] text-red-700 uppercase">
                17 Agustus {HUT_RI.tahun}
              </p>
            </div>
            <h2 className="font-heading text-2xl leading-tight font-extrabold text-navy-900 md:text-4xl">
              Dirgahayu Republik Indonesia ke-{HUT_RI.ke}
            </h2>
            <p className="mt-2 text-sm font-medium text-navy-600 md:text-base">
              {HUT_RI.tema}
            </p>
            <div className="mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-red-600 to-transparent" />

            <div className="mt-5 space-y-4 border-l-2 border-red-500/20 pl-4 text-sm leading-relaxed text-navy-700 md:text-base">
              {HUT_RI.naskah.map((paragraf) => (
                <p key={paragraf.slice(0, 32)}>{paragraf}</p>
              ))}
            </div>

            <div className="mt-6">
              <p className="font-heading text-base font-bold text-navy-900">
                {HUT_RI.ketua}
              </p>
              <p className="text-sm text-navy-600">{HUT_RI.jabatan}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
