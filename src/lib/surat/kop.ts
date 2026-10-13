/**
 * Identitas organisasi pada kop surat. Satu-satunya tempat teks ini
 * didefinisikan — dipakai bersama oleh PDF (`pdf/surat-document.tsx`) dan
 * pratinjau di panel admin (`app/admin/(protected)/surat/surat-kertas.tsx`), jadi
 * keduanya tidak bisa berbeda.
 *
 * Nama, alamat, dan kontak disamakan dengan yang tampil di situs publik
 * (layout metadata, footer, dan halaman /kontak).
 */
export const KOP = {
  /** Baris nama lembaga, dicetak tebal dan berurutan. */
  nama: ["LEMBAGA INVESTIGASI DAN PENGAWASAN", "ASET NEGARA REPUBLIK INDONESIA"],
  singkatan: "LIPAN RI",
  legalitas: "SK Kemenkumham RI No. AHU-0010835.AH.01.07 Tahun 2017",
  alamat:
    "Gedung Yayasan Purna Bakti (YARNATI) Lt. 4 Ruang 407-408, Jl. Proklamasi No. 44, Pegangsaan, Menteng, Jakarta Pusat 10320",
  kontak: "Telp. 021-392-8018 · Email: dpn.lipanri@gmail.com · Website: www.lipan-ri.com",
  kota: "Jakarta",
  logoPath: "public/logo.png",
  logoUrl: "/logo.png",
} as const;
