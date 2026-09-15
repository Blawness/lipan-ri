"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Images } from "lucide-react";
import { ImageUpload } from "@blawness/admin-kit/components";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import { ALBUM_GALERI, ALBUM_GALERI_KETUA } from "@/lib/albums";

/**
 * Kotak unggah galeri yang bisa menentukan album tujuan.
 *
 * `GalleryUploader` bawaan admin-kit tidak mengirim field `album` sama sekali,
 * jadi semua unggahan lewat sana selalu masuk album bawaan — album seperti
 * `galeri-ketua` mustahil diisi dari panel admin. Komponen ini menyisipkan
 * field itu sebelum meneruskan ke server action yang sama.
 */
export function AlbumUploader({
  albums,
  album: albumAwal,
}: {
  albums: string[];
  /** Album yang sedang disaring; jadi tujuan unggah bila ada. */
  album?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const datalistId = useId();
  // Diisi nilai sungguhan, bukan sekadar placeholder: field kosong dengan
  // tulisan abu-abu tidak bisa dibedakan dari "belum ke-set apa pun", dan
  // pembaca jadi tidak tahu foto akan mendarat di album mana.
  const [album, setAlbum] = useState(albumAwal?.trim() || ALBUM_GALERI);

  async function upload(formData: FormData) {
    const tujuan = album.trim();
    // Dikosongkan manual berarti ikut default server action, yaitu ALBUM_GALERI.
    if (tujuan) formData.set("album", tujuan);
    return uploadImageAction(formData);
  }

  return (
    <div className="max-w-xl rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Images className="h-4 w-4 text-brand-600" />
        <p className="text-sm font-semibold text-navy-900">
          Tambah gambar ke galeri
        </p>
      </div>

      <div className="mb-4 space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-navy-800">
          Album tujuan
        </label>
        <input
          id={inputId}
          list={datalistId}
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder={ALBUM_GALERI}
          className="h-10 w-full rounded-lg border border-navy-200 bg-white px-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <datalist id={datalistId}>
          {albums.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Foto akan masuk album <code>{album.trim() || ALBUM_GALERI}</code>.
          Album <code>{ALBUM_GALERI}</code> tampil di halaman Galeri;{" "}
          <code>{ALBUM_GALERI_KETUA}</code> tampil di Profil Ketua. Menyaring
          daftar di bawah ikut mengubah tujuan ini.
        </p>
      </div>

      <ImageUpload uploadAction={upload} onChange={() => router.refresh()} />
    </div>
  );
}
