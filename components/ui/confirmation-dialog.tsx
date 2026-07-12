"use client";

import type { ReactElement } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/auth/submit-button";

type ConfirmationDialogProps = {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  trigger: ReactElement;
  submitLabel?: string;
};

export function ConfirmationDialog({
  title,
  description,
  action,
  hiddenFields,
  trigger,
  submitLabel = "Confirm",
}: ConfirmationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={action}>
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <DialogFooter>
            <SubmitButton pendingText="Saving">{submitLabel}</SubmitButton>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
