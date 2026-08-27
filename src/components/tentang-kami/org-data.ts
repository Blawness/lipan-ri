export type OrgVariant = "utama" | "divisi" | "staf";

export interface OrgMember {
  id: string;
  role: string;
  nama: string;
  variant: OrgVariant;
  /** Foto pengurus. Kosong = panel detail jatuh ke inisial nama. */
  foto?: string;
  /** Tupoksi singkat jabatan — tampil di panel detail. */
  deskripsi?: string;
  /** Kontak resmi. Hanya isi yang memang boleh dipublikasikan. */
  email?: string;
  telepon?: string;
}

export interface Divisi {
  head: OrgMember;
  staf: OrgMember[];
}

export interface OrgStruktur {
  pembina: OrgMember;
  penasehat: OrgMember;
  ketua: OrgMember;
  stafKhusus: OrgMember[];
  sekjen: OrgMember;
  bendahara: OrgMember;
  sdm: OrgMember;
  divisi: Divisi[];
}

export const ORG: OrgStruktur = {
  pembina: {
    id: "pembina",
    role: "Dewan Pembina",
    nama: "Hengki Putra Juwita",
    variant: "utama",
    deskripsi:
      "Memberikan arahan strategis dan pembinaan atas kebijakan umum lembaga, serta mengawasi agar seluruh kegiatan LIPAN RI tetap sejalan dengan visi, misi, dan anggaran dasar organisasi.",
  },
  penasehat: {
    id: "penasehat",
    role: "Dewan Penasehat/Kehormatan",
    nama: "Sri Hartono Sasongko",
    variant: "utama",
    deskripsi:
      "Memberikan pertimbangan dan nasihat kepada Dewan Pembina serta Ketua atas persoalan strategis lembaga, baik diminta maupun tidak diminta.",
  },
  ketua: {
    id: "ketua",
    role: "Ketua",
    nama: "Harun Prayitno, S.E., S.H., M.H.",
    variant: "utama",
    foto: "/ketua-harun-prayitno.png",
    deskripsi:
      "Memimpin dan bertanggung jawab atas keseluruhan jalannya organisasi, mewakili lembaga ke luar, serta mengambil keputusan tertinggi dalam pelaksanaan program kerja LIPAN RI.",
  },
  stafKhusus: [
    {
      id: "staf-khusus",
      role: "Staf Khusus Ketua",
      nama: "Wiryanto, S.T.",
      variant: "utama",
      deskripsi:
        "Membantu Ketua dalam kajian, penyiapan bahan keputusan, dan penugasan khusus yang berada di luar jalur struktural harian.",
    },
    {
      id: "koordinator-keamanan",
      role: "Koordinator Keamanan",
      nama: "Mulkan Lessy Tussen",
      variant: "utama",
      deskripsi:
        "Mengoordinasikan aspek keamanan kegiatan dan personel lembaga, termasuk pengamanan kegiatan lapangan dan investigasi.",
    },
  ],
  sekjen: {
    id: "sekjen",
    role: "Sekretaris Jenderal",
    nama: "Cahya Puspita Rini, S.E.",
    variant: "utama",
    deskripsi:
      "Menjalankan administrasi dan kesekretariatan lembaga, mengoordinasikan kerja antar divisi, serta memastikan program kerja berjalan sesuai keputusan Ketua.",
  },
  bendahara: {
    id: "bendahara",
    role: "Bendahara Umum",
    nama: "Velia Dwi Yulianti, S.E.",
    variant: "utama",
    deskripsi:
      "Mengelola keuangan lembaga, menyusun anggaran dan laporan pertanggungjawaban, serta memastikan setiap pengeluaran tercatat dan dapat diaudit.",
  },
  sdm: {
    id: "sdm",
    role: "SDM dan Umum",
    nama: "Ruswondo Awidjan, S.H.",
    variant: "utama",
    deskripsi:
      "Membina sumber daya manusia lembaga — perekrutan, penempatan, dan peningkatan kapasitas anggota — serta mengurus kebutuhan umum dan perlengkapan organisasi.",
  },
  divisi: [
    {
      head: {
        id: "div-hukum",
        role: "Divisi Bantuan Hukum & HAM",
        nama: "Annisa Novianty, S.H., M.H.",
        variant: "divisi",
        deskripsi:
          "Memberikan pendampingan dan bantuan hukum bagi masyarakat, serta menangani laporan dugaan pelanggaran hak asasi manusia yang masuk ke lembaga.",
      },
      staf: [
        {
          id: "hukum-1",
          role: "Staf Divisi",
          nama: "Adam Maulana Hafiz, S.H.",
          variant: "staf",
          deskripsi:
            "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
        },
        {
          id: "hukum-2",
          role: "Staf Divisi",
          nama: "Firdausi Aglis Akbar, S.H.",
          variant: "staf",
          deskripsi:
            "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
        },
      ],
    },
    {
      head: {
        id: "div-pengawasan",
        role: "Divisi Pengawasan",
        nama: "Najib Payudin",
        variant: "divisi",
        deskripsi:
          "Melakukan pemantauan terhadap penyelenggaraan pelayanan publik dan penggunaan anggaran negara, serta menindaklanjuti temuan bersama divisi terkait.",
      },
      staf: [
        {
          id: "pengawasan-1",
          role: "Staf Divisi",
          nama: "Ardi Erfindo Wael",
          variant: "staf",
          deskripsi:
            "Membantu kegiatan pemantauan lapangan dan penyusunan laporan hasil pengawasan.",
        },
      ],
    },
    {
      head: {
        id: "div-media",
        role: "Divisi Media Infokom",
        nama: "Yandi Nurarifiandi, S.Sos",
        variant: "divisi",
        deskripsi:
          "Mengelola komunikasi publik lembaga: pemberitaan, publikasi kegiatan, media sosial, dan hubungan dengan media massa.",
      },
      staf: [
        {
          id: "media-1",
          role: "Staf Divisi",
          nama: "Yudha Hafiz, S.BNS.",
          variant: "staf",
          deskripsi:
            "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
        },
        {
          id: "media-2",
          role: "Staf Divisi",
          nama: "Ahmada Aliftano Nugroho, S.H.",
          variant: "staf",
          deskripsi:
            "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
        },
        {
          id: "media-3",
          role: "Staf Divisi",
          nama: "Muhammad Ihsan Naufal",
          variant: "staf",
          deskripsi:
            "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
        },
      ],
    },
    {
      head: {
        id: "div-investigasi",
        role: "Divisi Investigasi",
        nama: "Muhammad Faizal Amri",
        variant: "divisi",
        deskripsi:
          "Menelusuri dan mendalami laporan masyarakat atas dugaan penyimpangan, serta menyusun hasil investigasi sebagai bahan tindak lanjut lembaga.",
      },
      staf: [],
    },
  ],
};
