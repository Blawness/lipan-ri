import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-blue-900 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Halaman tidak ditemukan
      </p>
      <Button render={<Link href="/">Kembali ke Beranda</Link>} />
    </div>
  );
}
