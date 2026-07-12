import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Reset password"
      description="Enter your account email and AssetFlow will prepare reset instructions."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
