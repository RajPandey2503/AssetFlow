"use client";

import React, { useState, useEffect } from "react";
import { Scan, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ScannerDialogProps = {
  trigger: React.ReactElement;
  onScan: (value: string) => void;
  title?: string;
  description?: string;
  placeholderPrefix?: string;
};

export function ScannerDialog({
  trigger,
  onScan,
  title = "Scan QR / Barcode",
  description = "Align the barcode or QR code inside the viewfinder to scan automatically.",
  placeholderPrefix = "AF-",
}: ScannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  useEffect(() => {
    if (open && scanning) {
      // Auto-simulate scan after 2.2 seconds of searching
      const timer = setTimeout(() => {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const simulatedValue = `${placeholderPrefix}${randomDigits}`;
        setScanning(false);
        setScannedValue(simulatedValue);
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [open, scanning, placeholderPrefix]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setScanning(true);
      setScannedValue(null);
    }
  };

  const handleConfirm = () => {
    if (scannedValue) {
      onScan(scannedValue);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Scan className="size-5 text-indigo-600 animate-pulse" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {/* Mock Camera Viewfinder View */}
          <div className="relative w-full aspect-video rounded-xl border border-slate-200 bg-slate-950 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Viewfinder Target corner borders */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500 rounded-tl-md" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500 rounded-tr-md" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500 rounded-bl-md" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500 rounded-br-md" />

            {/* Viewfinder scanner laser animation */}
            {scanning && (
              <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[bounce_2s_infinite]" />
            )}

            {scanning ? (
              <div className="flex flex-col items-center space-y-2 text-slate-450">
                <Loader2 className="size-8 text-indigo-400 animate-spin" />
                <span className="text-xs font-semibold font-mono tracking-wider animate-pulse text-indigo-200">
                  AUTO-SEARCHING VIEWPORT...
                </span>
              </div>
            ) : scannedValue ? (
              <div className="flex flex-col items-center space-y-2 text-emerald-400 text-center px-4">
                <div className="size-10 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <Check className="size-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Barcode Decoded</span>
                <span className="text-lg font-mono font-bold text-white bg-slate-900 border border-slate-800 rounded px-3 py-1 mt-1">
                  {scannedValue}
                </span>
              </div>
            ) : null}
          </div>

          {/* Quick simulation helper actions */}
          {!scanning && scannedValue && (
            <div className="w-full flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setScanning(true);
                  setScannedValue(null);
                  setTimeout(() => {
                    const randomDigits = Math.floor(1000 + Math.random() * 9000);
                    const simulatedValue = `${placeholderPrefix}${randomDigits}`;
                    setScanning(false);
                    setScannedValue(simulatedValue);
                  }, 1200);
                }}
              >
                Scan Again
              </Button>
              <Button type="button" variant="default" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleConfirm}>
                Use Value
              </Button>
            </div>
          )}

          {scanning && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs font-semibold"
              onClick={() => {
                setScanning(false);
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                setScannedValue(`${placeholderPrefix}${randomDigits}`);
              }}
            >
              Force Decode
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
