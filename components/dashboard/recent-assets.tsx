import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const assets = [
  {
    tag: "AF-001",
    name: "Dell Latitude 7440",
    category: "Laptop",
    status: "Allocated",
  },
  {
    tag: "AF-002",
    name: "Canon Printer",
    category: "Printer",
    status: "Available",
  },
  {
    tag: "AF-003",
    name: "Projector",
    category: "Electronics",
    status: "Maintenance",
  },
];

export default function RecentAssets() {
  return (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Recent Assets</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.tag}>
              <TableCell>{asset.tag}</TableCell>
              <TableCell>{asset.name}</TableCell>
              <TableCell>{asset.category}</TableCell>
              <TableCell>
                <Badge>{asset.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}