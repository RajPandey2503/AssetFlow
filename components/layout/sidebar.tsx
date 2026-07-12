export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white p-6">
      <h1 className="text-2xl font-bold">AssetFlow</h1>

      <nav className="mt-8 space-y-3">
        <p>Dashboard</p>
        <p>Assets</p>
        <p>Departments</p>
        <p>Employees</p>
        <p>Categories</p>
        <p>Allocation</p>
        <p>Maintenance</p>
        <p>Bookings</p>
        <p>Reports</p>
      </nav>
    </aside>
  );
}