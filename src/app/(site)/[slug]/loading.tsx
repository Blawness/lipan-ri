import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-8 w-20 mb-6" />
      <Skeleton className="h-6 w-32 mb-3" />
      <Skeleton className="h-10 w-3/4 mb-4" />
      <Skeleton className="h-4 w-40 mb-8" />
      <Skeleton className="h-64 w-full rounded-lg mb-8" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
