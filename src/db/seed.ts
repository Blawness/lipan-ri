import "dotenv/config";
import { db } from "./index";
import { categories, posts, pages, users, media } from "./schema";
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

  // Media / Gallery
  const mediaData = [
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/4.jpg", altText: "Harun Prayitno - Dokumen Ketua", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/5.jpg", altText: "Harun Prayitno - Dokumen Ketua", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/1.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/6.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/7.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/2.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/11.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
    { url: "https://lipan-ri.org/wp-content/gallery/dokumen-ketua/12.jpg", altText: "Kegiatan LIPAN RI", album: "dokumen-ketua" },
  ];

  await db.delete(media);
  for (const m of mediaData) {
    await db.insert(media).values(m);
  }

  // Pages
  const pageData: (typeof pages.$inferInsert)[] = [
    {
      slug: "sekilas-lipan-ri",
      title: "Profil Lembaga",
      content: JSON.stringify({
        type: "profil",
        tentang: "LIPAN-RI adalah Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia, suatu Lembaga independen milik masyarakat yang berperan aktif dan bersinergi bersama Pemerintah. Melaksanakan pengawasan secara terpadu dan terarah serta terintegrasi terhadap berbagai permasalahan masyarakat dan pemerintah pusat maupun daerah mengenai aset-aset negara dan kekayaan milik Negara yang diselesaikan berdasarkan Peraturan perundang undangan yang berlaku dan secara transparan.",
        berdiri: "LIPAN-RI berdiri bulan Juli 2017 yang disahkan oleh Kementerian Hukum dan Hak Asasi Manusia dan diumumkan di Berita Negara dan Tambahan Berita Negara.",
        kasus: [
          "Membantu penyelesaian kasus mafia tanah",
          "Membantu dan mendampingi masyarakat dalam penyelesaian proses pembuatan sertipikat (SHM, SHGB)",
          "Melaksanakan sosialisasi dan memberi contoh untuk cara melakukan pengurusan sertipikat, baik perorangan maupun korporasi",
          "Membantu fasilitas umum Pemerintah Daerah (Pemda) yang fisiknya dikuasai pihak yang tidak bertanggung jawab",
        ],
        programKerja: {
          pendek: ["Pendataan aset-aset milik Negara", "Melakukan penyimpanan, pencatatan dokumentasi hasil investigasi", "Melakukan kerja sama dan koordinasi ke seluruh K/L negara"],
          menengah: ["Inventarisasi perihal aset-aset milik Negara", "Program pemetaan aset-aset milik Negara yang dianggap masih terlantar", "Program pengelolaan aset Negara berupa Sertifikat kepemilikan tanah"],
          panjang: ["Melakukan penyelamatan, pengamanan, dan pengawasan aset milik Negara secara menyeluruh dan profesional", "Melakukan koordinasi perihal pemanfaatan & pengelolaan aset milik Negara yang dianggap masih terlantar untuk menjadikan aset yang produktif dan bernilai ekonomis"],
        },
        maksud: "Memperhatikan pola pandang kerja yang ditujukan kepada Pengamanan, Pengawasan dan Penyelesaian aset-aset milik Negara yang berada diseluruh Wilayah Republik Indonesia guna mengantisipasi dan mengatasi kerusakan, kehilangan, dan penghapusan asset milik Negara yang dikuasai oleh pihak-pihak yang tidak bertanggung jawab.",
        tujuan: [
          "Mendukung dan mengawasi program Nawacita Presiden dan program di Kementrian ATR/BPN RI",
          "Bekerja sama dengan jajaran Badan Pertanahan Nasional (BPN) seluruh Indonesia untuk mensukseskan program Pendaftaran Tanah Sistimatis Lengkap (PTSL)",
          "Melaporkan berbagai bentuk penyimpangan dan kendala-kendala yang ditemukan di lapangan",
          "Investigasi Pengawasan, Pengamanan, Pengelolaan dipantau secara dini sebelum terjadi penyimpangan",
          "Menjadi wadah atau jembatan menerima aspirasi permasalahan baik dari masyarakat dan melibatkan pemerintah untuk diselesaikan dengan berdasarkan kebenaran dan Undang-undang yang berlaku",
        ],
      }),
      metaDescription: "Profil LIPAN RI — Lembaga Investigasi dan Pengawasan Aset Negara, program kerja, maksud dan tujuan",
    },
    {
      slug: "profil-ketua",
      title: "Profil Ketua",
      content: JSON.stringify({
        type: "profil-ketua",
        nama: "Harun Prayitno, SE, SH, MH",
        lahir: "Banyumas, 16 April 1967",
        semboyan: ["Ojo dumeh", "Mikul dhuwur mendhem jero", "Nglurug tanpa bala, menang tanpa ngasorak", "3 sa (sabar atine, saleh priyayine, sarah tumindake)"],
        latarBelakang: [
          "Ketua LIPAN RI, memiliki latar belakang kuat di bidang keagamaan dan organisasi kemasyarakatan",
          "Sangat aktif membantu panti asuhan dan pesantren sebagai donatur utama",
          "Turun langsung ke pelosok daerah untuk mendengarkan keluhan masyarakat terkait sengketa tanah",
          "Fokus utama: menyelesaikan sengketa pertanahan di Sumatera, Sulawesi, Jawa, Bali, NTB, Kalimantan",
          "Mengadvokasi restorative justice sebagai solusi sengketa di luar pengadilan",
        ],
        pendidikan: [
          { tahun: "1991", jurusan: "Ilmu Hukum", institusi: "Universitas Jenderal Soedirman" },
          { tahun: "2005", jurusan: "Ekonomi Manajemen", institusi: "INSTITUT LPPMI JAKARTA" },
          { tahun: "2021", jurusan: "Ilmu Hukum", institusi: "UNIVERSITAS ISLAM BALITAR – BLITAR" },
          { tahun: "2024", jurusan: "S2", institusi: "INSTITUT KH. AHMAD SANUSI SUKABUMI" },
        ],
        organisasi: [
          { tahun: "2004–2009", jabatan: "Wakil Ketua Dewan Pimpinan Cabang (DPC)", organisasi: "Partai Hanura" },
          { tahun: "2004–2009", jabatan: "Ketua Pemuda", organisasi: "Partai Hanura Provinsi Jawa Barat" },
          { tahun: "2017–sekarang", jabatan: "Dewan Pembina", organisasi: "Yayasan Paku Banten Indonesia" },
          { tahun: "2019–sekarang", jabatan: "Ketua Bidang Dana & Usaha", organisasi: "PBSI Jakarta Pusat" },
          { tahun: "2024–sekarang", jabatan: "Ketua Dewan Pembina", organisasi: "TIM REAKSI CEPAT (TRC) INDONESIA" },
          { tahun: "2025–sekarang", jabatan: "Anggota", organisasi: "Peradin" },
        ],
        pekerjaan: [
          { tahun: "1999–2009", jabatan: "Direktur Utama", perusahaan: "PT. EKA PRIMA SCIENTIFIC" },
          { tahun: "2004–2009", jabatan: "Direktur", perusahaan: "PT Mitra Teknik Utama" },
          { tahun: "2017–sekarang", jabatan: "Ketua Umum", perusahaan: "LIPAN-RI" },
          { tahun: "2022–sekarang", jabatan: "Pemimpin Umum & Komisaris Utama", perusahaan: "PT. Media Pelopor Wiratama" },
          { tahun: "2024–sekarang", jabatan: "Share holder", perusahaan: "PT. Presisi Konsulindo Prima" },
          { tahun: "2024–sekarang", jabatan: "Komisaris", perusahaan: "PT. TIGA ANAK PROPERTINDO" },
          { tahun: "2026–sekarang", jabatan: "Direktur Utama", perusahaan: "PT. ASET NUSANTARA INTERNASIONAL" },
        ],
        motivasi: "Berbekal pengalaman serta kemitraan dengan Badan Pertanahan Nasional (BPN) dalam penanganan konflik dan sengketa pertanahan di seluruh wilayah NKRI, serta didukung hubungan profesional dan sinergi yang terjalin dengan aparatur negara selama kurang lebih 20 tahun di lingkungan BPN.",
        visi: "Terwujudnya sistem pertanahan nasional yang profesional, modern, transparan, dan berintegritas guna mendukung kepastian hukum serta pelayanan publik yang optimal di lingkungan Kementerian ATR/BPN Republik Indonesia.",
        misi: [
          "Mensertifikatkan aset tanah milik Negara di 17.400 Pulau di wilayah NKRI",
          "Mensertifikatkan tanah terlantar milik Negara Ex. Perkebunan/kehutanan, Ex. BLBI, dan pertambangan",
          "Memberantas praktik mafia pertanahan di lingkungan Kementerian ATR/BPN RI",
          "Melakukan revitalisasi sumber daya manusia mulai dari Eselon V hingga Eselon I di lingkungan Kementerian ATR/BPN RI",
          "Membangun fasilitas dan Pusat Data dan Informasi (Pusdatin) yang canggih dan modern",
        ],
      }),
      metaDescription: "Profil Ketua LIPAN RI Harun Prayitno, SE, SH, MH",
    },
    {
      slug: "visi-misi",
      title: "Visi Misi & Motto",
      content: JSON.stringify({
        type: "visi-misi",
        visi: "Mengawasi, menyelamatkan, investigasi, pemantauan, pemeliharaan serta pencatatan barang aset milik Negara dan Masyarakat di seluruh wilayah Negara Kesatuan Republik Indonesia.",
        misi: [
          "Melakukan investigasi, pengamanan dan pengawasan aset milik negara dan masyarakat secara menyeluruh dan profesional serta berkelanjutan dan berkeadilan",
          "Melakukan koordinasi perihal pemanfaatan dan pengelolaan aset milik Negara dan Masyarakat",
          "Membantu Masyarakat Dalam Pelayanan Pertanahan",
        ],
        moto: "Melayani, Membantu, Dipercaya",
      }),
      metaDescription: "Visi, Misi, dan Motto LIPAN RI",
    },
    {
      slug: "struktur",
      title: "Struktur Organisasi",
      content: JSON.stringify({
        type: "struktur",
        struktur: [
          { level: 0, nama: "Pelindung Utama" },
          { level: 0, nama: "Pelindung" },
          { level: 1, nama: "Dewan Pembina" },
          { level: 1, nama: "Dewan Penasehat / Kehormatan" },
          { level: 1, nama: "Dewan Pengawas" },
          { level: 2, nama: "Ketua" },
          { level: 2, nama: "Wakil Ketua" },
          { level: 3, nama: "Sekretaris" },
          { level: 3, nama: "Bendahara" },
          { level: 4, nama: "Divisi SDM & Umum" },
          { level: 4, nama: "Divisi Bantuan Hukum dan HAM" },
          { level: 4, nama: "Divisi Infokom" },
          { level: 4, nama: "Divisi Investigasi/Pengawasan" },
          { level: 4, nama: "Divisi Tata Usaha Umum" },
        ],
      }),
      metaDescription: "Struktur Organisasi LIPAN RI",
    },
    {
      slug: "legalitas",
      title: "Legalitas Lembaga",
      content: JSON.stringify({
        type: "legalitas",
        akte: [
          { label: "Pendirian", detail: "Akte Notaris & PPAT Yunita Aristina, SH., M.Kn No: 18 tanggal 19 Juli 2017" },
          { label: "Perubahan", detail: "Akte Notaris & PPAT Eka Sugiarti, SH. No: 9 tanggal 9 Juli 2024" },
        ],
        sk: [
          { label: "Pengesahan 2017", detail: "Keputusan Menteri Hukum & HAM RI No: AHU-0010835.AH.01.07 Tahun 2017, tanggal 20 Juli 2017" },
          { label: "Persetujuan Perubahan 2024", detail: "Keputusan Menteri Hukum dan HAM RI No: AHU-0001069.AH.01.06 Tahun 2024, tanggal 26 Juli 2024" },
        ],
        beritaNegara: "Berita Negara No. 063 / Tambahan Berita Negara RI No. 000301, tanggal 7 Agustus 2000",
        npwp: "43.137.889.2-071.000",
        kpp: "KPP Pratama Jakarta Menteng Dua",
        bank: { nama: "Bank Mandiri Cabang Jakarta Matraman", norek: "006-00-1113256-4", atasNama: "Lembaga Investigasi dan Pengawasan Aset Negara (LIPAN-RI)" },
      }),
      metaDescription: "Legalitas LIPAN RI — Akte, SK Kemenkumham, NPWP, Rekening Bank",
    },
    {
      slug: "arti-lambang",
      title: "Arti Lambang",
      content: JSON.stringify({
        type: "lambang",
        elemen: [
          { nama: "Segi Lima", arti: "Berazaskan Pancasila dan UUD 1945" },
          { nama: "Warna Biru Tua", arti: "Mengedepankan kepercayaan dan profesionalisme" },
          { nama: "Sayap (7 bulu)", arti: "Awal berdirinya LIPAN-RI pada bulan ke-7 (Juli) tahun 2017" },
          { nama: "Bintang", arti: "Ketaatan pada Hukum dan keyakinan terhadap Tuhan Yang Maha Esa" },
          { nama: "Bumi", arti: "Wadah pekerjaan LIPAN-RI yang berhubungan langsung dengan tanah dan unsur bumi" },
          { nama: "Padi dan Kapas", arti: "Pangan dan sandang — kebutuhan pokok rakyat Indonesia, melambangkan kesejahteraan" },
          { nama: "Pita \"Setya Bhakti Pertiwi\"", arti: "Identitas LIPAN-RI yang bersih dan independen serta siap melindungi ibu pertiwi" },
        ],
      }),
      metaDescription: "Arti Lambang LIPAN RI — makna dari setiap elemen logo",
    },
  ];

  await db.delete(pages);
  for (const page of pageData) {
    await db.insert(pages).values(page);
  }

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
