/**
 * Konten & jadwal tayang ucapan HUT RI.
 *
 * Tahun depan cukup ubah konstanta di file ini + ganti gambar di
 * `public/`. Section dan modal-nya otomatis ikut, dan otomatis hilang
 * sendiri begitu lewat 31 Agustus.
 */

export const HUT_RI = {
  ke: 81,
  /**
   * Pop-up ucapan saat halaman beranda dibuka. Section di beranda tetap
   * tampil selama periode Agustus; ini khusus modal-nya saja.
   * Set `true` untuk menyalakannya lagi.
   */
  tampilkanModal: false,
  tahun: 2026,
  tema: "Indonesia Berdaulat, Adil, dan Makmur",
  gambar: "/hut-ri-81-lipanri.jpeg",
  gambarAlt:
    "Ucapan Dirgahayu Republik Indonesia ke-81 dari Harun Prayitno, Ketua Umum LIPAN RI",
  ketua: "Harun Prayitno, S.E., S.H., M.H.",
  jabatan: "Ketua Umum LIPAN RI",
  /** Paragraf naskah ucapan. Dirender berurutan di section homepage. */
  naskah: [
    "Delapan puluh satu tahun lalu, kemerdekaan ini diraih dengan pengorbanan yang tak ternilai. Hari ini, tugas kita bukan lagi merebutnya, melainkan menjaganya — memastikan setiap jengkal tanah dan setiap aset negara benar-benar dikelola untuk sebesar-besarnya kemakmuran rakyat.",
    "Bagi LIPAN RI, kedaulatan bukan sekadar kata dalam pidato. Kedaulatan berarti seorang petani tidak kehilangan tanahnya karena kalah dokumen, dan aset milik negara tidak berpindah tangan dalam diam. Di situlah kami menempatkan diri: mengawal, mengawasi, dan mengadvokasi keadilan agraria bagi masyarakat di seluruh wilayah NKRI.",
    "Atas nama seluruh jajaran pengurus dan anggota Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia, saya mengucapkan Dirgahayu Republik Indonesia ke-81. Semoga Indonesia semakin berdaulat, adil, dan makmur.",
  ],
} as const;

/**
 * Periode tayang: 1–31 Agustus, dihitung pada waktu Indonesia Barat
 * (server Vercel berjalan di UTC, jadi tanggalnya tidak boleh diambil
 * langsung dari `getMonth()`).
 */
export function isPeriodeHutRi(now: Date = new Date()): boolean {
  const bulan = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "numeric",
  }).format(now);

  return bulan === "8";
}
