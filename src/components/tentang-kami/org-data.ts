export type OrgVariant = "utama" | "divisi" | "staf";

export interface OrgMember {
  id: string;
  role: string;
  nama: string;
  variant: OrgVariant;
}

export interface Divisi {
  head: OrgMember;
  staf: OrgMember[];
}

export interface OrgStruktur {
  pembina: OrgMember;
  penasehat: OrgMember;
  ketua: OrgMember;
  stafKhusus: OrgMember[];
  sekjen: OrgMember;
  bendahara: OrgMember;
  sdm: OrgMember;
  divisi: Divisi[];
}

export const ORG: OrgStruktur = {
  pembina: { id: "pembina", role: "Dewan Pembina", nama: "Hengki Putra Juwita", variant: "utama" },
  penasehat: { id: "penasehat", role: "Dewan Penasehat/Kehormatan", nama: "Sri Hartono Sasongko", variant: "utama" },
  ketua: { id: "ketua", role: "Ketua", nama: "Harun Prayitno, S.E., S.H., M.H.", variant: "utama" },
  stafKhusus: [
    { id: "staf-khusus", role: "Staf Khusus Ketua", nama: "Wiryanto, S.T.", variant: "utama" },
    { id: "koordinator-keamanan", role: "Koordinator Keamanan", nama: "Mulkan Lessy Tussen", variant: "utama" },
  ],
  sekjen: { id: "sekjen", role: "Sekretaris Jenderal", nama: "Cahya Puspita Rini, S.E.", variant: "utama" },
  bendahara: { id: "bendahara", role: "Bendahara Umum", nama: "Velia Dwi Yulianti, S.E.", variant: "utama" },
  sdm: { id: "sdm", role: "SDM dan Umum", nama: "Ruswondo Awidjan, S.H.", variant: "utama" },
  divisi: [
    {
      head: { id: "div-hukum", role: "Divisi Bantuan Hukum & HAM", nama: "Annisa Novianty, S.H., M.H.", variant: "divisi" },
      staf: [
        { id: "hukum-1", role: "Staf Divisi", nama: "Adam Maulana Hafiz, S.H.", variant: "staf" },
        { id: "hukum-2", role: "Staf Divisi", nama: "Firdausi Aglis Akbar, S.H.", variant: "staf" },
      ],
    },
    {
      head: { id: "div-pengawasan", role: "Divisi Pengawasan", nama: "Najib Payudin", variant: "divisi" },
      staf: [
        { id: "pengawasan-1", role: "Staf Divisi", nama: "Ardi Erfindo Wael", variant: "staf" },
      ],
    },
    {
      head: { id: "div-media", role: "Divisi Media Infokom", nama: "Yandi Nurarifiandi, S.Sos", variant: "divisi" },
      staf: [
        { id: "media-1", role: "Staf Divisi", nama: "Yudha Hafiz, S.BNS.", variant: "staf" },
        { id: "media-2", role: "Staf Divisi", nama: "Ahmada Aliftano Nugroho, S.H.", variant: "staf" },
        { id: "media-3", role: "Staf Divisi", nama: "Muhammad Ihsan Naufal", variant: "staf" },
      ],
    },
    {
      head: { id: "div-investigasi", role: "Divisi Investigasi", nama: "Muhammad Faizal Amri", variant: "divisi" },
      staf: [],
    },
  ],
};
