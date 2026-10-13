import path from "node:path";
import {
  Font,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { generateQrPng } from "@/lib/qr";
import { parseSuratHtml, type SuratInline } from "@/lib/surat/html-to-pdf";
import { KOP } from "@/lib/surat/kop";

export type SuratPdfInput = {
  number: string;
  subject: string;
  bodyHtml: string;
  /** Baris isian field dinamis template, urut sesuai definisi template. */
  fields: { label: string; value: string }[];
  /** Nama lengkap berikut gelar, mis. "Harun Prayitno, SH". */
  signatoryName: string;
  /** Jabatan yang tercetak di atas QR, mis. "Ketua Umum". */
  signatoryPosition: string | null;
  issuedAt: Date;
  verifyUrl: string;
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
});

// Bawaan react-pdf memenggal kata bahasa Inggris — di surat berbahasa
// Indonesia hasilnya pemenggalan aneh, dan URL verifikasi terpotong
// ("li-pan-ri.com") sehingga tidak bisa disalin utuh.
Font.registerHyphenationCallback((word) => [word]);

const NAVY = "#0f2b46";
const ABU = "#5b6b7c";
const LOGO = 64;

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 56, fontSize: 11, fontFamily: "Helvetica", color: NAVY },
  // Logo di kiri, teks di tengah halaman. Penyeimbang selebar logo di kanan
  // menjaga teks kop benar-benar di sumbu tengah kertas, bukan di tengah sisa
  // ruang setelah logo.
  kop: { flexDirection: "row", alignItems: "center" },
  kopLogo: { width: LOGO, height: LOGO },
  kopTeks: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  kopNama: { fontSize: 13.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  kopSingkatan: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 1 },
  kopLegal: { fontSize: 8, fontFamily: "Helvetica-Oblique", marginTop: 2 },
  kopAlamat: { fontSize: 8, color: ABU, textAlign: "center", marginTop: 3, lineHeight: "11pt" },
  // Garis ganda khas kop surat dinas: tebal di atas, tipis di bawah.
  garisTebal: { marginTop: 8, height: 2.5, backgroundColor: NAVY },
  garisTipis: { marginTop: 1.5, height: 0.75, backgroundColor: NAVY },
  judul: { marginTop: 22, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 12, textTransform: "uppercase", textDecoration: "underline" },
  nomor: { marginTop: 3, textAlign: "center", fontSize: 11 },
  fieldsWrap: { marginTop: 18 },
  fieldRow: { flexDirection: "row", marginBottom: 2 },
  fieldLabel: { width: 130 },
  fieldTitikDua: { width: 10 },
  fieldValue: { flex: 1 },
  body: { marginTop: 16 },
  paragraph: { marginBottom: 8, textAlign: "justify", lineHeight: "16pt" },
  heading: { marginTop: 10, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  quote: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#c7d3de" },
  listItem: { flexDirection: "row", marginBottom: 4 },
  list: { marginBottom: 8 },
  listMarker: { width: 20 },
  ttdWrap: { marginTop: 24, flexDirection: "row", justifyContent: "flex-end" },
  ttd: { width: 230, alignItems: "center", textAlign: "center" },
  qr: { width: 92, height: 92, marginVertical: 6 },
  ttdNama: { fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  catatan: { marginTop: 18, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: "#c7d3de", fontSize: 7.5, color: ABU, textAlign: "center" },
});

/** "Ketua" → "Ketua LIPAN RI", tanpa menggandakan bila sudah ada. */
function jabatanTtd(jabatan: string): string {
  return jabatan.toUpperCase().replace(/-/g, " ").includes(KOP.singkatan) ? jabatan : `${jabatan} ${KOP.singkatan}`;
}

function Inlines({ inlines }: { inlines: SuratInline[] }) {
  return (
    <>
      {inlines.map((run, i) => (
        <Text
          key={i}
          style={{
            fontFamily: run.bold
              ? run.italic
                ? "Helvetica-BoldOblique"
                : "Helvetica-Bold"
              : run.italic
                ? "Helvetica-Oblique"
                : "Helvetica",
            textDecoration: run.underline ? "underline" : "none",
          }}
        >
          {run.text}
        </Text>
      ))}
    </>
  );
}

function FieldRows({ fields }: { fields: { label: string; value: string }[] }) {
  const rows = fields.filter((f) => f.value.trim() !== "");
  if (rows.length === 0) return null;
  return (
    <View style={s.fieldsWrap}>
      {rows.map((f, i) => (
        <View key={i} style={s.fieldRow}>
          <Text style={s.fieldLabel}>{f.label}</Text>
          <Text style={s.fieldTitikDua}>:</Text>
          <Text style={s.fieldValue}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Body({ html }: { html: string }) {
  const blocks = parseSuratHtml(html);
  return (
    <View style={s.body}>
      {blocks.map((block, i) => {
        if (block.kind === "list") {
          return (
            <View key={i} style={s.list}>
              {block.items.map((item, j) => (
                <View key={j} style={s.listItem}>
                  <Text style={s.listMarker}>
                    {block.ordered ? `${j + 1}.` : "•"}
                  </Text>
                  <Text style={{ flex: 1 }}>
                    <Inlines inlines={item} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text
            key={i}
            style={[
              block.level === 0 ? s.paragraph : s.heading,
              ...(block.quote ? [s.quote] : []),
            ]}
          >
            <Inlines inlines={block.inlines} />
          </Text>
        );
      })}
    </View>
  );
}

function SuratDocument({
  input,
  qr,
  logo,
}: {
  input: SuratPdfInput;
  qr: string;
  logo: string;
}) {
  return (
    <Document title={`${input.number} — ${input.subject}`}>
      <Page size="A4" style={s.page}>
        <View style={s.kop}>
          <Image style={s.kopLogo} src={logo} />
          <View style={s.kopTeks}>
            {KOP.nama.map((baris) => (
              <Text key={baris} style={s.kopNama}>{baris}</Text>
            ))}
            <Text style={s.kopSingkatan}>({KOP.singkatan})</Text>
            <Text style={s.kopLegal}>{KOP.legalitas}</Text>
            <Text style={s.kopAlamat}>
              {KOP.alamat}
              {"\n"}
              {KOP.kontak}
            </Text>
          </View>
          <View style={{ width: LOGO }} />
        </View>
        <View style={s.garisTebal} />
        <View style={s.garisTipis} />

        <Text style={s.judul}>{input.subject}</Text>
        <Text style={s.nomor}>Nomor: {input.number}</Text>

        <FieldRows fields={input.fields} />

        <Body html={input.bodyHtml} />

        <View style={s.ttdWrap}>
          <View style={s.ttd}>
            <Text>
              {KOP.kota}, {dateFmt.format(input.issuedAt)}
            </Text>
            {input.signatoryPosition ? (
              <Text style={{ marginTop: 2 }}>{jabatanTtd(input.signatoryPosition)}</Text>
            ) : null}
            <Image style={s.qr} src={qr} />
            <Text style={s.ttdNama}>{input.signatoryName}</Text>
          </View>
        </View>

        <Text style={s.catatan}>
          Ditandatangani secara elektronik. Keaslian surat ini dapat diperiksa
          dengan memindai kode QR di atas atau membuka {input.verifyUrl}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Render PDF surat. QR memakai `generateQrPng` yang sudah ada supaya parameter
 * QR tetap terdefinisi di satu tempat (`src/lib/qr.ts`).
 */
export async function renderSuratPdf(input: SuratPdfInput): Promise<Buffer> {
  const qrPng = await generateQrPng(input.verifyUrl);
  const qr = `data:image/png;base64,${qrPng.toString("base64")}`;
  const logo = path.resolve(KOP.logoPath);
  return renderToBuffer(<SuratDocument input={input} qr={qr} logo={logo} />);
}
