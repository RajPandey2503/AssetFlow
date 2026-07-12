"use client";

import React from "react";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAuditCycleAction, verifyAuditItemAction } from "@/lib/audit/actions";

/* ==========================================
   DIALOG: Create Audit Cycle
   ========================================== */
type CreateCycleProps = {
  employees: { id: string; name: string; email: string }[];
};

export function CreateAuditCycleDialog({ employees }: CreateCycleProps) {
  const getMinDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="default" />
        }
      >
        <ClipboardCheck className="size-4" />
        Schedule Audit Cycle
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Audit Cycle</DialogTitle>
          <DialogDescription>
            Launches a new audit verification cycle. All currently registered assets will be scoped for review.
          </DialogDescription>
        </DialogHeader>
        
        <form action={createAuditCycleAction} className="space-y-4">
          {/* Cycle Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="audit-name">
              Audit Name / Title *
            </label>
            <Input
              id="audit-name"
              name="name"
              type="text"
              required
              placeholder="e.g. Q3 2026 Hardware Audit"
            />
          </div>

          {/* Auditor Assignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="audit-auditor">
              Assigned Auditor *
            </label>
            <Select id="audit-auditor" name="auditorId" required defaultValue="">
              <option value="" disabled>Select employee to perform audit</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="audit-duedate">
              Due Date *
            </label>
            <Input
              id="audit-duedate"
              name="dueDate"
              type="date"
              min={getMinDateString()}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Scheduling cycle...">
              Start Audit Scope
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================
   DIALOG: Verify Audit Item
   ========================================== */
type VerifyItemProps = {
  itemId: string;
  assetTag: string;
  assetName: string;
  trigger: React.ReactElement;
};

export function VerifyAuditItemDialog({ itemId, assetTag, assetName, trigger }: VerifyItemProps) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="size-5 text-indigo-600" />
            <DialogTitle>Verify Asset Presence</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Mark status for asset <strong className="font-mono text-slate-900">{assetTag}</strong> ({assetName}).
          </DialogDescription>
        </DialogHeader>
        
        <form action={verifyAuditItemAction} className="space-y-4">
          <input type="hidden" name="itemId" value={itemId} />

          {/* Verification Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="verify-status">
              Verification Status *
            </label>
            <Select id="verify-status" name="status" required defaultValue="VERIFIED">
              <option value="VERIFIED">Present & Verified (Good/Normal)</option>
              <option value="MISSING">Missing (Lost/Untraceable)</option>
              <option value="DAMAGED">Damaged (Broken/Poor condition)</option>
            </Select>
          </div>

          {/* Verification Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="verify-notes">
              Verification Notes / Comments
            </label>
            <Textarea
              id="verify-notes"
              name="notes"
              placeholder="e.g. Scanned barcodes match. Placed on rack 3B."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Logging verification...">
              Save Verification
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
