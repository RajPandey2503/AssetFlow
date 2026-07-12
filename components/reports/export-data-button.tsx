"use client";

import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportDataButtonProps = {
  data: Record<string, unknown>[];
  filename: string;
  label: string;
};

export function ExportDataButton({ data, filename, label }: ExportDataButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Get keys (headers)
    const headers = Object.keys(data[0]);
    
    // Build CSV rows
    const csvRows = [
      headers.join(","), // header row
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName];
            const cellVal = val === null || val === undefined ? "" : String(val);
            // Escape double quotes and wrap in quotes
            const escaped = cellVal.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and click it
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="h-9 gap-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-slate-200"
    >
      <Download className="size-3.5 text-slate-500" />
      {label}
    </Button>
  );
}
