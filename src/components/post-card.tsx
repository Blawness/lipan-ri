import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
}

export function PostCard({
  title,
  slug,
  excerpt,
  featuredImage,
  categoryName,
  publishedAt,
}: PostCardProps) {
  return (
    <Link href={`/${slug}`} className="group">
      <Card className="h-full overflow-hidden border-navy-100 hover:border-brand-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 pt-0">
        <div className="relative aspect-video overflow-hidden">
          {featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL gambar eksternal (R2), tanpa next/image
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950">
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />
              <span className="font-heading text-3xl font-extrabold tracking-tight">
                <span className="text-gold-300">L</span>
                <span className="text-white">R</span>
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-gold-400" />
            </div>
          )}
          {categoryName && (
            <Badge className="absolute top-3 left-3 bg-brand-500 text-white border-0 text-[10px] uppercase tracking-wide shadow-sm hover:bg-brand-600">
              {categoryName}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-heading font-bold text-sm leading-snug mb-2 line-clamp-2 text-navy-900 group-hover:text-brand-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {excerpt}
          </p>
          {publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(publishedAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
