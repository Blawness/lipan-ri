import "dotenv/config";
import { db } from "./index";
import { pengurus } from "./schema";

// Tanggal sementara: tanggal mulai menjabat yang sebenarnya belum diketahui dan
// tidak boleh dikarang — halaman verifikasi menampilkannya sebagai fakta.
// Koreksi lewat /admin/pengurus setelah seed.
const MULAI = new Date("2026-01-01T00:00:00Z");

const DATA = [
  {
    slot: "pembina",
    slug: "hengki-putra-juwita",
    nama: "Hengki Putra Juwita",
    jabatan: "Dewan Pembina",
    deskripsi:
      "Memberikan arahan strategis dan pembinaan atas kebijakan umum lembaga, serta mengawasi agar seluruh kegiatan LIPAN RI tetap sejalan dengan visi, misi, dan anggaran dasar organisasi.",
  },
  {
    slot: "penasehat",
    slug: "sri-hartono-sasongko",
    nama: "Sri Hartono Sasongko",
    jabatan: "Dewan Penasehat/Kehormatan",
    deskripsi:
      "Memberikan pertimbangan dan nasihat kepada Dewan Pembina serta Ketua atas persoalan strategis lembaga, baik diminta maupun tidak diminta.",
  },
  {
    slot: "ketua",
    slug: "harun-prayitno",
    nama: "Harun Prayitno, S.E., S.H., M.H.",
    jabatan: "Ketua",
    foto: "/ketua-harun-prayitno.png",
    deskripsi:
      "Memimpin dan bertanggung jawab atas keseluruhan jalannya organisasi, mewakili lembaga ke luar, serta mengambil keputusan tertinggi dalam pelaksanaan program kerja LIPAN RI.",
  },
  {
    slot: "staf-khusus",
    slug: "wiryanto",
    nama: "Wiryanto, S.T.",
    jabatan: "Staf Khusus Ketua",
    deskripsi:
      "Membantu Ketua dalam kajian, penyiapan bahan keputusan, dan penugasan khusus yang berada di luar jalur struktural harian.",
  },
  {
    slot: "koordinator-keamanan",
    slug: "mulkan-lessy-tussen",
    nama: "Mulkan Lessy Tussen",
    jabatan: "Koordinator Keamanan",
    deskripsi:
      "Mengoordinasikan aspek keamanan kegiatan dan personel lembaga, termasuk pengamanan kegiatan lapangan dan investigasi.",
  },
  {
    slot: "sekjen",
    slug: "cahya-puspita-rini",
    nama: "Cahya Puspita Rini, S.E.",
    jabatan: "Sekretaris Jenderal",
    deskripsi:
      "Menjalankan administrasi dan kesekretariatan lembaga, mengoordinasikan kerja antar divisi, serta memastikan program kerja berjalan sesuai keputusan Ketua.",
  },
  {
    slot: "bendahara",
    slug: "velia-dwi-yulianti",
    nama: "Velia Dwi Yulianti, S.E.",
    jabatan: "Bendahara Umum",
    deskripsi:
      "Mengelola keuangan lembaga, menyusun anggaran dan laporan pertanggungjawaban, serta memastikan setiap pengeluaran tercatat dan dapat diaudit.",
  },
  {
    slot: "sdm",
    slug: "ruswondo-awidjan",
    nama: "Ruswondo Awidjan, S.H.",
    jabatan: "SDM dan Umum",
    deskripsi:
      "Membina sumber daya manusia lembaga — perekrutan, penempatan, dan peningkatan kapasitas anggota — serta mengurus kebutuhan umum dan perlengkapan organisasi.",
  },
  {
    slot: "div-hukum",
    slug: "annisa-novianty",
    nama: "Annisa Novianty, S.H., M.H.",
    jabatan: "Divisi Bantuan Hukum & HAM",
    deskripsi:
      "Memberikan pendampingan dan bantuan hukum bagi masyarakat, serta menangani laporan dugaan pelanggaran hak asasi manusia yang masuk ke lembaga.",
  },
  {
    slot: "hukum-1",
    slug: "adam-maulana-hafiz",
    nama: "Adam Maulana Hafiz, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
  },
  {
    slot: "hukum-2",
    slug: "firdausi-aglis-akbar",
    nama: "Firdausi Aglis Akbar, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
  },
  {
    slot: "div-pengawasan",
    slug: "najib-payudin",
    nama: "Najib Payudin",
    jabatan: "Divisi Pengawasan",
    deskripsi:
      "Melakukan pemantauan terhadap penyelenggaraan pelayanan publik dan penggunaan anggaran negara, serta menindaklanjuti temuan bersama divisi terkait.",
  },
  {
    slot: "pengawasan-1",
    slug: "ardi-erfindo-wael",
    nama: "Ardi Erfindo Wael",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu kegiatan pemantauan lapangan dan penyusunan laporan hasil pengawasan.",
  },
  {
    slot: "div-media",
    slug: "yandi-nurarifiandi",
    nama: "Yandi Nurarifiandi, S.Sos",
    jabatan: "Divisi Media Infokom",
    deskripsi:
      "Mengelola komunikasi publik lembaga: pemberitaan, publikasi kegiatan, media sosial, dan hubungan dengan media massa.",
  },
  {
    slot: "media-1",
    slug: "yudha-hafiz",
    nama: "Yudha Hafiz, S.BNS.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "media-2",
    slug: "ahmada-aliftano-nugroho",
    nama: "Ahmada Aliftano Nugroho, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "media-3",
    slug: "muhammad-ihsan-naufal",
    nama: "Muhammad Ihsan Naufal",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "div-investigasi",
    slug: "muhammad-faizal-amri",
    nama: "Muhammad Faizal Amri",
    jabatan: "Divisi Investigasi",
    deskripsi:
      "Menelusuri dan mendalami laporan masyarakat atas dugaan penyimpangan, serta menyusun hasil investigasi sebagai bahan tindak lanjut lembaga.",
  },
];

async function seedPengurus() {
  console.log("🌱 Seeding pengurus…");

  // onConflictDoNothing pada `slot`: aman dijalankan berulang dan tidak pernah
  // menimpa suntingan yang sudah dibuat lewat panel admin.
  for (const [i, p] of DATA.entries()) {
    await db
      .insert(pengurus)
      .values({
        ...p,
        nomorAnggota: `LIPAN-2026-${String(i + 1).padStart(4, "0")}`,
        mulaiMenjabat: MULAI,
      })
      .onConflictDoNothing({ target: pengurus.slot });
  }

  console.log(`✅ ${DATA.length} pengurus siap.`);
  process.exit(0);
}

seedPengurus().catch((e) => {
  console.error(e);
  process.exit(1);
});
