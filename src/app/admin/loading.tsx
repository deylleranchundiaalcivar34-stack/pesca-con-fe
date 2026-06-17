export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-48 animate-pulse rounded-md bg-white" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded-md bg-white" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-white" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-border bg-white" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />
        <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />
      </div>
    </div>
  );
}
