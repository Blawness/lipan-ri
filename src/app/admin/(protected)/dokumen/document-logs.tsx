"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, RotateCw, Ban } from "lucide-react";

type LogEntry = {
  id: number;
  action: "created" | "updated" | "revoked";
  metadata: string | null;
  createdAt: string;
  actorId: number;
};

const actionLabel: Record<string, string> = {
  created: "Dibuat",
  updated: "Diperbarui",
  revoked: "Dicabut",
};

const actionIcon: Record<string, typeof Plus> = {
  created: Plus,
  updated: RotateCw,
  revoked: Ban,
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DocumentLogs({ documentId }: { documentId: number }) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/dokumen/${documentId}/logs`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!logs?.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-heading text-sm font-semibold text-navy-900">
        Riwayat
      </h3>
      <ul className="space-y-2">
        {logs.map((l) => {
          const Icon = actionIcon[l.action] ?? RotateCw;
          return (
            <li
              key={l.id}
              className="flex items-start gap-2 text-xs text-navy-700"
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
              <div>
                <span className="font-medium">{actionLabel[l.action]}</span>
                {l.metadata && (
                  <span className="text-navy-500">
                    {" "}
                    — {l.metadata}
                  </span>
                )}
                <span className="ml-1 text-muted-foreground">
                  {dateFmt.format(new Date(l.createdAt))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
