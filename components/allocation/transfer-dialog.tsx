"use client";

import React from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { createTransferRequestAction } from "@/lib/allocation/actions";

type TransferDialogProps = {
  asset: {
    id: string;
    assetTag: string;
    name: string;
    currentUser: string;
  };
  employees: { id: string; name: string; email: string }[];
  trigger: React.ReactElement;
};

export function TransferDialog({ asset, employees, trigger }: TransferDialogProps) {
  // Filter out the current user to prevent transferring to the same person
  const transferEmployees = employees.filter(
    (emp) => emp.name !== asset.currentUser
  );

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Asset Transfer</DialogTitle>
          <DialogDescription>
            Initiate a transfer request to reassign this asset from the current owner to a new employee.
          </DialogDescription>
        </DialogHeader>
        
        <form action={createTransferRequestAction} className="space-y-4">
          <input type="hidden" name="assetId" value={asset.id} />
          
          {/* Asset Info Readonly */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold">Asset Tag:</span>
              <span className="font-mono font-bold text-slate-800">{asset.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Asset Name:</span>
              <span className="font-medium text-slate-800">{asset.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Current Assignee:</span>
              <span className="font-semibold text-slate-900">{asset.currentUser}</span>
            </div>
          </div>

          {/* Target Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="transfer-employee-select">
              Transfer To Employee *
            </label>
            <Select id="transfer-employee-select" name="toUserId" required defaultValue="">
              <option value="" disabled>Select target employee</option>
              {transferEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Creating request...">
              Submit Transfer Request
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
