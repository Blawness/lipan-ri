"use client";

import { IdCard, Mail, Phone } from "lucide-react";
import { SafeImage } from "@/components/safe-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrgMember } from "./org-flow";

interface OrgDetailDialogProps {
  /** Anggota yang sedang dipilih; `null` menutup dialog. */
  member: OrgMember | null;
  /** Atasan langsung — null untuk puncak struktur. */
  parent: OrgMember | null;
  /** Bawahan langsung. */
  bawahan: OrgMember[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

function inisial(nama: string) {
  return nama
    .replace(/,.*$/, "") // buang gelar di belakang koma
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function RelasiChip({
  member,
  onSelect,
}: {
  member: OrgMember;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(member.id)}
      className="rounded-full bg-navy-50 px-3 py-1 text-left text-xs text-navy-700 ring-1 ring-navy-100 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="font-semibold">{member.role}</span>
      <span className="text-navy-400"> · {member.nama}</span>
    </button>
  );
}

export function OrgDetailDialog({
  member,
  parent,
  bawahan,
  onSelect,
  onClose,
}: OrgDetailDialogProps) {
  return (
    <Dialog
      open={!!member}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85svh] gap-0 overflow-y-auto bg-white p-5 sm:max-w-lg sm:p-6">
        {member && (
          <>
            <DialogTitle className="sr-only">
              {member.role} — {member.nama}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detail pengurus LIPAN RI: {member.nama}, {member.role}.
            </DialogDescription>

            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="shrink-0">
                {member.foto ? (
                  <SafeImage
                    src={member.foto}
                    alt={member.nama}
                    className="size-20 rounded-2xl object-cover object-top ring-1 ring-navy-100 sm:size-24"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-20 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-700 ring-1 ring-navy-100 sm:size-24"
                  >
                    {inisial(member.nama)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  {member.role}
                </p>
                <p className="mt-0.5 pr-8 text-lg font-bold leading-tight text-navy-800 sm:text-xl">
                  {member.nama}
                </p>

                {member.nomorAnggota && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600 ring-1 ring-navy-100">
                    <IdCard className="size-3.5 text-navy-400" />
                    <span className="font-mono tracking-wide">{member.nomorAnggota}</span>
                  </p>
                )}

                {member.deskripsi && (
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">
                    {member.deskripsi}
                  </p>
                )}

                {(member.email || member.telepon) && (
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-1.5 text-brand-600 hover:underline"
                      >
                        <Mail className="size-4" />
                        {member.email}
                      </a>
                    )}
                    {member.telepon && (
                      <a
                        href={`tel:${member.telepon.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-brand-600 hover:underline"
                      >
                        <Phone className="size-4" />
                        {member.telepon}
                      </a>
                    )}
                  </div>
                )}

                {(parent || bawahan.length > 0) && (
                  <div className="mt-4 space-y-3 border-t border-navy-100 pt-4">
                    {parent && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                          Bertanggung jawab ke
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <RelasiChip member={parent} onSelect={onSelect} />
                        </div>
                      </div>
                    )}
                    {bawahan.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                          Membawahi
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {bawahan.map((b) => (
                            <RelasiChip
                              key={b.id}
                              member={b}
                              onSelect={onSelect}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
