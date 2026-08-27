"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Maximize2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";
import {
  OrgNode,
  OrgPathContext,
  OrgSelectContext,
  OrgSelectedContext,
} from "./org-node";
import { OrgEdge } from "./org-edge";
import { OrgDetailPanel } from "./org-detail-panel";
import {
  MEMBERS,
  POS,
  EDGES,
  PARENT,
  CHILDREN,
  NODE_W,
  NODE_H,
  ancestors,
  type OrgNodeData,
} from "./org-flow";

const nodeTypes = { org: OrgNode };
const edgeTypes = { org: OrgEdge };

// Below this the chart is navigated by drag + pinch instead of shown whole.
const DESKTOP_MQ = "(min-width: 1280px)";

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

// Built once and never rebuilt: highlight is read from OrgPathContext by each
// node. Rebuilding this array on hover resets React Flow's measured node
// dimensions, which unmounts every edge for a frame → flicker.
const NODES: Node<OrgNodeData>[] = Object.entries(POS).map(([id, p]) => ({
  id,
  type: "org",
  position: { x: p.x, y: p.y * VSCALE },
  data: { member: MEMBERS[id] },
  draggable: false,
  selectable: false,
  connectable: false,
}));

export function StrukturOrg({}: { data: StrukturContent }) {
  return (
    <ReactFlowProvider>
      <StrukturChart />
    </ReactFlowProvider>
  );
}

function StrukturChart() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // Desktop is the SSR default so the fitted, whole-chart layout is what renders
  // first; the media query corrects it on mount.
  const [isDesktop, setIsDesktop] = useState(true);
  const { fitView } = useReactFlow();

  // A click pins the path; hover only previews it while nothing is pinned.
  const path = useMemo(() => ancestors(selected ?? hovered), [selected, hovered]);

  const select = useCallback((id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_MQ);
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

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

  // The `fitView` prop only runs on init, so re-fit when the viewport crosses
  // the breakpoint and the container's aspect ratio changes underneath it.
  useEffect(() => {
    fitView({ padding: isDesktop ? 0.05 : 0.1 });
  }, [isDesktop, fitView]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // On small screens the selected card and the panel are rarely both on screen:
  // centre the card in the chart, then bring the panel into view.
  useEffect(() => {
    if (!selected || isDesktop) return;
    fitView({ nodes: [{ id: selected }], maxZoom: 1, duration: 400 });
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selected, isDesktop, fitView]);

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
          // NEVER change edge order or zIndex on hover. React Flow renders edges as
          // `edgeIds.map(...)` sorted by zIndex; any reorder (a zIndex bump OR sorting
          // this array) re-keys the list and unmounts/remounts every edge SVG for
          // ~1 frame → all the lines blink = the hover flicker. Highlight is conveyed
          // by stroke color/width only, so the edge order stays constant.
          zIndex: 0,
          style: {
            stroke: on ? "hsl(var(--gold))" : "rgba(255,255,255,0.85)",
            strokeWidth: on ? 3 : 2,
          },
        } as Edge;
      }),
    [path],
  );

  const member = selected ? MEMBERS[selected] : null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="gradient-hero relative mb-8 overflow-hidden rounded-2xl border-l-4 border-brand-500 p-8 text-white ring-1 ring-navy-100">
        <h1 className="text-2xl font-bold md:text-3xl">Struktur Organisasi</h1>
        <p className="mt-1 text-sm text-navy-100">Susunan kepengurusan LIPAN RI</p>
      </div>

      <Card className="overflow-hidden border-navy-100 py-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 border-b border-navy-100 px-4 py-2.5">
            <p className="text-xs text-navy-500">
              {isDesktop
                ? "Klik kartu untuk melihat detail pengurus."
                : "Geser & cubit untuk menjelajah, ketuk kartu untuk detail."}
            </p>
            <button
              type="button"
              onClick={() => fitView({ padding: isDesktop ? 0.05 : 0.1, duration: 400 })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-navy-600 ring-1 ring-navy-100 transition hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Maximize2 className="size-3.5" />
              Reset tampilan
            </button>
          </div>

          <div
            ref={rootRef}
            className={`struktur-bg struktur-chart ${revealed ? "is-revealed" : ""}`}
          >
            {/* Explicit height below xl makes the container ignore aspectRatio, so
                the chart becomes a pannable window instead of a squashed whole. */}
            <div
              className="h-[70svh] min-h-[420px] w-full xl:h-auto"
              style={{ aspectRatio: `${BOUNDS.w} / ${BOUNDS.h}` }}
            >
              <OrgPathContext.Provider value={path}>
                <OrgSelectedContext.Provider value={selected}>
                  <OrgSelectContext.Provider value={select}>
                    <ReactFlow
                      nodes={NODES}
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
                      panOnDrag={!isDesktop}
                      panOnScroll={false}
                      zoomOnPinch={!isDesktop}
                      zoomOnDoubleClick={!isDesktop}
                      // Wheel/touch scrolling must always belong to the page —
                      // hijacking it traps the reader inside the chart.
                      zoomOnScroll={false}
                      preventScrolling={false}
                      minZoom={0.2}
                      maxZoom={1.5}
                      onPaneClick={() => setSelected(null)}
                      onNodeMouseEnter={(_, n) => setHovered(n.id)}
                      onNodeMouseLeave={() => setHovered(null)}
                      style={{ background: "transparent" }}
                    />
                  </OrgSelectContext.Provider>
                </OrgSelectedContext.Provider>
              </OrgPathContext.Provider>
            </div>
          </div>

          <div ref={panelRef}>
            {member && (
              <OrgDetailPanel
                key={member.id}
                member={member}
                parent={PARENT[member.id] ? MEMBERS[PARENT[member.id]] : null}
                bawahan={(CHILDREN[member.id] ?? []).map((id) => MEMBERS[id])}
                onSelect={setSelected}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
