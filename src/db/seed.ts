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
      title: "Latar Belakang Harun Prayitno, SE, SH, MH.",
      content: `<p><strong>Semboyan Jati Diri</strong></p>
<ol>
  <li>Ojo dumeh</li>
  <li>Mikul dhuwur mendhem jero</li>
  <li>Nglurug tanpa bala, menang tanpa ngasorak</li>
  <li>3 sa (sabar atine, saleh priyayine, sarah tumindake)</li>
</ol>
<p>Ketua Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) Harun Prayitno, SE., SH., MH merupakan seorang tokoh yang memiliki latar belakang kuat dibidang keagamaan dan organisasi kemasyarakatan. Pria kelahiran Banyumas 16 April 1967 sangat taat beribadah ini memiliki mimpi besarnya untuk membangun Indonesia khususnya dalam penyelesaian konflik dan sengketa pertanahan. Ia juga sangat aktif dalam bidang keagaaman khususnya untuk membantu panti asuhan dan pesantren agar selalu tetap eksis yang menjadikannya ia sebagai donatur utama yang tanpa pamrih demi membantu keberlangsungan kegiatan ibadah kepada Alloh SWT.</p>
<p>Untuk mewujudkan mimpi besarnya di bidang Pertanahan, Harun Prayitno tidak segan untuk turun ke pelosok daerah demi mendengarkan keluhan Masyarakat terkait permasalahan sengketa Tanah serta mencari Solusi demi terselesaikan permasalahannya. Eksistensi kegiatan di bidang pertanahan saat ini menjadi focus utama Harun Prayitno dalam kegiatan sehari hari. Berbagai terobosan yang dilakukannya saat ini telah melakukan berbagai Upaya mengurai permasalahan sengketa tanah dari pulau Sumatera, Sulawesi, Jawa, Bali, NTB, Kalimantan dan daerah lainnya yang tak luput dari perhatian dan dedikasi nya demi membantu Masyarakat.</p>
<p>Sebagai Ketua LIPAN RI, Harun Prayitno mendapat dukungan secara nasional atas sifat komitmennya untuk selalu mengabdi kepada masyarakat, bangsa dan negara. Dalam berbagai kesempatan ia sering hadir dalam acara – acara yang diselenggarakan pihak pemerintah pusat maupun Pemerintah Daerah Kota dan Kabupaten berkolaborasi membangun Indonesia menuju Indonesia emas 2045.</p>
<p>Eksistensi seorang Harun Prayitno saat ini ia sedang konsen mengurai permasalahan sengketa pertanahan yang telah berpuluh tahun sampai saat ini belum terselesaikan dan bahkan telah memakan korban nyawa demi Upayanya untuk mendapatkan hak dan kepastian hukum atas kepemilikan tanahnya. Salah satu kasus yang ia soroti adalah permasalahan lahan di Lombok Tengah NTB yaitu bukit Seger yang berbatasan langsung dengan Sirkuit Mandalika.</p>
<p>Di pulau Bali, Harun Prayitno juga menjadi orang yang terdepan membantu mengurai sengketa tanah yang tidak pernah selesai. Salah satu terobosan yang dilakukannya yaitu dengan Upaya restorative Justice.</p>
<p>Menurut Harun Prayitno Upaya perdamaian dengan Restoratif Justice menjadi salah satu Langkah yang terbaik yang bisa dilakukan saat ini. Penyelesaian sengketa melalui jalur litigasi (pengadilan) bukanlah merupakan satu-satuya cara penyelesaian sengketa yang dapat ditempuh oleh para pihak yang bersengketa. Penyelesaian sengketa tanah melalui Pengadilan terkadang menghabiskan banyak waktu tenaga biaya. Bahkan, terkadang biaya yang dikeluarkan bisa lebih tinggi dari materi pokok dari properti yang disengketakan.</p>
<p>Harun Prayitno berpendapat bahwa Upaya penyelesaian sengketa di luar pengadilan (non litigasi), yaitu penyelesaian sengketa melalui negosiasi (musyawarah), mediasi, arbitrase, dan konsiliasi serta Upaya penyelesaian sengketa secara damai dengan restorative justice yang pada dasarnya dapat diterima oleh para pihak yang bersengketa karena prosesnya didasarkan pada pengaturan sendiri dan masih kental diwarnai dengan adat kebiasaan setempat.</p>
<p><strong>Pendidikan Formal:</strong></p>
<ul>
  <li>Tahun 1991 — Universitas Jenderal Soedirman Jurusan Ilmu Hukum</li>
  <li>Tahun 2005 — INSTITUT LPPMI JAKARTA Jurusan Ekonomi Manajemen</li>
  <li>Tahun 2021 — UNIVERSITAS ISLAM BALITAR – BLITAR Ilmu Hukum</li>
  <li>Tahun 2024 — INSTITUT KH. AHMAD SANUSI SUKABUMI S2</li>
</ul>
<p><strong>Pengalaman Organisasi</strong></p>
<ul>
  <li>2004–2009 — Wakil Ketua Dewan Pimpinan Cabang (DPC) Partai Hanura</li>
  <li>2004–2009 — Ketua Pemuda Partai Hanura Provinsi Jawa Barat</li>
  <li>2017–sekarang — Dewan Pembina Yayasan Paku Banten Indonesia</li>
  <li>2019–sekarang — Ketua Bidang Dana & Usaha PBSI Jakarta Pusat</li>
  <li>2024–sekarang — Ketua Dewan Pembina TIM REAKSI CEPAT (TRC) INDONESIA</li>
  <li>2025–sekarang — Anggota Peradin</li>
</ul>
<p><strong>Pengalaman Pekerjaan</strong></p>
<ul>
  <li>1999–2009 — Direktur Utama PT. EKA PRIMA SCIENTIFIC</li>
  <li>2004–2009 — Direktur PT Mitra Teknik Utama</li>
  <li>2017–sekarang — Ketua Umum LIPAN-RI</li>
  <li>2022–sekarang — Pemimpin Umum dan Komisaris Utama PT. Media Pelopor Wiratama</li>
  <li>2024–sekarang — Share holder PT. Presisi Konsulindo Prima</li>
  <li>2024–sekarang — Komisaris PT. TIGA ANAK PROPERTINDO</li>
  <li>2026–sekarang — Direktur Utama PT. ASET NUSANTARA INTERNASIONAL</li>
</ul>
<p><strong>MOTIVASI PENGABDIAN</strong></p>
<p>Berbekal pengalaman serta kemitraan dengan Badan Pertanahan Nasional (BPN) dalam penanganan konflik dan sengketa pertanahan di seluruh wilayah NKRI, serta didukung hubungan profesional dan sinergi yang terjalin dengan aparatur negara selama kurang lebih 20 tahun di lingkungan BPN.</p>
<p><strong>VISI</strong></p>
<p>"Terwujudnya sistem pertanahan nasional yang profesional, modern, transparan, dan berintegritas guna mendukung kepastian hukum serta pelayanan publik yang optimal di lingkungan Kementerian ATR/BPN Republik Indonesia".</p>
<p><strong>MISI</strong></p>
<ol>
  <li>Mensertifikatkan aset tanah milik Negara di 17.400 Pulau di wilayah NKRI</li>
  <li>Mensertifikatkan tanah terlantar milik Negara Ex. Perkebunan/kehutanan, Ex. BLBI, dan pertambangan</li>
  <li>Memberantas praktik mafia pertanahan di lingkungan Kementerian ATR/BPN RI</li>
  <li>Melakukan revitalisasi sumber daya manusia mulai dari Eselon V hingga Eselon I di lingkungan Kementerian ATR/BPN RI</li>
  <li>Membangun fasilitas dan Pusat Data dan Informasi (Pusdatin) yang canggih dan modern serta terintegrasi guna mendukung pelaksanaan program Sertifikat Elektronik</li>
</ol>`,
      metaDescription: "Profil Ketua LIPAN RI Harun Prayitno, SE, SH, MH — Latar belakang, pendidikan, pengalaman organisasi, dan motivasi pengabdian",
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
