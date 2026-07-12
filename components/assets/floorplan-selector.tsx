"use client";

import React, { useState, useRef } from "react";
import { MapPin, Info } from "lucide-react";

type FloorplanSelectorProps = {
  initialX?: number | null;
  initialY?: number | null;
  readOnly?: boolean;
};

export function FloorplanSelector({
  initialX = null,
  initialY = null,
  readOnly = false,
}: FloorplanSelectorProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(
    initialX !== null && initialY !== null ? { x: initialX, y: initialY } : null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlanClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xRaw = e.clientX - rect.left;
    const yRaw = e.clientY - rect.top;

    // Calculate percentage coordinates (0 to 100)
    const xPct = Math.round((xRaw / rect.width) * 1000) / 10;
    const yPct = Math.round((yRaw / rect.height) * 1000) / 10;

    setCoords({ x: xPct, y: yPct });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="size-4 text-indigo-500" />
          {readOnly ? "Asset Office Location Pin" : "Pin Asset Location on Floor Plan"}
        </label>
        {coords && (
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Coordinates: X {coords.x}%, Y {coords.y}%
          </span>
        )}
      </div>

      {/* Interactive Map Plan Canvas */}
      <div
        ref={containerRef}
        onClick={handlePlanClick}
        className={`relative w-full aspect-[2/1] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm select-none ${
          readOnly ? "cursor-default" : "cursor-crosshair hover:border-indigo-300 transition-colors"
        }`}
      >
        {/* Stylized Vector SVG Layout Background representing HQ floor blueprint */}
        <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg">
          {/* Grid patterns */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Blueprint Layout Rooms */}
          {/* Server Room */}
          <rect x="5%" y="10%" width="20%" height="40%" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
          <text x="15%" y="30%" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="bold" opacity="0.6">SERVER ROOM</text>

          {/* Break Room */}
          <rect x="5%" y="55%" width="20%" height="35%" rx="4" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="15%" y="75%" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="bold" opacity="0.6">BREAKROOM</text>

          {/* Main Open Workspace */}
          <rect x="28%" y="10%" width="44%" height="80%" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="50%" y="50%" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold" opacity="0.6">OPEN WORKSPACE</text>

          {/* Meeting Room Alpha */}
          <rect x="75%" y="10%" width="20%" height="38%" rx="4" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.5" />
          <text x="85%" y="30%" textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="bold" opacity="0.6">CONF ALPHA</text>

          {/* Executive Offices */}
          <rect x="75%" y="52%" width="20%" height="38%" rx="4" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1.5" />
          <text x="85%" y="72%" textAnchor="middle" fill="#ea580c" fontSize="10" fontWeight="bold" opacity="0.6">EXEC OFFICE</text>
        </svg>

        {/* Pin Marker */}
        {coords && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            {/* Visual pulse rings */}
            <div className="absolute size-8 bg-indigo-500/20 border border-indigo-500/40 rounded-full animate-ping opacity-75" />
            <div className="absolute size-4 bg-indigo-500/30 border border-indigo-500/60 rounded-full animate-pulse" />
            <MapPin className="size-6 text-indigo-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] relative" />
          </div>
        )}

        {!coords && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[0.5px]">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Info className="size-3.5 text-indigo-500" />
              Click inside floor plan to pinpoint location
            </span>
          </div>
        )}
      </div>

      {/* Hidden form input fields for database action parsing */}
      {!readOnly && (
        <>
          <input type="hidden" name="locationX" value={coords ? coords.x : ""} />
          <input type="hidden" name="locationY" value={coords ? coords.y : ""} />
        </>
      )}
    </div>
  );
}
