import { PublicShell } from "@/components/layout/contenedor-publico";

export default function AccountLoading() {
  return (
    <PublicShell>
      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-9 w-44 animate-pulse rounded-md bg-secondary" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-4">
              <div className="h-14 animate-pulse rounded-md bg-secondary" />
              <div className="h-px bg-border" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-md bg-secondary" />
              ))}
            </aside>
            <section className="space-y-4">
              <div className="h-8 w-56 animate-pulse rounded-md bg-secondary" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg border border-border bg-secondary"
                />
              ))}
            </section>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
