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
