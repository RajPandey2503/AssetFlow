import React from "react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

export default async function ActivityFeed() {
  // Query 5 most recent history entries from the database
  const activities = await prisma.assetHistory.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      asset: { select: { assetTag: true, name: true } },
    },
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-slate-800">Recent Activity Timeline</h2>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No system activity logged yet.
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 hover:bg-slate-50/50 transition-colors bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-150 px-1 py-0.5 rounded">
                    {item.asset.assetTag}
                  </span>
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 px-1.5">
                    {item.action.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                  <Clock className="size-3" />
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-normal">
                {item.details}
              </p>

              {item.changedBy && (
                <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                  <User className="size-3 text-slate-350" />
                  By {item.changedBy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}