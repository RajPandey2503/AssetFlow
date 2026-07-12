import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Mock server-only in require cache before dynamic imports are evaluated
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
    paths: [],
    children: [],
  } as any;
} catch (e) {
  // If not found, ignore
}

// Mock next/headers
try {
  const nextHeadersPath = require.resolve("next/headers");
  require.cache[nextHeadersPath] = {
    id: nextHeadersPath,
    filename: nextHeadersPath,
    loaded: true,
    exports: {
      cookies: async () => ({
        get: () => undefined,
        set: () => {},
      }),
    },
    paths: [],
    children: [],
  } as any;
} catch (e) {
  // If not found, ignore
}

// Mock next/navigation
try {
  const nextNavPath = require.resolve("next/navigation");
  require.cache[nextNavPath] = {
    id: nextNavPath,
    filename: nextNavPath,
    loaded: true,
    exports: {
      redirect: (url: string) => {
        const err = new Error("NEXT_REDIRECT");
        (err as any).digest = `NEXT_REDIRECT;307;${url};`;
        throw err;
      },
    },
    paths: [],
    children: [],
  } as any;
} catch (e) {
  // If not found, ignore
}

// Helper to check if an error is a Next.js redirect
function isRedirect(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

async function runTests() {
  // Set up mock environment parameters
  process.env.MOCK_USER_ROLE = "ADMIN";
  process.env.DATABASE_URL = "file:./dev.db";

  // Now dynamically import the modules
  const { createAssetAction, updateAssetAction } = await import("../lib/assets/actions");
  const { verifyAuditItemAction } = await import("../lib/audit/actions");
  const { prisma } = await import("../lib/prisma");

  console.log("=== STARTING PROGRAMMATIC VALIDATION OF ERP UPGRADES ===\n");

  // Clean up any leftovers from previous aborted test runs
  await prisma.auditItem.deleteMany({
    where: { asset: { serialNumber: "SN-QA-10029" } }
  });
  await prisma.auditCycle.deleteMany({
    where: { name: "Q3 IT Assets Audit" }
  });
  await prisma.assetHistory.deleteMany({
    where: { asset: { serialNumber: "SN-QA-10029" } }
  });
  await prisma.asset.deleteMany({
    where: { serialNumber: "SN-QA-10029" }
  });

  // Fetch or create a category
  let category = await prisma.assetCategory.findFirst();
  if (!category) {
    category = await prisma.assetCategory.create({
      data: { name: "IT Hardware" },
    });
  }

  // ==========================================
  // TEST 1: Register Asset with Coordinates
  // ==========================================
  console.log("⏳ Test 1: Registering asset with floorplan coordinates...");
  
  const createForm = new FormData();
  createForm.append("name", "Test QA ThinkPad");
  createForm.append("categoryId", category.id);
  createForm.append("serialNumber", "SN-QA-10029");
  createForm.append("acquisitionDate", "2026-07-12");
  createForm.append("acquisitionCost", "1250.00");
  createForm.append("condition", "NEW");
  createForm.append("location", "Conference Room Alpha");
  createForm.append("sharedResource", "true");
  createForm.append("status", "AVAILABLE");
  createForm.append("locationX", "32.4");
  createForm.append("locationY", "75.8");

  let createdAssetId = "";
  try {
    await createAssetAction(createForm);
    console.error("❌ Test 1 Failed: Expected redirect error, but action returned normally.");
    process.exit(1);
  } catch (error) {
    if (!isRedirect(error)) {
      console.error("❌ Test 1 Failed with error:", error);
      process.exit(1);
    }
    
    // Retrieve the asset from db
    const asset = await prisma.asset.findFirst({
      where: { serialNumber: "SN-QA-10029" },
    });
    
    if (!asset || asset.locationX !== 32.4 || asset.locationY !== 75.8) {
      console.error("❌ Test 1 Failed: Asset coordinates not stored correctly:", asset);
      process.exit(1);
    }
    createdAssetId = asset.id;
    console.log(`✅ Test 1 Passed: Asset registered with coordinates (X: ${asset.locationX}, Y: ${asset.locationY})\n`);
  }

  // ==========================================
  // TEST 2: Update Asset & Track coordinates
  // ==========================================
  console.log("⏳ Test 2: Updating asset coordinates...");
  
  const updateForm = new FormData();
  updateForm.append("id", createdAssetId);
  updateForm.append("name", "Test QA ThinkPad Updated");
  updateForm.append("categoryId", category.id);
  updateForm.append("serialNumber", "SN-QA-10029");
  updateForm.append("acquisitionDate", "2026-07-12");
  updateForm.append("acquisitionCost", "1250.00");
  updateForm.append("condition", "NEW");
  updateForm.append("location", "Conference Room Alpha");
  updateForm.append("sharedResource", "true");
  updateForm.append("status", "AVAILABLE");
  updateForm.append("locationX", "50.0");
  updateForm.append("locationY", "50.0");

  try {
    await updateAssetAction(updateForm);
    console.error("❌ Test 2 Failed: Expected redirect error, but action returned normally.");
    process.exit(1);
  } catch (error) {
    if (!isRedirect(error)) {
      console.error("❌ Test 2 Failed with error:", error);
      process.exit(1);
    }
    
    const asset = await prisma.asset.findUnique({
      where: { id: createdAssetId },
    });
    
    if (!asset || asset.locationX !== 50.0 || asset.locationY !== 50.0) {
      console.error("❌ Test 2 Failed: Coordinates not updated correctly:", asset);
      process.exit(1);
    }
    
    // Check history tracking
    const history = await prisma.assetHistory.findFirst({
      where: { assetId: createdAssetId, details: { contains: "Floorplan coordinates changed" } },
    });
    if (!history) {
      console.error("❌ Test 2 Failed: AssetHistory did not log the floorplan coordinates change.");
      process.exit(1);
    }
    console.log("✅ Test 2 Passed: Coordinates updated and logged to history trail.\n");
  }

  // ==========================================
  // TEST 3: Audit Discrepancy & Auto status sync
  // ==========================================
  console.log("⏳ Test 3: Running compliance audit verification and discrepancy alerts...");

  // Setup an audit cycle and item
  const mockAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!mockAdmin) {
    console.error("❌ Test 3 Setup Failed: Admin user not found.");
    process.exit(1);
  }

  const cycle = await prisma.auditCycle.create({
    data: {
      name: "Q3 IT Assets Audit",
      status: "IN_PROGRESS",
      auditor: { connect: { id: mockAdmin.id } },
      createdBy: { connect: { id: mockAdmin.id } },
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const auditItem = await prisma.auditItem.create({
    data: {
      auditCycleId: cycle.id,
      assetId: createdAssetId,
      verified: false,
      status: "PENDING",
    },
  });

  // Verify item as MISSING (simulating discrepancy report)
  const auditForm = new FormData();
  auditForm.append("itemId", auditItem.id);
  auditForm.append("status", "MISSING");
  auditForm.append("notes", "Scanned serial mismatch, item is not present on desk.");

  try {
    await verifyAuditItemAction(auditForm);
    console.error("❌ Test 3 Failed: Expected redirect, but action returned normally.");
    process.exit(1);
  } catch (error) {
    if (!isRedirect(error)) {
      console.error("❌ Test 3 Failed with error:", error);
      process.exit(1);
    }

    // Check if asset status is updated to LOST (Auto discrepancy sync)
    const asset = await prisma.asset.findUnique({
      where: { id: createdAssetId },
    });
    if (!asset || asset.status !== "LOST") {
      console.error("❌ Test 3 Failed: Asset status not set to LOST after missing report.");
      process.exit(1);
    }

    // Verify Slack alerts log output occurred (fallback Mock logged)
    const auditLog = await prisma.assetHistory.findFirst({
      where: { assetId: createdAssetId, action: "AUDIT_DISCREPANCY_MISSING" },
    });
    if (!auditLog) {
      console.error("❌ Test 3 Failed: Discrepancy history log not created.");
      process.exit(1);
    }

    console.log("✅ Test 3 Passed: Missing audit item auto-updated asset status to LOST and logged audit details.\n");
  }

  // Cleanup
  console.log("🧹 Cleaning up database validation entries...");
  await prisma.auditItem.deleteMany({ where: { auditCycleId: cycle.id } });
  await prisma.auditCycle.delete({ where: { id: cycle.id } });
  await prisma.assetHistory.deleteMany({ where: { assetId: createdAssetId } });
  await prisma.asset.delete({ where: { id: createdAssetId } });

  console.log("🎉 ALL PROGRAMMATIC VALIDATIONS PASSED SUCCESSFULLY! Ready to use at its best.");
  process.exit(0);
}

runTests().catch((e) => {
  console.error("❌ Unexpected validation framework error:", e);
  process.exit(1);
});
