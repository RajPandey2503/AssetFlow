import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import { requireAuth } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={user} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
