import { Badge } from "@/components/ui/badge";

const activities = [
  "Laptop AF-001 assigned to Raj",
  "Printer AF-002 returned",
  "Maintenance request approved",
  "Meeting Room booked",
];

export default function ActivityFeed() {
  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>

      <div className="space-y-3">
        {activities.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-sm">{item}</span>
            <Badge variant="secondary">New</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}