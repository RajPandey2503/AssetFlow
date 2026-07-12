"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

type ReportsChartsProps = {
  utilizationData: { name: string; value: number }[];
  departmentData: { department: string; count: number; cost: number }[];
  maintenanceData: { month: string; cost: number; count: number }[];
  bookingData: { day: string; count: number }[];
};

const UTIL_COLORS = {
  AVAILABLE: "#10b981", // emerald-500
  ALLOCATED: "#3b82f6", // blue-500
  MAINTENANCE: "#f59e0b", // amber-500
  LOST: "#f43f5e", // rose-500
};

export function ReportsCharts({
  utilizationData,
  departmentData,
  maintenanceData,
  bookingData,
}: ReportsChartsProps) {
  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Upper Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Pie Chart */}
        <Card className="border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Asset Utilization & Status</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Distribution of company assets by status</p>
          </div>
          <CardContent className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {utilizationData.map((entry, idx) => {
                    const color = UTIL_COLORS[entry.name as keyof typeof UTIL_COLORS] || "#94a3b8";
                    return <Cell key={`cell-${idx}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Bar Chart */}
        <Card className="border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Department Summary</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Asset distribution count across departments</p>
          </div>
          <CardContent className="p-4 h-[300px]">
            {departmentData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No department data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val, name) => [name === "cost" ? formatCurrency(val as number) : val, name === "cost" ? "Asset Value" : "Asset Count"]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Asset Count" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lower Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Spend Trends */}
        <Card className="border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Maintenance Cost Trends</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Monthly maintenance repair expenditures</p>
          </div>
          <CardContent className="p-4 h-[300px]">
            {maintenanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No maintenance history recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={maintenanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val) => [formatCurrency(val as number), "Repair Cost"]}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Heatmap Weekly density */}
        <Card className="border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Booking Calendar Utilization</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Booking density and reservations load by day of week</p>
          </div>
          <CardContent className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val) => [val, "Active Bookings"]}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
