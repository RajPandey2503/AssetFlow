"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReceiptButtonProps = {
  allocation: {
    id: string;
    assetTag: string;
    assetName: string;
    serialNumber: string | null;
    categoryName: string;
    assignedTo: string;
    assignedToEmail: string;
    allocatedAt: string;
    returnDate: string | null;
    condition: string;
    location: string | null;
  };
};

export function ReceiptButton({ allocation }: ReceiptButtonProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the handover receipt.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asset Handover Receipt - ${allocation.assetTag}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
          }
          .logo span {
            color: #6366f1;
          }
          .title {
            text-align: right;
          }
          .title h1 {
            margin: 0;
            font-size: 20px;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .meta-section h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 5px;
          }
          .meta-section p {
            margin: 4px 0;
            font-size: 13px;
          }
          .meta-section p strong {
            color: #0f172a;
          }
          .table-container {
            margin-bottom: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            font-size: 13px;
          }
          .terms {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 60px;
            font-size: 11px;
            color: #64748b;
          }
          .terms h4 {
            margin: 0 0 8px 0;
            color: #334155;
            font-size: 12px;
            text-transform: uppercase;
          }
          .terms ol {
            margin: 0;
            padding-left: 15px;
          }
          .terms li {
            margin-bottom: 4px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            gap: 100px;
          }
          .sig-line {
            flex: 1;
            text-align: center;
          }
          .sig-line .line {
            border-bottom: 1px solid #cbd5e1;
            height: 50px;
            margin-bottom: 8px;
          }
          .sig-line p {
            margin: 0;
            font-size: 12px;
            color: #475569;
          }
          .sig-line span {
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Asset<span>Flow</span></div>
          <div class="title">
            <h1>Handover Receipt</h1>
            <p>Receipt ID: HO-${allocation.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-section">
            <h3>Handover Details</h3>
            <p>Date Allocated: <strong>${allocation.allocatedAt}</strong></p>
            <p>Expected Return: <strong>${allocation.returnDate || "Indefinite"}</strong></p>
            <p>Authorized By: <strong>AssetFlow ERP System</strong></p>
          </div>
          <div class="meta-section">
            <h3>Assignee Info</h3>
            <p>Name: <strong>${allocation.assignedTo}</strong></p>
            <p>Email: <strong>${allocation.assignedToEmail}</strong></p>
            <p>Location: <strong>${allocation.location || "Default Office"}</strong></p>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Asset Tag</th>
                <th style="width: 40%">Asset Name / Description</th>
                <th style="width: 20%">Serial Number</th>
                <th style="width: 15%">Condition</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${allocation.assetTag}</strong></td>
                <td>${allocation.assetName} (${allocation.categoryName})</td>
                <td style="font-family: monospace;">${allocation.serialNumber || "N/A"}</td>
                <td>${allocation.condition}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="terms">
          <h4>Asset Handover Terms & Conditions</h4>
          <ol>
            <li>The employee acknowledges receipt of the asset detailed above in good, working condition.</li>
            <li>The asset is to be used primarily for business/professional operations of the organization.</li>
            <li>The employee assumes full responsibility for the safeguard and correct usage of the asset.</li>
            <li>Any damage, loss, or performance issue must be reported to the IT/Asset Management team immediately.</li>
            <li>Upon termination of employment or request by authorization, the asset must be returned immediately.</li>
          </ol>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <div class="line"></div>
            <p>Authorized Handover Signature</p>
            <span>IT / Asset Manager</span>
          </div>
          <div class="sig-line">
            <div class="line"></div>
            <p>Assignee Signature of Acceptance</p>
            <span>Employee Receipt</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1 text-[11px] font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
      onClick={handlePrint}
    >
      <FileText className="size-3.5 text-slate-500" />
      Receipt
    </Button>
  );
}
