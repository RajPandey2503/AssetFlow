import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Create employee account"
      description="Join AssetFlow with Employee access. An admin can promote roles later."
    >
      <SignupForm />
    </AuthShell>
  );
}
