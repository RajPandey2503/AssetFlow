import { redirect } from "next/navigation";

export default function DepartmentsPage() {
  redirect("/organization?tab=departments");
}
