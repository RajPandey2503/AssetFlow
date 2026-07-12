import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[1fr_440px]">
        <section className="flex flex-col justify-between px-6 py-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950">
              AF
            </div>
            <div>
              <p className="text-lg font-semibold">AssetFlow</p>
              <p className="text-xs text-slate-400">Enterprise Asset ERP</p>
            </div>
          </div>

          <div className="max-w-2xl py-16">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">
              Resource control center
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Govern every asset, allocation, and booking from one operational workspace.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              AssetFlow gives teams a secure foundation for managing assets,
              resources, maintenance, audits, reports, and notifications.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Role-based access
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Audit-ready history
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              Secure sessions
            </div>
          </div>
        </section>

        <section className="flex items-center bg-background px-6 py-10 text-foreground lg:px-8">
          <div className="w-full rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
