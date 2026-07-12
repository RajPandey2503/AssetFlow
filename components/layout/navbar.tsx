import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/auth/permissions";

type NavbarProps = {
  user: {
    name: string;
    email: string;
    role: keyof typeof roleLabels;
  };
};

export default function Navbar({ user }: NavbarProps) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {roleLabels[user.role]} · {user.email}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {initials}
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="icon" aria-label="Sign out">
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  );
}
