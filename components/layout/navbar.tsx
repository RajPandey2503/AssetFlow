"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, Bell, AlertTriangle, Calendar, Wrench } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
};

type NavbarProps = {
  user: {
    name: string;
    email: string;
    role: keyof typeof roleLabels;
  };
  notifications?: NotificationItem[];
};

export default function Navbar({ user, notifications = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAlertIcon = (type: string) => {
    if (type === "OVERDUE") return <AlertTriangle className="size-4 text-rose-600" />;
    if (type === "REMINDER") return <Calendar className="size-4 text-blue-600" />;
    return <Wrench className="size-4 text-amber-600" />;
  };

  const getAlertBg = (type: string) => {
    if (type === "OVERDUE") return "bg-rose-50 border-rose-100";
    if (type === "REMINDER") return "bg-blue-50 border-blue-100";
    return "bg-amber-50 border-amber-100";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 relative z-40 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>

      <div className="flex items-center gap-4">
        {/* Notification Center Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 relative transition-colors focus:outline-none"
            aria-label="Toggle notifications"
          >
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-slate-200 bg-white shadow-xl py-4 z-50">
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="size-3.5 text-slate-500" />
                  Notifications Center
                </span>
                {notifications.length > 0 && (
                  <Badge className="bg-slate-900 text-white text-[9px] font-mono">
                    {notifications.length} active
                  </Badge>
                )}
              </div>

              {/* Alerts List */}
              <div className="max-h-[300px] overflow-y-auto px-2 py-2 space-y-2 mt-1.5 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active notifications. All clear!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-3 rounded-lg border text-left flex gap-2.5 transition-colors bg-white",
                        getAlertBg(n.type)
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getAlertIcon(n.type)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">
                          {n.title}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-normal">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold">
                          {new Date(n.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile section */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none">
              {roleLabels[user.role]} · {user.email}
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {initials}
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="icon" className="size-9 text-slate-500 hover:text-slate-900 border-slate-200" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
