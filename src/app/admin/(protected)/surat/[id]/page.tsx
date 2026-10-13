import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam, ConfirmDelete } from "@blawness/admin-kit/components";
import type { AdminSessionUser } from "@blawness/admin-kit";
import { Button } from "@/components/ui/button";
import { getLetterDetail, getLetterLogs, nextSeq } from "@/lib/admin/letters";
import { renderNumberPattern } from "@/lib/surat/nomor";
import { canIssue, canEdit, canWithdraw } from "@/lib/surat/status";
import { siapkanIsian } from "@/lib/surat/isian";
import { rbac } from "@/rbac";
import { StatusBadge } from "../status-badge";
import { SuratKertas } from "../surat-kertas";
import { AlurSurat } from "../alur-surat";
import { PengesahanPanel } from "./pengesahan-panel";
import {
  issueLetterAction,
  rejectLetterAction,
  renderPdfAction,
  submitLetterAction,
  withdrawLetterAction,
  deleteLetterAction,
} from "../actions";
import {
  ArrowLeft,
  Pencil,
  Send,
  Undo2,
  FileDown,
  RefreshCw,
  ExternalLink,
  Trash2,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Server Vercel berjalan di UTC; tanpa timeZone, jejak surat tampil mundur
// 7 jam dari jam dinding pengurus yang membacanya.
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const LOG_LABEL: Record<string, string> = {
  created: "Dibuat",
  updated: "Disunting",
  submitted: "Diajukan",
  rejected: "Ditolak",
  issued: "Disahkan",
  withdrawn: "Ditarik kembali",
};

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("letters.read");
  const { id } = await params;
  const letterId = Number(id);
  if (!Number.isInteger(letterId) || letterId <= 0) notFound();

  const letter = await getLetterDetail(letterId);
  if (!letter) notFound();

  const logs = await getLetterLogs(letter.id);
  const user = session.user as AdminSessionUser;
  const issueCheck = canIssue({
    status: letter.status,
    actorUserId: Number(user.id),
    actorRole: user.role,
    signatoryUserId: letter.signatoryUserId,
  });
  const bolehIssue = rbac.can(user.role, "letters.issue");
  const bolehSahkan = issueCheck.ok && bolehIssue;
  const bolehSunting = canEdit(letter.status) && rbac.can(user.role, "letters.write");
  const bolehAjukan = canEdit(letter.status) && rbac.can(user.role, "letters.submit");
  const bolehHapus = canEdit(letter.status) && rbac.can(user.role, "letters.write");
  // Pasangan "Ajukan": selama belum disahkan, pembuat surat boleh membatalkan
  // pengajuannya sendiri tanpa menunggu penandatangan menolaknya.
  const bolehTarik =
    canWithdraw({
      status: letter.status,
      actorUserId: Number(user.id),
      actorRole: user.role,
      createdBy: letter.createdBy,
    }).ok && rbac.can(user.role, "letters.submit");

  // Sumber yang sama dengan perender PDF — pratinjau ini adalah janji tentang
  // apa yang akan tercetak, jadi tidak boleh dihitung dengan cara sendiri.
  const isian = siapkanIsian(letter);

  const year = new Date().getFullYear();
  const calonNomor =
    letter.number ??
    renderNumberPattern(letter.numberPattern, {
      seq: await nextSeq(letter.templateId, year),
      date: new Date(),
      code: letter.templateCode,
    });

  const issueAction = issueLetterAction.bind(null, letter.id);
  const rejectAction = rejectLetterAction.bind(null, letter.id);
  const submitAction = submitLetterAction.bind(null, letter.id);
  const withdrawAction = withdrawLetterAction.bind(null, letter.id);
  const renderAction = renderPdfAction.bind(null, letter.id);
  const deleteAction = deleteLetterAction.bind(null, letter.id);

  const revoked = letter.status === "issued" && letter.documentStatus === "revoked";
  const penandatangan = [letter.signatoryName, letter.signatoryTitle].filter(Boolean).join(", ");
  // Kalimat "apa selanjutnya" — tanpa ini pembuat surat sering tidak tahu
  // bahwa draft yang tersimpan belum sampai ke penandatangan.
  const petunjuk =
    letter.status === "draft"
      ? bolehAjukan
        ? "Surat ini masih draft dan belum terlihat oleh penandatangan. Periksa pratinjau, lalu klik “Ajukan untuk Pengesahan”."
        : "Surat ini masih draft dan belum diajukan."
      : letter.status === "submitted"
        ? bolehSahkan
          ? "Surat ini menunggu pengesahan Anda. Periksa pratinjau, lalu sahkan atau tolak dengan catatan."
          : `Menunggu pengesahan ${letter.signatoryName}. Nomor surat dan QR akan terbit setelah disahkan.`
        : revoked
          ? "Surat ini sudah dicabut. Halaman verifikasinya menyatakan surat tidak lagi berlaku."
          : null;

  return (
    <div className="space-y-6">
      <ToastOnParam
        param="saved"
        messages={{
          created: "Surat berhasil dibuat.",
          updated: "Surat berhasil diperbarui.",
          issued: "Surat berhasil disahkan dan diterbitkan.",
          "issued-nopdf": "Surat berhasil disahkan, tetapi PDF gagal dibuat. Coba render ulang.",
          rejected: "Surat ditolak dan dikembalikan sebagai draft.",
          withdrawn: "Pengajuan ditarik kembali. Surat bisa disunting lagi.",
          "pdf-rendered": "PDF berhasil dibuat ulang.",
          "pdf-gagal": "Render ulang PDF gagal. Coba lagi beberapa saat lagi.",
          "pdf-forbidden": "Anda tidak berwenang merender ulang PDF surat ini.",
        }}
      />

      <div className="space-y-4">
        <Link
          href="/admin/surat"
          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" /> Daftar surat
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{letter.templateName}</p>
            <h1 className="mt-0.5 font-heading text-xl font-bold text-navy-900">{letter.subject}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {letter.number ?? `Calon nomor: ${calonNomor}`}
            </p>
          </div>
          <StatusBadge status={letter.status} documentStatus={letter.documentStatus} />
        </div>
        <AlurSurat status={letter.status} revoked={revoked} />
      </div>

      {petunjuk ? (
        <p className="flex items-start gap-2 rounded-lg border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm text-navy-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" />
          {petunjuk}
        </p>
      ) : null}

      {letter.rejectionNote && letter.status === "draft" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ditolak penandatangan: {letter.rejectionNote}
        </p>
      ) : null}

      {letter.status === "issued" && !letter.documentFileUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Surat sudah sah dan bisa diverifikasi, tetapi berkas PDF-nya gagal dibuat.</span>
          {bolehIssue ? (
            <form action={renderAction}>
              <Button type="submit" size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" /> Render Ulang PDF
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-navy-500">
            {letter.status === "issued" ? "Isi surat" : "Pratinjau surat"}
          </h2>
          <div className="overflow-x-auto rounded-xl bg-navy-50/70 p-2 sm:p-6">
            <SuratKertas
              subject={letter.subject}
              number={letter.number ?? calonNomor}
              fields={isian.fields}
              bodyHtml={isian.bodyHtml}
              signatoryName={penandatangan}
              signatoryPosition={letter.signatoryPosition}
              issuedAt={letter.documentIssuedAt ?? new Date()}
              qrUrl={letter.documentSlug ? `/api/verifikasi/${letter.documentSlug}/qr` : null}
            />
          </div>
          {letter.status !== "issued" ? (
            <p className="text-xs text-muted-foreground">
              Tanggal dan nomor di atas masih perkiraan — keduanya ditetapkan saat surat disahkan.
            </p>
          ) : null}
        </section>

        <div className="space-y-6">
          {bolehSahkan ? (
            <PengesahanPanel
              issueAction={issueAction}
              rejectAction={rejectAction}
              calonNomor={calonNomor}
            />
          ) : null}

          <div className="space-y-3 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-navy-900">Tindakan</h2>
            {bolehSunting ? (
              <Button variant="outline" className="w-full"
                render={<Link href={`/admin/surat/${letter.id}/edit`}><Pencil className="h-4 w-4" /> Sunting</Link>} />
            ) : null}
            {bolehAjukan ? (
              <form action={submitAction}>
                <Button type="submit" className="w-full"><Send className="h-4 w-4" /> Ajukan untuk Pengesahan</Button>
              </form>
            ) : null}
            {bolehTarik ? (
              <form action={withdrawAction}>
                <Button type="submit" variant="outline" className="w-full">
                  <Undo2 className="h-4 w-4" /> Tarik Kembali Pengajuan
                </Button>
              </form>
            ) : null}
            {letter.documentFileUrl ? (
              <Button variant="outline" className="w-full"
                render={<a href={letter.documentFileUrl} target="_blank" rel="noreferrer"><FileDown className="h-4 w-4" /> Unduh PDF</a>} />
            ) : null}
            {letter.documentSlug ? (
              <Button variant="ghost" className="w-full"
                render={<a href={`/verifikasi/${letter.documentSlug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Halaman Verifikasi</a>} />
            ) : null}
            {bolehHapus ? (
              <ConfirmDelete
                action={deleteAction}
                id={letter.id}
                title="Hapus draft surat ini?"
                description={
                  <>
                    <span className="font-medium text-navy-900">{letter.subject}</span>{" "}
                    akan dihapus permanen.
                  </>
                }
                trigger={
                  <Button variant="outline" className="w-full">
                    <Trash2 className="h-4 w-4" /> Hapus Draft
                  </Button>
                }
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-navy-900">Keterangan</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Jenis surat</dt>
                <dd className="text-navy-900">{letter.templateName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Penandatangan</dt>
                <dd className="text-navy-900">
                  {penandatangan}
                  {letter.signatoryPosition ? (
                    <span className="block text-xs text-muted-foreground">{letter.signatoryPosition}</span>
                  ) : null}
                </dd>
              </div>
              {letter.documentIssuedAt ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Disahkan</dt>
                  <dd className="text-navy-900">{dateFmt.format(letter.documentIssuedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-navy-900">Jejak</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="border-l-2 border-navy-100 pl-3">
                  <p className="font-medium text-navy-900">{LOG_LABEL[l.action] ?? l.action}</p>
                  {l.note ? <p className="text-muted-foreground">{l.note}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {l.createdAt ? dateFmt.format(l.createdAt) : "—"}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
