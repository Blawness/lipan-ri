export type LetterStatus = "draft" | "submitted" | "issued";

export const STATUS_LABEL: Record<LetterStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Pengesahan",
  issued: "Terbit",
};

export function canEdit(status: LetterStatus): boolean {
  return status === "draft";
}

export function canSubmit(status: LetterStatus): boolean {
  return status === "draft";
}

export type IssueCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Lapis kedua di atas permission `letters.issue`: surat hanya boleh disahkan
 * oleh akun yang tertaut ke penandatangannya. Admin diberi jalan darurat, dan
 * pemakaiannya dicatat apa adanya di log — bukan disamarkan jadi tindakan
 * si penandatangan.
 */
export function canIssue({
  status,
  actorUserId,
  actorRole,
  signatoryUserId,
}: {
  status: LetterStatus;
  actorUserId: number;
  actorRole: string;
  signatoryUserId: number | null;
}): IssueCheck {
  if (status !== "submitted") {
    return {
      ok: false,
      reason:
        status === "issued"
          ? "Surat ini sudah terbit."
          : "Surat belum diajukan untuk pengesahan.",
    };
  }
  if (actorRole === "admin") return { ok: true };
  if (signatoryUserId === null) {
    return {
      ok: false,
      reason: "Penandatangan surat ini belum ditautkan ke akun pengguna.",
    };
  }
  if (signatoryUserId !== actorUserId) {
    return {
      ok: false,
      reason: "Surat ini ditujukan kepada penandatangan lain.",
    };
  }
  return { ok: true };
}
