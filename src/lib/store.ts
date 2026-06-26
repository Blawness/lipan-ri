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
