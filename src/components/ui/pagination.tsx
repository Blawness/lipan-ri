import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  basePath,
  scrollTo,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  scrollTo?: string;
}) {
  if (totalPages <= 1) return null;

  const hash = scrollTo ? `#${scrollTo}` : "";

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={`${basePath}?page=${page - 1}${hash}`}
          className="flex items-center justify-center h-9 w-9 rounded-md text-sm text-navy-600 hover:bg-navy-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="h-9 w-9 flex items-center justify-center text-sm text-navy-400">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={`${basePath}?page=${p}${hash}`}
            className={`flex items-center justify-center h-9 min-w-[36px] rounded-md text-sm transition-colors ${
              p === page
                ? "bg-navy-900 text-white font-medium"
                : "text-navy-600 hover:bg-navy-100"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link
          href={`${basePath}?page=${page + 1}${hash}`}
          className="flex items-center justify-center h-9 w-9 rounded-md text-sm text-navy-600 hover:bg-navy-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
