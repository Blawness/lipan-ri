export default function RootLoading() {
  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    </div>
  );
}
