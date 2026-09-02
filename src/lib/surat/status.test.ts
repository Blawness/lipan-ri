import { describe, it, expect } from "vitest";
import { canEdit, canSubmit, canIssue, STATUS_LABEL } from "@/lib/surat/status";

describe("canEdit", () => {
  it("hanya draft yang boleh disunting", () => {
    expect(canEdit("draft")).toBe(true);
    expect(canEdit("submitted")).toBe(false);
    expect(canEdit("issued")).toBe(false);
  });
});

describe("canSubmit", () => {
  it("hanya draft yang boleh diajukan", () => {
    expect(canSubmit("draft")).toBe(true);
    expect(canSubmit("submitted")).toBe(false);
    expect(canSubmit("issued")).toBe(false);
  });
});

describe("canIssue", () => {
  const base = {
    status: "submitted" as const,
    actorUserId: 5,
    actorRole: "penandatangan",
    signatoryUserId: 5,
  };

  it("mengizinkan penandatangan yang tertaut", () => {
    expect(canIssue(base)).toEqual({ ok: true });
  });

  it("menolak penandatangan lain", () => {
    const r = canIssue({ ...base, signatoryUserId: 9 });
    expect(r.ok).toBe(false);
  });

  it("mengizinkan admin sebagai jalan darurat", () => {
    expect(
      canIssue({ ...base, actorRole: "admin", signatoryUserId: 9 })
    ).toEqual({ ok: true });
  });

  it("menolak surat yang belum diajukan", () => {
    const r = canIssue({ ...base, status: "draft" });
    expect(r.ok).toBe(false);
  });

  it("menolak surat yang sudah terbit", () => {
    const r = canIssue({ ...base, status: "issued" });
    expect(r.ok).toBe(false);
  });

  it("menolak penandatangan yang belum punya akun tertaut", () => {
    const r = canIssue({ ...base, signatoryUserId: null });
    expect(r.ok).toBe(false);
  });
});

describe("STATUS_LABEL", () => {
  it("berbahasa Indonesia", () => {
    expect(STATUS_LABEL.submitted).toBe("Menunggu Pengesahan");
  });
});
