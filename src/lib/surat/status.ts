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
 * Inti pemeriksaan identitas yang dipakai `canIssue` dan
 * `canManageLetterDocument`: aktor harus admin atau akun yang tertaut ke
 * penandatangan surat. Admin diberi jalan darurat, dan pemakaiannya dicatat
 * apa adanya di log — bukan disamarkan jadi tindakan si penandatangan.
 */
function checkSignatoryIdentity({
  actorUserId,
  actorRole,
  signatoryUserId,
}: {
  actorUserId: number;
  actorRole: string;
  signatoryUserId: number | null;
}): IssueCheck {
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

/**
 * Lapis kedua di atas permission `letters.issue`: surat hanya boleh disahkan
 * oleh akun yang tertaut ke penandatangannya, dan hanya saat statusnya
 * `submitted`.
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
  return checkSignatoryIdentity({ actorUserId, actorRole, signatoryUserId });
}

/**
 * Sama seperti inti `canIssue`, tapi tanpa gerbang status — dipakai untuk
 * tindakan pasca-terbit seperti render ulang PDF, yang justru hanya berlaku
 * saat surat sudah `issued` (status `submitted` di `canIssue` tidak relevan
 * di sini). Tanpa ini, siapa pun pemegang `letters.issue` bisa merender
 * ulang dan menimpa PDF surat siapa pun.
 */
export function canManageLetterDocument({
  actorUserId,
  actorRole,
  signatoryUserId,
}: {
  actorUserId: number;
  actorRole: string;
  signatoryUserId: number | null;
}): IssueCheck {
  return checkSignatoryIdentity({ actorUserId, actorRole, signatoryUserId });
}
