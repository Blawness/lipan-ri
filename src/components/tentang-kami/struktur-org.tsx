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

  // Active node lives somewhere in a division subtree (below SDM).
  const divActive = active !== null && active !== "sdm" && path.has("sdm");

  // Vertical connector segment (trunk / drop).
  const vDrop = (h: number, on: boolean, d: number) => (
    <span
      className="org-connector"
      data-dir="y"
      data-highlighted={on ? "" : undefined}
      style={{ width: 3, height: h, ...delay(d) }}
    />
  );

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
            <div className="hidden overflow-x-auto lg:block">
              <div className="mx-auto flex min-w-[900px] max-w-[1180px] flex-col items-center">
                {/* Pembina */}
                <div style={delay(0)}>
                  <OrgCard {...cardProps(ORG.pembina)} />
                </div>

                {/* Trunk to Ketua, with left/right side branches */}
                <div className="relative flex flex-col items-center">
                  {vDrop(30, path.has("ketua"), 1)}
                  <div style={delay(1)}>
                    <OrgCard {...cardProps(ORG.ketua)} />
                  </div>

                  {/* Penasehat — left branch, at trunk height */}
                  <div className="absolute right-1/2 top-[-4px] flex w-[380px] items-center">
                    <div style={delay(1)}>
                      <OrgCard {...cardProps(ORG.penasehat)} />
                    </div>
                    <span
                      className="org-connector flex-1"
                      data-dir="x-right"
                      data-highlighted={path.has("penasehat") ? "" : undefined}
                      style={{ ...delay(1), height: 3 }}
                    />
                  </div>

                  {/* Staf Khusus + Koordinator — right branch, at Ketua height */}
                  <div className="absolute left-1/2 top-[42px] ml-[96px] flex items-center">
                    <span
                      className="org-connector"
                      data-dir="x"
                      data-highlighted={path.has("staf-khusus") || path.has("koordinator-keamanan") ? "" : undefined}
                      style={{ ...delay(2), height: 3, width: 36 }}
                    />
                    <div className="flex gap-4">
                      {ORG.stafKhusus.map((m) => (
                        <div key={m.id} style={delay(2)}>
                          <OrgCard {...cardProps(m)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ketua -> middle bus */}
                {vDrop(30, path.has("sdm") || path.has("sekjen") || path.has("bendahara"), 2)}

                {/* Sekjen — SDM — Bendahara (bus with center drop to SDM) */}
                <div className="w-full">
                  <div className="mx-auto" style={{ width: "67%" }}>
                    <span
                      className="org-connector block w-full"
                      data-dir="x-center"
                      data-highlighted={path.has("sekjen") || path.has("bendahara") || path.has("sdm") ? "" : undefined}
                      style={{ ...delay(3), height: 3 }}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-start">
                    <div className="flex flex-col items-center">
                      {vDrop(16, path.has("sekjen"), 3)}
                      <div style={delay(3)}>
                        <OrgCard {...cardProps(ORG.sekjen)} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      {vDrop(46, path.has("sdm"), 3)}
                      <div style={delay(3)}>
                        <OrgCard {...cardProps(ORG.sdm)} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      {vDrop(16, path.has("bendahara"), 3)}
                      <div style={delay(3)}>
                        <OrgCard {...cardProps(ORG.bendahara)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SDM -> divisi bus */}
                {vDrop(30, divActive, 4)}
                <div className="w-full">
                  <div className="mx-auto" style={{ width: "75%" }}>
                    <span
                      className="org-connector block w-full"
                      data-dir="x-center"
                      data-highlighted={divActive ? "" : undefined}
                      style={{ ...delay(4), height: 3 }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {ORG.divisi.map((d, i) => (
                      <div key={d.head.id} className="flex flex-col items-center gap-3">
                        <div className="flex flex-col items-center">
                          {vDrop(16, path.has(d.head.id), 4 + i * 0.2)}
                          <div style={delay(4 + i * 0.2)}>
                            <OrgCard {...cardProps(d.head)} />
                          </div>
                        </div>
                        {d.staf.map((s, j) => (
                          <div key={s.id} className="flex flex-col items-center">
                            <span
                              className="org-connector"
                              data-dir="y"
                              data-highlighted={path.has(s.id) ? "" : undefined}
                              style={{ width: 3, height: 16 }}
                            />
                            <div style={delay(5 + i * 0.2 + j * 0.2)}>
                              <OrgCard {...cardProps(s)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile / tablet: vertical stack ─────────────────── */}
            <div className="flex flex-col items-center gap-2 lg:hidden">
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
