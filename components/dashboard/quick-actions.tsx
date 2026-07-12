import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-850">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/assets?new=true" className="w-full">
          <Button className="w-full cursor-pointer">Register Asset</Button>
        </Link>
        <Link href="/allocation?new=true" className="w-full">
          <Button variant="secondary" className="w-full cursor-pointer">Allocate Asset</Button>
        </Link>
        <Link href="/maintenance?new=true" className="w-full">
          <Button variant="outline" className="w-full cursor-pointer">Maintenance</Button>
        </Link>
        <Link href="/bookings?new=true" className="w-full">
          <Button variant="outline" className="w-full cursor-pointer">Book Resource</Button>
        </Link>
      </div>
    </div>
  );
}