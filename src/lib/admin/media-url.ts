/**
 * Bagian jalur dari sebuah URL unggahan — skema & host dibuang.
 *
 * Host berkas unggahan sudah pernah berpindah sekali (`*.r2.dev` →
 * `cdn.lipan-ri.com`) dan bisa berpindah lagi. Baris lama tetap menyimpan URL
 * dengan host lamanya, jadi mencocokkan URL secara utuh membuat satu objek R2
 * yang sama tampak seperti dua berkas berbeda. Yang stabil lintas perpindahan
 * host cuma key objeknya, dan key itu ada di jalur URL — jadi semua
 * pencocokan di berkas ini memakai jalur, bukan URL penuh.
 *
 * URL relatif (mis. `/logo.png` dari seed) dikembalikan apa adanya supaya
 * tetap bisa dibandingkan dengan kolom yang menyimpannya.
 */
export function jalurUnggahan(url: string): string {
  const m = /^https?:\/\/[^/]+(\/.*)$/.exec(url);
  return m ? m[1] : url;
}
