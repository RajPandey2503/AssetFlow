"use client";

import React from "react";
import { CalendarRange } from "lucide-react";
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
import { createBookingAction } from "@/lib/bookings/actions";

type BookingDialogProps = {
  assets: { id: string; assetTag: string; name: string }[];
  employees: { id: string; name: string; email: string }[];
  defaultOpen?: boolean;
};

export function BookingDialog({ assets, employees, defaultOpen }: BookingDialogProps) {
  // Format current datetime for min date input (YYYY-MM-DDTHH:MM)
  const getMinDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger
        render={
          <Button variant="default" />
        }
      >
        <CalendarRange className="size-4" />
        Reserve Resource
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve Shared Resource</DialogTitle>
          <DialogDescription>
            Schedule a resource booking window. The system checks in real-time to prevent scheduling overlaps.
          </DialogDescription>
        </DialogHeader>
        
        <form action={createBookingAction} className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="booking-asset-select">
              Shared Resource *
            </label>
            <Select id="booking-asset-select" name="assetId" required defaultValue="">
              <option value="" disabled>Select shared asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  [{asset.assetTag}] {asset.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="booking-employee-select">
              Reserved For (Employee) *
            </label>
            <Select id="booking-employee-select" name="userId" required defaultValue="">
              <option value="" disabled>Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start DateTime */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="booking-start-time">
                Start Time *
              </label>
              <Input
                id="booking-start-time"
                name="startTime"
                type="datetime-local"
                min={getMinDateTimeString()}
                required
              />
            </div>

            {/* End DateTime */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="booking-end-time">
                End Time *
              </label>
              <Input
                id="booking-end-time"
                name="endTime"
                type="datetime-local"
                min={getMinDateTimeString()}
                required
              />
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3 mt-1">
            <input
              type="checkbox"
              id="booking-reminder"
              name="needReminder"
              defaultChecked={true}
              className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
            />
            <div className="space-y-0.5">
              <label htmlFor="booking-reminder" className="text-xs font-semibold text-slate-900 cursor-pointer">
                Email Reminder
              </label>
              <p className="text-[10px] text-muted-foreground">
                Dispatches a notification alert 15 minutes before slot commences.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText="Reserving resource...">
              Confirm Booking
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
