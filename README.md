# AssetFlow ERP 🚀

AssetFlow is an enterprise-grade Asset Management & Operations Resource Planning (ERP) platform. It provides complete visibility, booking schedulers, compliance audit tracks, maintenance ticketing boards, and real-time alerts.

---

## 🌟 Core Modules & Features

### 1. 📋 Asset Registration & Directory
* **Strong Inventory Controls**: Unique sequential asset tags (`AF-0001`, `AF-0002`...) are auto-generated.
* **Rich Metadata Support**: Trace category classifications, serial numbers, acquisition date, cost valuation, physical location, and shared resource status.
* **Attachments placeholder**: Supports mock image uploads and warranty/manual document references.
* **Search & Filter Shelf**: Instantly filter assets by category, status, condition, or query.

### 2. 🤝 Asset Allocation & Transfers
* **Prevent Double-Allocation**: Strong transactional actions prevent double assignment.
* **Transfer Approvals**: Handover request workflow to transfer assets between employees, with administrator approval triggers.
* **Return logs**: Handles expected return dates, actual returns, and automatic status updates.

### 3. 📅 Resource Booking & Calendar
* **Shared Scheduler**: Monthly calendar grid visualizing booking slots for shared assets.
* **Overlap Validation**: Multi-tenant booking validations block reservation overlaps.
* **Reminders**: One-click reminder notifications dispatch warnings for upcoming bookings.

### 4. 🔧 Maintenance Kanban Board
* **Kanban Board**: Track maintenance tickets through statuses (`PENDING` ➔ `APPROVED` ➔ `TECHNICIAN ASSIGNED` ➔ `IN PROGRESS` ➔ `RESOLVED`).
* **Auto Status Sync**: Automatically moves assets to `MAINTENANCE` during repairs, and reverts them to `AVAILABLE` on resolution.
* **Cost & Notes Tracking**: Tracks repair costs and resolution logs for audit trails.

### 5. 🔍 Compliance Audit Cycles
* **Scope Auditor Cycles**: Create scheduled audits assigning specific employees to verify list items.
* **Discrepancy Reporting**: Audit items marked as `MISSING` automatically transition the database status to `LOST`. Items marked as `DAMAGED` trigger conditions to `BROKEN` and log discrepancies.

### 6. 📊 Reports & Analytics
* **Recharts Panels**: Dynamic reports visualizing utilization charts, department summaries, repair trends, and weekly scheduling heatmaps.
* **CSV Exporter**: Expose formatted data grids to spreadsheet sheets.

### 7. 🔔 Notifications Center
* **Header Alerts Popover**: Notifications showing overdue returns, upcoming bookings, and maintenance requests.
* **Live Audit Trails**: Live database-driven timeline showing history actions (`AssetHistory`).

---

## 🚀 Premium Enterprise Enhancements

### 1. 🔄 Database Portability Switcher
Supports local lightweight SQLite and serverless-ready cloud PostgreSQL connections.
* **Runtime Driver Detection**: Instantiates appropriate connection adapters dynamically at runtime.
* **CLI Switcher Script**: Swaps provider and rebuilds Prisma types:
  ```bash
  node scripts/switch-db.js postgres  # Switch schema source to PostgreSQL
  node scripts/switch-db.js sqlite    # Revert schema source to SQLite
  ```

### 2. 📷 Barcode & QR Scanner Viewport
* Simulated WebRTC camera viewbox modal with scanner lasers.
* Integrates next to the **Serial Number** input inside forms.
* Integrated in **Audit Verifications** (pre-selects present status on successful matches).

### 3. 📄 Handover PDF Receipts
* Print handover receipt button on all allocation rows.
* Generates a styled handover voucher, T&C terms list, and signature sign-offs, launching browser print layouts.

### 4. 📍 Office Floorplan Pins
* Interactive SVG floor blueprint (Server room, Breakroom, Open workspaces, Conference Room Alpha, Executive Offices).
* Pins coordinates X/Y to database schemas and maps them inside detail sheets.

### 5. 💬 Slack Alert Webhooks
* Fires notifications to Slack channels on registration, repairs, or discrepancies.
* **Setup**: Add `SLACK_WEBHOOK_URL` to `.env`. Falls back to styled mock console grids in local environments.

---

## 🛠️ Tech Stack & Architecture

* **Core**: Next.js 16 (Turbopack) & React 19 (Server Actions)
* **Styling**: Tailwind CSS & Shadcn/Radix Primitives
* **Database & ORM**: Prisma ORM with SQLite (`dev.db`) or cloud PostgreSQL
* **Charts**: Recharts Vector Visualizations

---

## ⚙️ Getting Started & Local Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Sync
```bash
npx prisma db push
npx prisma generate
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.
