import { redirect } from "next/navigation";

type ToastType = "success" | "error";

export function redirectWithToast(tab: string, message: string, type: ToastType = "success") {
  const params = new URLSearchParams({
    tab,
    toast: message,
    toastType: type,
  });

  redirect(`/organization?${params.toString()}`);
}
