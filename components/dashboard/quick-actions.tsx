import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-3">
        <Button>Register Asset</Button>
        <Button variant="secondary">Allocate Asset</Button>
        <Button variant="outline">Maintenance</Button>
        <Button variant="outline">Book Resource</Button>
      </div>
    </div>
  );
}