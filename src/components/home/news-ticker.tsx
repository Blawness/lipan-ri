"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";

type TickerItem = { title: string; slug: string };

export function NewsTicker({ items }: { items: TickerItem[] }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div className="bg-navy-900 text-white border-y border-gold-400/20 overflow-hidden">
      <div className="container mx-auto flex items-center">
        <span className="flex-shrink-0 flex items-center gap-2 bg-brand-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-300 animate-pulse" />
          Terkini
        </span>
        <div className="relative flex-1 overflow-hidden group">
          <div
            className="flex whitespace-nowrap"
            style={
              reduce
                ? undefined
                : { animation: "ticker-scroll 40s linear infinite" }
            }
          >
            {loop.map((item, i) => (
              <Link
                key={`${item.slug}-${i}`}
                href={`/${item.slug}`}
                className="inline-flex items-center gap-3 px-6 py-2.5 text-sm text-navy-200 hover:text-white transition-colors"
              >
                <span className="text-gold-400">•</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
