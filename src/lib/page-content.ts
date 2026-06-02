/**
 * Tipe konten JSON untuk halaman "Tentang Kami" (kolom `pages.content`).
 * Dibedakan lewat field `type` (discriminated union).
 */

export interface ProfilContent {
  type: "profil";
  tentang: string;
  berdiri: string;
  kasus: string[];
  programKerja: {
    pendek: string[];
    menengah: string[];
    panjang: string[];
  };
  maksud: string;
  tujuan: string[];
}

export interface ProfilKetuaContent {
  type: "profil-ketua";
  nama: string;
  lahir: string;
  semboyan: string[];
  latarBelakang: string[];
  pendidikan: { tahun: string; jurusan: string; institusi: string }[];
  pekerjaan: { tahun: string; jabatan: string; perusahaan: string }[];
  organisasi: { tahun: string; jabatan: string; organisasi: string }[];
  motivasi: string;
  visi: string;
  misi: string[];
}

export interface VisiMisiContent {
  type: "visi-misi";
  visi: string;
  misi: string[];
  moto: string;
}

export interface StrukturItem {
  level: number;
  nama: string;
}

export interface StrukturContent {
  type: "struktur";
  struktur: StrukturItem[];
}

export interface LegalitasContent {
  type: "legalitas";
  akte: { label: string; detail: string }[];
  sk: { label: string; detail: string }[];
  npwp: string;
  kpp: string;
  bank: { nama: string; norek: string; atasNama: string };
  beritaNegara: string;
}

export interface LambangContent {
  type: "lambang";
  elemen: { nama: string; arti: string }[];
}

export type PageContent =
  | ProfilContent
  | ProfilKetuaContent
  | VisiMisiContent
  | StrukturContent
  | LegalitasContent
  | LambangContent;
