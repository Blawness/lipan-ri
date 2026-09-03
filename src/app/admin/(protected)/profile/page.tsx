// Sidebar admin-kit selalu menautkan "Profil" ke /admin/profile, jadi rute ini
// harus ada — tanpa ini tautannya 404 (dan prefetch RSC-nya bikin error di
// console tiap kali panel admin dibuka).
export { default } from "@blawness/admin-kit/screens/profile";

export const dynamic = "force-dynamic";
