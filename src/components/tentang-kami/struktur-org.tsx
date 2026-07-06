"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";
import { ORG, type OrgMember } from "./org-data";
import { OrgCard } from "./org-card";

// Ancestry for hover-path highlight (child id -> parent id).
const PARENT: Record<string, string> = {
  ketua: "pembina",
  penasehat: "pembina",
  "staf-khusus": "ketua",
  "koordinator-keamanan": "ketua",
  sekjen: "ketua",
  bendahara: "ketua",
  sdm: "ketua",
  ...Object.fromEntries(ORG.divisi.map((d) => [d.head.id, "sdm"])),
  ...Object.fromEntries(
    ORG.divisi.flatMap((d) => d.staf.map((s) => [s.id, d.head.id])),
  ),
};

function ancestors(id: string | null): Set<string> {
  const set = new Set<string>();
  let cur = id;
  while (cur) {
    set.add(cur);
    cur = PARENT[cur] ?? null;
  }
  return set;
}

const delay = (n: number): CSSProperties => ({ ["--delay" as string]: `${n * 90}ms` });

export function StrukturOrg({}: { data: StrukturContent }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const path = ancestors(active);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cardProps = (m: OrgMember) => ({
    member: m,
    highlighted: path.has(m.id),
    onActivate: setActive,
    onDeactivate: () => setActive(null),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="gradient-hero relative mb-8 overflow-hidden rounded-2xl border-l-4 border-brand-500 p-8 text-white ring-1 ring-navy-100">
        <h1 className="text-2xl font-bold md:text-3xl">Struktur Organisasi</h1>
        <p className="mt-1 text-sm text-navy-100">Susunan kepengurusan LIPAN RI</p>
      </div>

      <Card className="overflow-hidden border-navy-100 py-0">
        <CardContent className="p-0">
          <div
            ref={rootRef}
            className={`struktur-bg struktur-chart ${revealed ? "is-revealed" : ""} p-6 md:p-10`}
          >
            {/* ── Desktop ─────────────────────────────────────────── */}
            <div className="hidden flex-col items-center md:flex">
              {/* Pembina */}
              <div style={delay(0)}>
                <OrgCard {...cardProps(ORG.pembina)} />
              </div>

              {/* trunk + penasehat side-branch */}
              <span className="org-connector" data-dir="y" data-highlighted={path.has("ketua") ? "" : undefined} style={{ ...delay(1), width: 3, height: 28 }} />
              <div className="relative flex w-full items-start justify-center">
                <div className="absolute left-1/2 top-6 hidden -translate-x-full items-center lg:flex" style={{ width: "22%" }}>
                  <span className="org-connector" data-dir="x-right" data-highlighted={path.has("penasehat") ? "" : undefined} style={{ ...delay(1), height: 3, flex: 1 }} />
                  <div style={delay(1)}>
                    <OrgCard {...cardProps(ORG.penasehat)} />
                  </div>
                </div>
                <div style={delay(1)}>
                  <OrgCard {...cardProps(ORG.ketua)} />
                </div>
                {/* Ketua right-side children */}
                <div className="absolute left-1/2 top-3 flex translate-x-[120px] items-center gap-4">
                  <span className="org-connector" data-dir="x" data-highlighted={path.has("staf-khusus") || path.has("koordinator-keamanan") ? "" : undefined} style={{ ...delay(2), height: 3, width: 40 }} />
                  <div className="flex gap-4">
                    {ORG.stafKhusus.map((m) => (
                      <div key={m.id} style={delay(2)}>
                        <OrgCard {...cardProps(m)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ketua -> Sekjen/Bendahara/SDM */}
              <span className="org-connector" data-dir="y" data-highlighted={path.has("sdm") ? "" : undefined} style={{ ...delay(2), width: 3, height: 28 }} />
              <div className="flex w-full items-center justify-center gap-6">
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.sekjen)} />
                </div>
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.sdm)} />
                </div>
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.bendahara)} />
                </div>
              </div>

              {/* SDM -> divisi row */}
              <span className="org-connector" data-dir="y" style={{ ...delay(4), width: 3, height: 28 }} />
              <div className="grid w-full grid-cols-4 gap-4">
                {ORG.divisi.map((d, i) => (
                  <div key={d.head.id} className="flex flex-col items-center gap-3" style={delay(4 + i * 0.25)}>
                    <OrgCard {...cardProps(d.head)} />
                    {d.staf.map((s, j) => (
                      <div key={s.id} className="flex flex-col items-center" style={delay(5 + i * 0.25 + j * 0.25)}>
                        <span className="org-connector" data-dir="y" data-highlighted={path.has(s.id) ? "" : undefined} style={{ width: 3, height: 16 }} />
                        <OrgCard {...cardProps(s)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mobile: vertical stack ──────────────────────────── */}
            <div className="flex flex-col items-center gap-2 md:hidden">
              {[
                ORG.pembina,
                ORG.penasehat,
                ORG.ketua,
                ...ORG.stafKhusus,
                ORG.sekjen,
                ORG.bendahara,
                ORG.sdm,
                ...ORG.divisi.flatMap((d) => [d.head, ...d.staf]),
              ].map((m, i) => (
                <div key={m.id} className="flex flex-col items-center" style={delay(i)}>
                  {i > 0 && <span className="org-connector" data-dir="y" style={{ width: 3, height: 14 }} />}
                  <OrgCard {...cardProps(m)} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
