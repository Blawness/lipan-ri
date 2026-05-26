import "dotenv/config";
import { db } from "./index";
import { categories, posts, pages, users } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Default user (for future admin)
  await db.insert(users).values({
    email: "admin@lipan-ri.org",
    name: "Admin LIPAN RI",
    role: "admin",
  }).onConflictDoNothing();

  // Categories
  const categoryData = [
    { slug: "berita", name: "Berita", description: "Berita utama LIPAN RI" },
    { slug: "press-rilis", name: "Press Rilis", description: "Siaran pers resmi LIPAN RI" },
    { slug: "opini-dan-kajian", name: "Opini dan Kajian", description: "Opini dan kajian dari LIPAN RI" },
    { slug: "profil-lembaga", name: "Profil Lembaga", description: "Tentang LIPAN RI" },
    { slug: "profil-ketua-lipan-ri", name: "Profil Ketua Lipan RI", description: "Profil pimpinan LIPAN RI" },
    { slug: "visi-misi-motto", name: "Visi Misi & Motto", description: "Visi, misi, dan motto LIPAN RI" },
    { slug: "struktur-organisasi", name: "Struktur Organisasi", description: "Struktur organisasi LIPAN RI" },
    { slug: "legalitas-lembaga", name: "Legalitas Lembaga", description: "Legalitas LIPAN RI" },
    { slug: "lambang-lembaga", name: "Lambang Lembaga", description: "Arti lambang LIPAN RI" },
    { slug: "maksud-dan-tujuan", name: "Maksud dan Tujuan", description: "Maksud dan tujuan LIPAN RI" },
    { slug: "galeri-foto", name: "Galeri Foto", description: "Galeri foto kegiatan" },
    { slug: "hubungi-kami", name: "Hubungi Kami", description: "Kontak LIPAN RI" },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  const beritaId = (await db.select().from(categories).where(eq(categories.slug, "berita")).limit(1))[0]?.id;
  const pressRilisId = (await db.select().from(categories).where(eq(categories.slug, "press-rilis")).limit(1))[0]?.id;

  // Sample posts
  const postData = [
    {
      slug: "terkait-permohonan-sertifikat-ganda-bpn-lombok-tengah-di-geruduk-massa",
      title: "Terkait Permohonan Sertifikat Ganda, BPN Lombok Tengah di geruduk Massa",
      excerpt: "Lombok Tengah - Forum Rakyat Bersatu (FRB) bersama keluarga besar Mamiq Kalsum, Lombok Tengah (Loteng) Nusa Tenggara Barat (NTB) menggeruduk Kantor Pertanahan (Kantah) BPN/ATR Lombok Tengah, Senin 29 September 2025.",
      content: `<p>Lombok Tengah - Forum Rakyat Bersatu (FRB) bersama keluarga besar Mamiq Kalsum, Lombok Tengah (Loteng) Nusa Tenggara Barat (NTB) menggeruduk Kantor Pertanahan (Kantah) BPN/ATR Lombok Tengah, Senin 29 September 2025. Mereka mendesak Kepala Kantah Loteng untuk segera menindaklanjuti permohonan pendaftaran tanah yang diajukan sejak tahun 2018 silam.</p><p>Ketua FRB menyatakan bahwa permohonan sertifikat yang diajukan oleh Mamiq Kalsum tidak kunjung diproses oleh BPN Lombok Tengah, sementara pihak lain justru mengajukan permohonan sertifikat di atas objek tanah yang sama.</p>`,
      categoryId: beritaId,
      isFeatured: true,
      status: "published" as const,
      publishedAt: new Date("2025-09-30"),
    },
    {
      slug: "kuasa-hukum-minta-surat-keputusan-pembatalan-shm-ni-wayan-dontri-dibatalkan",
      title: "Kuasa Hukum Minta Surat Keputusan Pembatalan SHM Ni Wayan Dontri Dibatalkan",
      excerpt: "Bali - Kuasa hukum Ni Wayan Dontri, Veronika Giron, S.H., menyampaikan klarifikasi sekaligus koreksi terhadap pernyataan Kepala Kantor Pertanahan.",
      content: `<p>Bali - Kuasa hukum Ni Wayan Dontri, Veronika Giron, S.H., menyampaikan klarifikasi sekaligus koreksi terhadap pernyataan Kepala Kantor Pertanahan Kabupaten Buleleng terkait pembatalan Sertifikat Hak Milik (SHM) atas nama Ni Wayan Dontri.</p><p>Veronika menegaskan bahwa kliennya memiliki bukti kepemilikan yang sah dan meminta agar Surat Keputusan Pembatalan SHM tersebut dibatalkan demi hukum.</p>`,
      categoryId: beritaId,
      status: "published" as const,
      publishedAt: new Date("2025-09-19"),
    },
    {
      slug: "ketua-lipan-ri-turun-gunung-soroti-proses-sertifikasi-lahan-di-lombok-tengah",
      title: "Ketua LIPAN RI Turun Gunung Soroti Proses Sertifikasi Lahan Di Lombok Tengah",
      excerpt: "Mataram - Menindaklanjuti banyaknya pengaduan masyarakat dan maraknya Oknum Mafia Tanah dan oknum Mafia Hukum.",
      content: `<p>Mataram - Menindaklanjuti banyaknya pengaduan masyarakat dan maraknya Oknum Mafia Tanah dan oknum Mafia Hukum serta persoalan sengketa lahan di Provinsi Nusa Tenggara Barat, Ketua Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) Harun Prayitno, SE., SH., MH turun langsung ke Lombok Tengah.</p><p>Kehadiran Ketua LIPAN RI di Lombok Tengah disambut antusias oleh masyarakat yang berharap ada solusi atas persoalan sertifikasi lahan yang mereka hadapi.</p>`,
      categoryId: pressRilisId,
      isFeatured: true,
      status: "published" as const,
      publishedAt: new Date("2025-07-25"),
    },
    {
      slug: "ketua-lipan-ri-tegaskan-pentingnya-kolaborasi-antar-instansi-dalam-pensertipikatan-aset-tanah-bmd-pemprov-dki-jakarta",
      title: "Ketua LIPAN RI Tegaskan Pentingnya Kolaborasi Antar Instansi Dalam Pensertipikatan Aset Tanah BMD Pemprov DKI Jakarta",
      excerpt: "Jakarta - BPAD DKI Jakarta menggelar kegiatan Focus Group Discussion (FGD) Percepatan Pensertifikatan Barang Milik Daerah.",
      content: `<p>Jakarta - BPAD DKI Jakarta menggelar kegiatan Focus Group Discussion (FGD) Percepatan Pensertifikatan Barang Milik Daerah (BMD) berupa tanah Pemerintah Provinsi DKI Jakarta. Kegiatan ini dihadiri oleh berbagai instansi terkait.</p><p>Ketua LIPAN RI Harun Prayitno menegaskan pentingnya kolaborasi antar instansi dalam pensertipikatan aset tanah BMD Pemprov DKI Jakarta. Beliau menyatakan bahwa sinergi antar lembaga adalah kunci keberhasilan program sertifikasi.</p>`,
      categoryId: pressRilisId,
      status: "published" as const,
      publishedAt: new Date("2025-07-23"),
    },
  ];

  for (const post of postData) {
    await db.insert(posts).values(post).onConflictDoNothing();
  }

  // Pages
  const pageData = [
    {
      slug: "sekilas-lipan-ri",
      title: "Sekilas LIPAN RI",
      content: `<p>LIPAN-RI adalah Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia, suatu Lembaga independen milik masyarakat yang berkomitmen untuk mengawal dan mengawasi aset-aset negara agar tidak diselewengkan.</p><p>Lembaga ini didirikan dengan semangat untuk menjaga kedaulatan aset negara dan memastikan bahwa kekayaan negara dikelola secara transparan dan akuntabel.</p>`,
      metaDescription: "Sekilas tentang LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    },
    {
      slug: "struktur",
      title: "Struktur Organisasi",
      content: `<p>STRUKTUR ORGANISASI LIPAN-RI terdiri dari:</p><ul><li>Pelindung Utama</li><li>Pelindung</li><li>Dewan Pembina</li><li>Dewan Penasehat / Kehormatan</li><li>Dewan Pengawas</li><li>Ketua</li><li>Wakil Ketua</li><li>Sekretaris Jenderal</li><li>Bendahara</li><li>Divisi-divisi</li></ul>`,
      metaDescription: "Struktur Organisasi LIPAN RI",
    },
    {
      slug: "profil-ketua",
      title: "Profil Ketua LIPAN RI",
      content: `<p>Ketua Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) Harun Prayitno, SE., SH., MH merupakan seorang tokoh yang memiliki dedikasi tinggi dalam pengawasan aset negara.</p><p>Dengan latar belakang pendidikan Sarjana Ekonomi, Sarjana Hukum, dan Magister Hukum, beliau memimpin LIPAN RI dengan prinsip integritas dan profesionalisme.</p>`,
      metaDescription: "Profil Ketua LIPAN RI Harun Prayitno, SE, SH, MH",
    },
    {
      slug: "visi-misi",
      title: "Visi Misi & Motto",
      content: `<p><strong>Visi:</strong> Menjadi lembaga independen terdepan dalam investigasi dan pengawasan aset negara di Indonesia.</p><p><strong>Misi:</strong></p><ul><li>Melakukan investigasi terhadap dugaan penyelewengan aset negara</li><li>Mengawasi pengelolaan aset negara secara transparan</li><li>Memberikan advokasi kepada masyarakat terkait sengketa aset</li></ul>`,
      metaDescription: "Visi, Misi, dan Motto LIPAN RI",
    },
    {
      slug: "legalitas",
      title: "Legalitas Lembaga",
      content: `<p>LIPAN RI memiliki legalitas yang sah sesuai dengan peraturan perundang-undangan yang berlaku di Indonesia, termasuk:</p><ul><li>Akta Pendirian</li><li>SK Kemenkumham</li><li>Sertifikat Merek LIPAN RI</li></ul>`,
      metaDescription: "Legalitas LIPAN RI",
    },
    {
      slug: "arti-lambang",
      title: "Arti Lambang",
      content: `<p>LIPAN-RI berlambangkan bangun segi lima yang mengandung arti bahwa LIPAN-RI berazaskan Pancasila dan UUD 1945.</p><p>Warna biru melambangkan keteguhan dan profesionalisme, sedangkan warna merah melambangkan keberanian dalam menegakkan kebenaran.</p>`,
      metaDescription: "Arti Lambang LIPAN RI",
    },
    {
      slug: "maksud-dan-tujuan",
      title: "Maksud dan Tujuan",
      content: `<p>Maksud dan tujuan didirikannya LIPAN RI adalah untuk membantu pemerintah dalam mengawasi dan menjaga aset-aset negara agar tetap berada dalam penguasaan negara dan tidak diselewengkan oleh pihak yang tidak bertanggung jawab.</p>`,
      metaDescription: "Maksud dan Tujuan LIPAN RI",
    },
  ];

  for (const page of pageData) {
    await db.insert(pages).values(page).onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
