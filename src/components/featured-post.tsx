import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { SafeImage } from "@/components/safe-image";

interface FeaturedPostProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
}

export function FeaturedPost({
  title,
  slug,
  excerpt,
  featuredImage,
  categoryName,
  publishedAt,
}: FeaturedPostProps) {
  return (
    <Link href={`/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-navy-100 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white min-h-[380px] flex flex-col justify-end p-8">
        {featuredImage ? (
          <SafeImage
            src={featuredImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/55 to-navy-950/10" />
        <span className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-brand-500 to-gold-400" />
        <div className="relative z-10">
          {categoryName && (
            <Badge className="mb-3 bg-brand-500 text-white hover:bg-brand-600 border-0 uppercase tracking-wide text-[11px]">
              {categoryName}
            </Badge>
          )}
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold leading-tight mb-3 group-hover:text-gold-200 transition-colors">
            {title}
          </h2>
          <p className="text-navy-100/85 line-clamp-2 mb-4 max-w-2xl">{excerpt}</p>
          {publishedAt && (
            <div className="flex items-center gap-1.5 text-sm text-navy-200">
              <Calendar className="h-3.5 w-3.5 text-gold-300" />
              {new Date(publishedAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
