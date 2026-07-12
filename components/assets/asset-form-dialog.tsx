"use client";

import React, { useState } from "react";
import { Pencil, Plus, Upload, X, FileText, Image as ImageIcon } from "lucide-react";
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
import { createAssetAction, updateAssetAction } from "@/lib/assets/actions";

type AssetFormDialogProps = {
  mode: "create" | "edit";
  asset?: {
    id: string;
    name: string;
    serialNumber: string | null;
    acquisitionDate: Date | null;
    acquisitionCost: number | null;
    condition: string;
    location: string | null;
    sharedResource: boolean;
    status: string;
    categoryId: string;
    imagePath: string | null;
    documentPath: string | null;
  };
  categories: { id: string; name: string }[];
};

const formatDateForInput = (date: Date | null | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

export function AssetFormDialog({ mode, asset, categories }: AssetFormDialogProps) {
  const isEdit = mode === "edit";
  
  // Local state for mock file uploads
  const [imageName, setImageName] = useState<string | null>(asset?.imagePath || null);
  const [docName, setDocName] = useState<string | null>(asset?.documentPath || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
    }
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocName(file.name);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "outline" : "default"} size={isEdit ? "sm" : "default"} />
        }
      >
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Edit" : "Register Asset"}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Asset" : "Register New Asset"}</DialogTitle>
          <DialogDescription>
            Enter asset metadata, acquisition details, location, and upload relevant documents.
          </DialogDescription>
        </DialogHeader>
        
        <form action={isEdit ? updateAssetAction : createAssetAction} className="space-y-6">
          {asset ? <input type="hidden" name="id" value={asset.id} /> : null}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Asset Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-name-${asset?.id ?? "new"}`}>
                Asset Name *
              </label>
              <Input
                id={`asset-name-${asset?.id ?? "new"}`}
                name="name"
                defaultValue={asset?.name}
                required
                placeholder="e.g. Dell Latitude 7440"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-category-${asset?.id ?? "new"}`}>
                Category *
              </label>
              <Select
                id={`asset-category-${asset?.id ?? "new"}`}
                name="categoryId"
                defaultValue={asset?.categoryId ?? ""}
                required
              >
                <option value="" disabled>Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-serial-${asset?.id ?? "new"}`}>
                Serial Number
              </label>
              <Input
                id={`asset-serial-${asset?.id ?? "new"}`}
                name="serialNumber"
                defaultValue={asset?.serialNumber ?? ""}
                placeholder="e.g. CN-0X3892-XYZ"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-status-${asset?.id ?? "new"}`}>
                Status
              </label>
              <Select
                id={`asset-status-${asset?.id ?? "new"}`}
                name="status"
                defaultValue={asset?.status ?? "AVAILABLE"}
              >
                <option value="AVAILABLE">Available</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="RESERVED">Reserved</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="LOST">Lost</option>
                <option value="RETIRED">Retired</option>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-condition-${asset?.id ?? "new"}`}>
                Condition
              </label>
              <Select
                id={`asset-condition-${asset?.id ?? "new"}`}
                name="condition"
                defaultValue={asset?.condition ?? "GOOD"}
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="BROKEN">Broken</option>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-location-${asset?.id ?? "new"}`}>
                Location
              </label>
              <Input
                id={`asset-location-${asset?.id ?? "new"}`}
                name="location"
                defaultValue={asset?.location ?? ""}
                placeholder="e.g. HQ - Room 402, Shelf B"
              />
            </div>

            {/* Acquisition Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-acq-date-${asset?.id ?? "new"}`}>
                Acquisition Date
              </label>
              <Input
                id={`asset-acq-date-${asset?.id ?? "new"}`}
                name="acquisitionDate"
                type="date"
                defaultValue={formatDateForInput(asset?.acquisitionDate)}
              />
            </div>

            {/* Acquisition Cost */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={`asset-acq-cost-${asset?.id ?? "new"}`}>
                Acquisition Cost ($)
              </label>
              <Input
                id={`asset-acq-cost-${asset?.id ?? "new"}`}
                name="acquisitionCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={asset?.acquisitionCost ?? ""}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Shared Resource Flag */}
          <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-4">
            <input
              type="checkbox"
              id={`asset-shared-${asset?.id ?? "new"}`}
              name="sharedResource"
              defaultChecked={asset?.sharedResource}
              className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
            />
            <div className="space-y-0.5">
              <label
                htmlFor={`asset-shared-${asset?.id ?? "new"}`}
                className="text-sm font-semibold text-slate-900 cursor-pointer"
              >
                Mark as Shared Resource
              </label>
              <p className="text-xs text-muted-foreground">
                Shared resources can be booked by multiple departments or teams.
              </p>
            </div>
          </div>

          {/* Image & Document Mock Upload Sections */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Image Upload Block */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Photo</label>
              <input type="hidden" name="imagePath" value={imageName || ""} />
              {imageName ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <ImageIcon className="size-4 text-slate-500" />
                    <span className="truncate max-w-[180px] font-medium">{imageName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageName(null)}
                    className="rounded p-1 hover:bg-slate-200 text-slate-500"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Upload className="size-5 text-slate-400 mb-1" />
                    <p className="text-xs font-semibold text-slate-600">Upload Image</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Document Upload Block */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Warranty / Manual PDF</label>
              <input type="hidden" name="documentPath" value={docName || ""} />
              {docName ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <FileText className="size-4 text-slate-500" />
                    <span className="truncate max-w-[180px] font-medium">{docName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocName(null)}
                    className="rounded p-1 hover:bg-slate-200 text-slate-500"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Upload className="size-5 text-slate-400 mb-1" />
                    <p className="text-xs font-semibold text-slate-600">Upload Document</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleDocChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <SubmitButton pendingText={isEdit ? "Saving changes..." : "Registering asset..."}>
              {isEdit ? "Save Asset" : "Register Asset"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
