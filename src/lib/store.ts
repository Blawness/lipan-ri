import { create } from "zustand";

type DokumenCreateStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useDokumenCreateStore = create<DokumenCreateStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
