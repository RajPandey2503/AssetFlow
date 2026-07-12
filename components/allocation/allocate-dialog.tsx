"use client";

import React from "react";
import { Plus } from "lucide-react";
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
import { allocateAssetAction } from "@/lib/allocation/actions";

type AllocateDialogProps = {
  assets: { id: string; assetTag: string; name: string }[];
  employees: { id: string; name: string; email: string }[];
  defaultOpen?: boolean;
};

export function AllocateDialog({ assets, employees, defaultOpen }: AllocateDialogProps) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger
        render={
          <Button variant="default" />
        }
      >
        <Plus className="size-4" />
        Allocate Asset
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate Asset</DialogTitle>
          <DialogDescription>
            Assign an available asset to an employee and set an expected return date.
          </DialogDescription>
        </DialogHeader>
        
        <form action={allocateAssetAction} className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="allocate-asset-select">
              Select Asset *
            </label>
            <Select id="allocate-asset-select" name="assetId" required defaultValue="">
              <option value="" disabled>Select available asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  [{asset.assetTag}] {asset.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="allocate-employee-select">
              Assign To Employee *
            </label>
            <Select id="allocate-employee-select" name="userId" required defaultValue="">
              <option value="" disabled>Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </Select>
          </div>

          {/* Expected Return Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="allocate-return-date">
              Expected Return Date
            </label>
            <Input
              id="allocate-return-date"
              name="returnDate"
              type="date"
            />
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Allocating asset...">
              Confirm Allocation
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
