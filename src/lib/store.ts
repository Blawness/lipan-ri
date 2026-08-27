import { create } from "zustand";

type DokumenCreateStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useDokumenCreateStore = create<DokumenCreateStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

type QrPreviewStore = {
  slug: string | null;
  number: string | null;
  title: string | null;
  open: (slug: string, number: string, title: string) => void;
  close: () => void;
};

export const useQrPreviewStore = create<QrPreviewStore>((set) => ({
  slug: null,
  number: null,
  title: null,
  open: (slug, number, title) => set({ slug, number, title }),
  close: () => set({ slug: null, number: null, title: null }),
}));

type PengurusQrPreviewStore = {
  slug: string | null;
  nama: string | null;
  jabatan: string | null;
  open: (slug: string, nama: string, jabatan: string) => void;
  close: () => void;
};

export const usePengurusQrPreviewStore = create<PengurusQrPreviewStore>((set) => ({
  slug: null,
  nama: null,
  jabatan: null,
  open: (slug, nama, jabatan) => set({ slug, nama, jabatan }),
  close: () => set({ slug: null, nama: null, jabatan: null }),
}));

type DokumenEditStore = {
  id: number | null;
  open: (id: number) => void;
  close: () => void;
};

export const useDokumenEditStore = create<DokumenEditStore>((set) => ({
  id: null,
  open: (id) => set({ id }),
  close: () => set({ id: null }),
}));
