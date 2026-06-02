import { StatCounter } from "./stat-counter";

export function Stats({
  postCount,
  years,
}: {
  postCount: number;
  years: number;
}) {
  return (
    <section className="border-y border-navy-100 bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={years} suffix=" Thn" label="Sejak 2017" />
          <StatCounter value={postCount} suffix="+" label="Publikasi" />
          <div className="text-center">
            <div className="font-heading text-3xl md:text-4xl font-extrabold text-navy-900">
              Resmi
            </div>
            <div className="mt-1 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              Terdaftar Kemenkumham
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-3xl md:text-4xl font-extrabold text-navy-900">
              NKRI
            </div>
            <div className="mt-1 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              Cakupan Nasional
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
