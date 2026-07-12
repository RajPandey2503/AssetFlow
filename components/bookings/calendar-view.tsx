"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type CalendarBooking = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  needReminder: boolean;
  reminderSent: boolean;
  asset: {
    assetTag: string;
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
};

type CalendarViewProps = {
  bookings: CalendarBooking[];
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarView({ bookings }: CalendarViewProps) {
  const router = useRouter();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);

  const handleDayClick = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    router.push(`/bookings?new=true&date=${currentYear}-${monthStr}-${dayStr}`);
  };

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar calculations
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Pad the grid array at the start with empty slots
  const gridArray = [
    ...Array(firstDayIndex).fill(null),
    ...daysArray
  ];
  // Helper to check if a booking overlaps with a calendar day
  const getBookingsForDay = (day: number) => {
    return bookings.filter((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      
      // Calculate start and end of the calendar day
      const dayStart = new Date(currentYear, currentMonth, day, 0, 0, 0);
      const dayEnd = new Date(currentYear, currentMonth, day, 23, 59, 59);

      // Check overlap
      return bStart <= dayEnd && bEnd >= dayStart;
    });
  };

  const statusColors: Record<string, string> = {
    UPCOMING: "bg-emerald-500 hover:bg-emerald-600",
    ONGOING: "bg-blue-500 hover:bg-blue-600",
    COMPLETED: "bg-slate-400 hover:bg-slate-500",
    CANCELLED: "bg-red-400 hover:bg-red-500",
  };

  return (
    <Card className="p-6 border border-slate-200 bg-white">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {weekDays.map((day) => (
          <div key={day} className="py-1 lg:py-2">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
        {gridArray.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-lg min-h-[50px] lg:min-h-[95px]" />;
          }

          const dayBookings = getBookingsForDay(day);
          const isToday = 
            now.getDate() === day && 
            now.getMonth() === currentMonth && 
            now.getFullYear() === currentYear;

          return (
            <div
              key={`day-${day}`}
              onClick={() => handleDayClick(day)}
              className={`border border-slate-100 rounded-lg min-h-[50px] lg:min-h-[95px] p-1 lg:p-2 flex flex-col justify-between hover:bg-indigo-50/20 hover:border-indigo-200 transition-all cursor-pointer ${
                isToday ? "bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-200" : "bg-white"
              }`}
            >
              {/* Day Number */}
              <span className={`text-[10px] lg:text-xs font-bold ${
                isToday ? "text-indigo-600" : "text-slate-800"
              }`}>
                {day}
              </span>

              {/* Day Bookings Mini-list (Desktop only) */}
              <div className="hidden lg:block mt-1 space-y-1 overflow-y-auto max-h-[60px] scrollbar-thin">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                    }}
                    className={`w-full block truncate text-[9px] font-semibold text-white px-1.5 py-0.5 rounded transition-all text-left cursor-pointer ${
                      statusColors[b.status] || "bg-slate-400"
                    }`}
                    title={`[${b.asset.assetTag}] ${b.asset.name}`}
                  >
                    {b.asset.assetTag}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[8px] font-bold text-slate-400 text-center">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </div>

              {/* Mobile Dots Indicator (Mobile/Tablet only) */}
              <div className="flex flex-wrap gap-1 justify-center mt-1 lg:hidden">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBooking(b);
                    }}
                    className={`size-1.5 rounded-full cursor-pointer ${
                      b.status === "UPCOMING" ? "bg-emerald-500" :
                      b.status === "ONGOING" ? "bg-blue-500" :
                      b.status === "COMPLETED" ? "bg-slate-400" : "bg-red-400"
                    }`}
                    title={`[${b.asset.assetTag}] ${b.asset.name}`}
                  />
                ))}
                {dayBookings.length > 3 && (
                  <span className="text-[7px] font-bold text-slate-400 leading-none">
                    +
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-slate-900 text-white font-mono tracking-wider">
                  {selectedBooking.asset.assetTag}
                </Badge>
                <Badge className={
                  selectedBooking.status === "UPCOMING" ? "bg-emerald-100 text-emerald-800" :
                  selectedBooking.status === "ONGOING" ? "bg-blue-100 text-blue-800" :
                  selectedBooking.status === "COMPLETED" ? "bg-slate-100 text-slate-800" :
                  "bg-red-100 text-red-800"
                }>
                  {selectedBooking.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                {selectedBooking.asset.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Resource Reservation Details
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3 border-t border-slate-100 text-sm text-slate-700">
              {/* Host/Reserved For */}
              <div className="flex items-center gap-3">
                <div className="size-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                  <User className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Reserved For</p>
                  <p className="font-semibold text-slate-800">{selectedBooking.user.name}</p>
                </div>
              </div>

              {/* Time Window */}
              <div className="flex items-center gap-3">
                <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time window</p>
                  <p className="font-medium text-slate-800 text-xs">
                    {new Date(selectedBooking.startTime).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })} 
                    {" - "} 
                    {new Date(selectedBooking.endTime).toLocaleString("en-US", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              {/* Reminder Support Info */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Reminder Enabled:</span>
                  <span className="font-semibold text-slate-700">{selectedBooking.needReminder ? "Yes" : "No"}</span>
                </div>
                {selectedBooking.needReminder && (
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-500">Reminder Status:</span>
                    <span className="font-semibold flex items-center gap-1">
                      {selectedBooking.reminderSent ? (
                        <>
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          <span className="text-emerald-700">Dispatched</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="size-3.5 text-amber-500" />
                          <span className="text-amber-700">Pending Schedule</span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
