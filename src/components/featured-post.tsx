import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

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
  categoryName,
  publishedAt,
}: FeaturedPostProps) {
  return (
    <Link href={`/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white min-h-[360px] flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent" />
        <div className="relative z-10">
          {categoryName && (
            <Badge className="mb-3 bg-blue-400/20 text-blue-200 hover:bg-blue-400/30 border-0">
              {categoryName}
            </Badge>
          )}
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline">
            {title}
          </h2>
          <p className="text-blue-200/80 line-clamp-2 mb-4">{excerpt}</p>
          {publishedAt && (
            <div className="flex items-center gap-1 text-sm text-blue-300">
              <Calendar className="h-3 w-3" />
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
