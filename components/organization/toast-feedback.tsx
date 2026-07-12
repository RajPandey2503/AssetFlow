"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function ToastFeedback() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get("toast");
  const type = searchParams.get("toastType") === "error" ? "error" : "success";

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      params.delete("toastType");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [message, pathname, router, searchParams]);

  if (!message) {
    return null;
  }

  const Icon = type === "error" ? XCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg",
        type === "error" && "border-destructive/30 text-destructive",
      )}
    >
      <Icon className="mt-0.5 size-4" />
      <p>{message}</p>
    </div>
  );
}
