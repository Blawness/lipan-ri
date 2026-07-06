"use client";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ReactFlow, type Edge, type Node } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";
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

const SVG_SRC = "/struktur-lipanv2.svg";

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

  const edges = useMemo<Edge[]>(() => {
    const built = EDGES.map((e) => {
      const on = path.has(e.source) && path.has(e.target);
      return {
        on,
        edge: {
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
          // Keep every edge in the SAME zIndex layer: toggling zIndex on hover
          // moves the edge to a different React Flow layer, which remounts it and
          // replays the draw-in dash animation → visible flicker. Instead we paint
          // highlighted edges last (see sort below) so gold stays on top, no remount.
          zIndex: 0,
          style: {
            stroke: on ? "hsl(var(--gold))" : "rgba(255,255,255,0.85)",
            strokeWidth: on ? 3 : 2,
          },
        } as Edge,
      };
    });
    // Stable sort: highlighted edges render after (above) the rest, no layer change.
    built.sort((a, b) => Number(a.on) - Number(b.on));
    return built.map((b) => b.edge);
  }, [path]);

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

            {/* Mobile / tablet: fall back to the source SVG (scroll to read) */}
            <div className="p-4 xl:hidden">
              <div className="overflow-x-auto rounded-lg">
                <Image
                  src={SVG_SRC}
                  alt="Bagan Struktur Organisasi LIPAN RI"
                  width={1440}
                  height={810}
                  className="mx-auto h-auto w-full min-w-[760px]"
                  priority
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
