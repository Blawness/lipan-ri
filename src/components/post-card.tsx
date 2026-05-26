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
      <Card className="h-full overflow-hidden border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-blue-300 text-4xl font-bold">LR</div>
          )}
        </div>
        <CardContent className="p-4">
          {categoryName && (
            <Badge variant="secondary" className="mb-2 text-xs">
              {categoryName}
            </Badge>
          )}
          <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
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
