import path from "node:path";
import {
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
  /** Nama lengkap berikut gelar, mis. "Harun Prayitno, SH". */
  signatoryName: string;
  /** Jabatan yang tercetak di atas QR, mis. "Ketua Umum". */
  signatoryPosition: string | null;
  issuedAt: Date;
  verifyUrl: string;
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 56, fontSize: 11, fontFamily: "Helvetica", color: "#0f2b46" },
  kop: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 2, borderBottomColor: "#0f2b46", paddingBottom: 10 },
  kopLogo: { width: 56, height: 56 },
  kopNama: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  kopSub: { fontSize: 10 },
  kopAlamat: { fontSize: 9, color: "#5b6b7c" },
  judul: { marginTop: 22, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 12, textTransform: "uppercase" },
  nomor: { marginTop: 4, textAlign: "center", fontSize: 11 },
  body: { marginTop: 20, lineHeight: 1.5 },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  heading: { marginTop: 10, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  quote: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#c7d3de" },
  listItem: { flexDirection: "row", marginBottom: 4 },
  listMarker: { width: 20 },
  ttdWrap: { marginTop: 28, flexDirection: "row", justifyContent: "flex-end" },
  ttd: { width: 220, alignItems: "center" },
  ttdKota: { alignSelf: "flex-start", marginBottom: 2 },
  qr: { width: 96, height: 96, marginVertical: 6 },
  ttdNama: { fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  catatan: { marginTop: 10, fontSize: 8, color: "#5b6b7c", textAlign: "center" },
});

function Inlines({ inlines }: { inlines: SuratInline[] }) {
  return (
    <>
      {inlines.map((run, i) => (
        <Text
          key={i}
          style={{
            fontFamily: run.bold ? "Helvetica-Bold" : run.italic ? "Helvetica-Oblique" : "Helvetica",
            textDecoration: run.underline ? "underline" : "none",
          }}
        >
          {run.text}
        </Text>
      ))}
    </>
  );
}

function Body({ html }: { html: string }) {
  const blocks = parseSuratHtml(html);
  return (
    <View style={s.body}>
      {blocks.map((block, i) => {
        if (block.kind === "list") {
          return (
            <View key={i}>
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
          <View>
            <Text style={s.kopNama}>{KOP.nama}</Text>
            <Text style={s.kopSub}>{KOP.singkatan}</Text>
            <Text style={s.kopAlamat}>
              {KOP.alamat} · {KOP.situs}
            </Text>
          </View>
        </View>

        <Text style={s.judul}>{input.subject}</Text>
        <Text style={s.nomor}>Nomor: {input.number}</Text>

        <Body html={input.bodyHtml} />

        <View style={s.ttdWrap}>
          <View style={s.ttd}>
            <Text style={s.ttdKota}>
              {KOP.kota}, {dateFmt.format(input.issuedAt)}
            </Text>
            {input.signatoryPosition ? <Text>{input.signatoryPosition}</Text> : null}
            <Image style={s.qr} src={qr} />
            <Text style={s.ttdNama}>{input.signatoryName}</Text>
          </View>
        </View>

        <Text style={s.catatan}>
          Ditandatangani secara elektronik. Keaslian surat ini dapat diperiksa
          dengan memindai QR di atas atau membuka {input.verifyUrl}
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
