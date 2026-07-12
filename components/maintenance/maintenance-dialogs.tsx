"use client";

import React from "react";
import { Wrench } from "lucide-react";
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
import {
  requestMaintenanceAction,
  assignTechnicianAction,
  resolveMaintenanceAction,
} from "@/lib/maintenance/actions";

/* ==========================================
   DIALIG: Request Maintenance
   ========================================== */
type RequestProps = {
  assets: { id: string; assetTag: string; name: string }[];
  defaultOpen?: boolean;
};

export function RequestMaintenanceDialog({ assets, defaultOpen }: RequestProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger
        render={
          <Button variant="default" />
        }
      >
        <Wrench className="size-4" />
        Request Maintenance
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Maintenance</DialogTitle>
          <DialogDescription>
            Report an issue or request routine service for an enterprise asset.
          </DialogDescription>
        </DialogHeader>
        
        <form action={requestMaintenanceAction} className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="req-asset-select">
              Select Asset *
            </label>
            <Select id="req-asset-select" name="assetId" required defaultValue="">
              <option value="" disabled>Select asset needing service</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  [{asset.assetTag}] {asset.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="req-description">
              Problem Description *
            </label>
            <Textarea
              id="req-description"
              name="description"
              required
              placeholder="e.g. Screen flickering on startup, battery draining in under an hour."
              rows={4}
            />
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Registering ticket...">
              Submit Ticket
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================
   DIALIG: Assign Technician
   ========================================== */
type AssignProps = {
  ticketId: string;
  technicians: { id: string; name: string; email: string }[];
  trigger: React.ReactElement;
};

export function AssignTechnicianDialog({ ticketId, technicians, trigger }: AssignProps) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Assign an employee or specialized technician to resolve this ticket.
          </DialogDescription>
        </DialogHeader>
        
        <form action={assignTechnicianAction} className="space-y-4">
          <input type="hidden" name="id" value={ticketId} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="assign-tech-select">
              Select Technician *
            </label>
            <Select id="assign-tech-select" name="technicianId" required defaultValue="">
              <option value="" disabled>Select technician</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Assigning technician...">
              Confirm Assignment
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ==========================================
   DIALIG: Resolve Maintenance
   ========================================== */
type ResolveProps = {
  ticketId: string;
  trigger: React.ReactElement;
};

export function ResolveMaintenanceDialog({ ticketId, trigger }: ResolveProps) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Maintenance Ticket</DialogTitle>
          <DialogDescription>
            Input final repair details and costs to close this ticket and return the asset to service.
          </DialogDescription>
        </DialogHeader>
        
        <form action={resolveMaintenanceAction} className="space-y-4">
          <input type="hidden" name="id" value={ticketId} />
          
          {/* Repair Cost */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="resolve-cost">
              Repair Cost ($)
            </label>
            <Input
              id="resolve-cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00 (leave blank if no cost)"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="resolve-notes">
              Resolution Notes
            </label>
            <Textarea
              id="resolve-notes"
              name="notes"
              placeholder="e.g. Replaced display panel. Verified output is clean."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Resolving ticket...">
              Complete & Resolve
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
