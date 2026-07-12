"use client";

import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Folder,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Info,
} from "lucide-react";
import { FloorplanSelector } from "@/components/assets/floorplan-selector";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HistoryRecord = {
  id: string;
  action: string;
  details: string;
  changedBy: string | null;
  createdAt: Date;
};

type AssetDetailsSheetProps = {
  asset: {
    id: string;
    assetTag: string;
    name: string;
    serialNumber: string | null;
    acquisitionDate: Date | null;
    acquisitionCost: number | null;
    condition: string;
    location: string | null;
    sharedResource: boolean;
    status: string;
    category: { name: string };
    imagePath: string | null;
    documentPath: string | null;
    locationX?: number | null;
    locationY?: number | null;
    history: HistoryRecord[];
  };
  trigger: React.ReactElement;
};

const formatCurrency = (val: number | null) => {
  if (val === null || val === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
};

const formatDate = (date: Date | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AssetDetailsSheet({ asset, trigger }: AssetDetailsSheetProps) {
  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ALLOCATED: "bg-blue-100 text-blue-800 border-blue-200",
    RESERVED: "bg-purple-100 text-purple-800 border-purple-200",
    MAINTENANCE: "bg-amber-100 text-amber-800 border-amber-200",
    LOST: "bg-red-100 text-red-800 border-red-200",
    RETIRED: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const conditionColors: Record<string, string> = {
    NEW: "bg-teal-100 text-teal-800 border-teal-200",
    GOOD: "bg-green-100 text-green-800 border-green-200",
    FAIR: "bg-yellow-100 text-yellow-800 border-yellow-200",
    POOR: "bg-orange-100 text-orange-800 border-orange-200",
    BROKEN: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      
      <SheetContent className="sm:max-w-md w-full overflow-y-auto h-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Badge className="bg-slate-900 text-white font-mono tracking-wider">
              {asset.assetTag}
            </Badge>
            <div className="flex gap-2">
              <Badge variant="outline" className={statusColors[asset.status] || "bg-slate-100 text-slate-800"}>
                {asset.status}
              </Badge>
              <Badge variant="outline" className={conditionColors[asset.condition] || "bg-slate-100 text-slate-800"}>
                {asset.condition}
              </Badge>
            </div>
          </div>
          <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {asset.name}
          </SheetTitle>
          <SheetDescription className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Folder className="size-3.5" />
            <span>Category: {asset.category.name}</span>
            {asset.sharedResource && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-indigo-600">Shared Resource</span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Tag className="size-3 text-slate-400" />
                Serial Number
              </span>
              <p className="text-sm font-medium text-slate-800 truncate">
                {asset.serialNumber || "None"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="size-3 text-slate-400" />
                Location
              </span>
              <p className="text-sm font-medium text-slate-800 truncate">
                {asset.location || "Unassigned"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="size-3 text-slate-400" />
                Acquisition Date
              </span>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(asset.acquisitionDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <DollarSign className="size-3 text-slate-400" />
                Acquisition Cost
              </span>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(asset.acquisitionCost)}
              </p>
            </div>
          </div>

          {/* QR Code Identifier Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Asset QR Identifier
              </span>
              <h4 className="text-sm font-semibold text-slate-850">{asset.assetTag}</h4>
              <p className="text-[10px] text-muted-foreground max-w-[220px] leading-relaxed">
                Scan barcode tag to instantly inspect asset operations or update logs.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(asset.assetTag)}`} 
                alt={`QR code for ${asset.assetTag}`}
                className="size-16"
                loading="lazy"
              />
            </div>
          </div>

          {/* Files / Attachments Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Info className="size-4 text-slate-500" />
              Attachments
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Photo Attachment */}
              {asset.imagePath ? (
                <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
                      <ImageIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{asset.imagePath}</p>
                      <p className="text-[10px] text-muted-foreground">Asset Photo</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <ArrowUpRight className="size-4 text-slate-500" />
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50 text-center text-xs text-muted-foreground">
                  No image attached
                </div>
              )}

              {/* PDF Document Attachment */}
              {asset.documentPath ? (
                <div className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 bg-indigo-55 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{asset.documentPath}</p>
                      <p className="text-[10px] text-muted-foreground">Warranty / Manual PDF</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Download className="size-4 text-slate-500" />
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50 text-center text-xs text-muted-foreground">
                  No document attached
                </div>
              )}
            </div>
          </div>

          {/* Floor Plan Location Pin */}
          {asset.locationX !== null && asset.locationX !== undefined && asset.locationY !== null && asset.locationY !== undefined && (
            <div className="space-y-3 pt-2">
              <FloorplanSelector
                initialX={asset.locationX}
                initialY={asset.locationY}
                readOnly
              />
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Activity className="size-4 text-slate-500" />
              Asset Audit Trail
            </h3>

            {asset.history && asset.history.length > 0 ? (
              <div className="relative pl-4 border-l-2 border-slate-100 ml-1.5 space-y-5">
                {asset.history.map((record) => {
                  let badgeColor = "bg-slate-400";
                  if (record.action === "REGISTERED") badgeColor = "bg-emerald-500";
                  if (record.action === "UPDATED") badgeColor = "bg-blue-500";
                  if (record.action === "STATUS_CHANGE") badgeColor = "bg-amber-500";
                  if (record.action === "DELETED") badgeColor = "bg-red-500";

                  return (
                    <div key={record.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-white ${badgeColor}`} />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-900 tracking-wider">
                            {record.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {record.details}
                        </p>
                        {record.changedBy && (
                          <p className="text-[10px] text-slate-400">
                            By {record.changedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-slate-50/50">
                <ShieldAlert className="size-5 text-slate-300 mb-1" />
                <p className="text-xs text-muted-foreground">No history records found.</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
