/**
 * Layar Galeri admin-kit tidak punya field keterangan: `uploadImageAction`
 * selalu mengisi `altText` dengan nama berkas aslinya. Menampilkan itu apa
 * adanya sebagai keterangan foto justru lebih buruk daripada tidak ada
 * keterangan sama sekali — pembaca cuma melihat "WhatsApp Image 2026-09-01 at
 * 20.31.19.jpeg".
 *
 * Keterangan sungguhan hanya bisa masuk lewat skrip, jadi nilai yang masih
 * berupa nama berkas disaring di sini.
 */
const NAMA_BERKAS = /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i;

/**
 * Keterangan foto yang layak tampil, atau `null` kalau yang tersimpan cuma
 * nama berkas bawaan unggahan.
 */
export function keteranganFoto(altText: string | null | undefined): string | null {
  const teks = altText?.trim();
  if (!teks || NAMA_BERKAS.test(teks)) return null;
  return teks;
}
