"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import { roleLabels } from "@/lib/auth/permissions";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
};

type DashboardShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: keyof typeof roleLabels;
  };
  notifications: NotificationItem[];
};

export default function DashboardShell({
  children,
  user,
  notifications,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize responsive sidebar state based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Init on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {/* Collapsible Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Navbar
          user={user}
          notifications={notifications}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden cursor-pointer"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
