"use client";

import "@xyflow/react/dist/style.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ReactFlow, type Edge, type Node } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";
import { ORG } from "./org-data";
import { OrgCard } from "./org-card";
import { OrgNode } from "./org-node";
import { OrgEdge } from "./org-edge";
import {
  MEMBERS,
  POS,
  EDGES,
  NODE_W,
  NODE_H,
  ancestors,
  type OrgNodeData,
} from "./org-flow";

const nodeTypes = { org: OrgNode };
const edgeTypes = { org: OrgEdge };

// Stretch the chart vertically so cards breathe; also lets fitView render
// closer to 1:1 (crisper text) instead of shrinking a wide, short graph.
const VSCALE = 1.32;

// Bounding box of the (vertically scaled) layout — drives the container aspect
// ratio so fitView uses the full width with no wasted vertical space.
const BOUNDS = (() => {
  const xs = Object.values(POS).map((p) => p.x);
  const ys = Object.values(POS).map((p) => p.y * VSCALE);
  const w = Math.max(...xs) + NODE_W - Math.min(...xs);
  const h = Math.max(...ys) + NODE_H - Math.min(...ys);
  return { w, h };
})();

const delay = (n: number): CSSProperties => ({
  ["--delay" as string]: `${n * 90}ms`,
});

// Flat top-to-bottom order for the mobile vertical stack.
const MOBILE_ORDER = [
  ORG.pembina,
  ORG.penasehat,
  ORG.ketua,
  ...ORG.stafKhusus,
  ORG.sekjen,
  ORG.bendahara,
  ORG.sdm,
  ...ORG.divisi.flatMap((d) => [d.head, ...d.staf]),
];

export function StrukturOrg({}: { data: StrukturContent }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const path = useMemo(() => ancestors(active), [active]);

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
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const nodes = useMemo<Node<OrgNodeData>[]>(
    () =>
      Object.entries(POS).map(([id, p]) => ({
        id,
        type: "org",
        position: { x: p.x, y: p.y * VSCALE },
        data: { member: MEMBERS[id], highlighted: path.has(id) },
        draggable: false,
        selectable: false,
        connectable: false,
      })),
    [path],
  );

  const edges = useMemo<Edge[]>(
    () =>
      EDGES.map((e) => {
        const on = path.has(e.source) && path.has(e.target);
        return {
          id: `${e.source}__${e.target}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sh,
          targetHandle: e.th,
          type: "org",
          data: {
            busY: e.busY != null ? e.busY * VSCALE : undefined,
            toTargetY: e.toTargetY,
          },
          focusable: false,
          selectable: false,
          zIndex: on ? 10 : 0,
          style: {
            stroke: on ? "hsl(var(--gold))" : "rgba(255,255,255,0.85)",
            strokeWidth: on ? 3 : 2,
          },
        };
      }),
    [path],
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
            className={`struktur-bg struktur-chart ${revealed ? "is-revealed" : ""}`}
          >
            {/* Desktop: React Flow — exact SVG coordinates, edges never break */}
            <div className="hidden xl:block">
              <div style={{ width: "100%", aspectRatio: `${BOUNDS.w} / ${BOUNDS.h}` }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.05 }}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  nodesFocusable={false}
                  edgesFocusable={false}
                  elementsSelectable={false}
                  panOnDrag={false}
                  panOnScroll={false}
                  zoomOnScroll={false}
                  zoomOnPinch={false}
                  zoomOnDoubleClick={false}
                  preventScrolling={false}
                  minZoom={0.2}
                  maxZoom={1.5}
                  onNodeMouseEnter={(_, n) => setActive(n.id)}
                  onNodeMouseLeave={() => setActive(null)}
                  style={{ background: "transparent" }}
                />
              </div>
            </div>

            {/* Mobile / tablet: vertical stack */}
            <div className="flex flex-col items-center gap-2 p-6 xl:hidden">
              {MOBILE_ORDER.map((m, i) => (
                <div
                  key={m.id}
                  className="flex flex-col items-center"
                  style={delay(i)}
                >
                  {i > 0 && (
                    <span
                      className="org-connector"
                      data-dir="y"
                      style={{ width: 3, height: 14 }}
                    />
                  )}
                  <OrgCard
                    member={m}
                    highlighted={path.has(m.id)}
                    onActivate={setActive}
                    onDeactivate={() => setActive(null)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
