"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IssueFormState } from "../actions";

export function PengesahanPanel({
  issueAction,
  rejectAction,
  calonNomor,
}: {
  issueAction: (prev: IssueFormState, fd: FormData) => Promise<IssueFormState>;
  rejectAction: (prev: IssueFormState, fd: FormData) => Promise<IssueFormState>;
  calonNomor: string;
}) {
  const [issueState, issueForm, issuing] = useActionState<IssueFormState, FormData>(issueAction, {});
  const [rejectState, rejectForm, rejecting] = useActionState<IssueFormState, FormData>(rejectAction, {});
  const [tolak, setTolak] = useState(false);

  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-6">
      <h2 className="font-heading text-sm font-semibold text-amber-900">Menunggu Pengesahan Anda</h2>

      <form action={issueForm} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy-800" htmlFor="number">Nomor Surat</label>
          <Input id="number" name="number" defaultValue={calonNomor} />
          <p className="text-xs text-muted-foreground">
            Nomor terisi otomatis dari pola jenis surat. Ubah hanya bila memang perlu.
          </p>
        </div>
        {issueState.error ? (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {issueState.error}
          </p>
        ) : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={issuing}>
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Sahkan &amp; Terbitkan
          </Button>
          <Button type="button" variant="outline" onClick={() => setTolak((v) => !v)}>
            <XCircle className="h-4 w-4" /> Tolak
          </Button>
        </div>
      </form>

      {tolak ? (
        <form action={rejectForm} className="space-y-3 border-t border-amber-200 pt-4">
          <label className="text-sm font-medium text-navy-800" htmlFor="note">Catatan Penolakan</label>
          <textarea
            id="note"
            name="note"
            required
            className="min-h-20 w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
            placeholder="Jelaskan apa yang perlu diperbaiki."
          />
          {rejectState.error ? (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {rejectState.error}
            </p>
          ) : null}
          <Button type="submit" variant="destructive" disabled={rejecting}>
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kirim Penolakan
          </Button>
        </form>
      ) : null}
    </div>
  );
}
