/**
 * Nama album pada tabel `media`.
 *
 * Dipisah dari `@/lib/media` karena file itu mengimpor klien database — modul
 * ini juga dipakai komponen klien (form unggah di /admin), jadi harus bebas
 * dari kode server.
 */

/**
 * Album bawaan `uploadImageAction` admin-kit: unggahan tanpa album eksplisit
 * jatuh ke sini. Dipakai galeri publik dan blok galeri di beranda.
 */
export const ALBUM_GALERI = "gallery";

/**
 * Album terpisah untuk dokumentasi Ketua Umum di /tentang-kami/profil-ketua,
 * supaya fotonya tidak ikut tampil dobel di /galeri.
 */
export const ALBUM_GALERI_KETUA = "galeri-ketua";

/** Album berkas surat, diisi dari form dokumen — bukan gambar galeri. */
export const ALBUM_DOKUMEN = "dokumen";

/**
 * Album gambar yang menempel pada satu konten, bukan koleksi galeri. Tanpa
 * penandaan ini semuanya jatuh ke ALBUM_GALERI — default `uploadImageAction` —
 * lalu ikut tampil di /galeri sebagai "foto kegiatan", padahal cuma gambar
 * utama berita, potret pengurus, atau banner.
 */
export const ALBUM_COVER = "cover";
export const ALBUM_PENGURUS = "pengurus";
export const ALBUM_BANNER = "banner";

/**
 * Album yang ikut tampil di galeri publik (/galeri dan blok galeri beranda).
 * `galeri-ketua` ikut walau punya halamannya sendiri — fotonya tetap foto
 * kegiatan lembaga, jadi tidak ada alasan menyembunyikannya dari galeri.
 */
export const ALBUM_GALERI_PUBLIK = [ALBUM_GALERI, ALBUM_GALERI_KETUA];
