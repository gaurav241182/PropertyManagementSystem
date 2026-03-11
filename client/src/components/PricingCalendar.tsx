import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Save, Lock, Unlock, Layers, AlertTriangle, Maximize2, Minimize2, CalendarPlus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDay, addMonths, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { RoomPricing, Room, RoomBlock } from "@shared/schema";

interface PricingCalendarProps {
  roomTypes: any[];
}

type DayStatus = "available" | "booked" | "checked_in" | "blocked" | "";
type ViewMode = "compact" | "expanded";

interface CalendarStatusEntry {
  status: string;
  bookingStatus: string;
  bookedCount: number;
  checkedInCount: number;
  blockedCount: number;
  availableCount: number;
  totalRooms: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  available: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  booked: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  checked_in: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  blocked: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  booked: "Booked",
  checked_in: "Checked In",
  blocked: "Blocked",
};

function getStatusStyle(status: DayStatus) {
  if (status && STATUS_COLORS[status]) {
    return STATUS_COLORS[status];
  }
  return { bg: "bg-white", border: "border-gray-200", text: "text-gray-500" };
}

function formatCompactPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(num));
}

function DayCell({
  dateKey,
  dayNum,
  isWeekendDay,
  price,
  isLocked,
  pricingId,
  onChange,
  onToggleLock,
  roomStatus,
  statusInfo,
  onProtectedClick,
  isUnlockedProtected,
  viewMode,
  isInDragRange,
  onDragStart,
  onDragEnter,
  onDragEnd,
  statusOnly = false,
}: {
  dateKey: string;
  dayNum: number;
  isWeekendDay: boolean;
  price: string;
  isLocked: boolean;
  pricingId: number | null;
  onChange: (dateKey: string, value: string) => void;
  onToggleLock: (dateKey: string) => void;
  roomStatus: DayStatus;
  statusInfo?: CalendarStatusEntry;
  onProtectedClick: (dateKey: string) => void;
  isUnlockedProtected: boolean;
  viewMode: ViewMode;
  isInDragRange: boolean;
  onDragStart: (dateKey: string) => void;
  onDragEnter: (dateKey: string) => void;
  onDragEnd: () => void;
  statusOnly?: boolean;
}) {
  const [localPrice, setLocalPrice] = useState(price);

  useEffect(() => {
    setLocalPrice(price);
  }, [price]);

  const style = getStatusStyle(roomStatus);
  const isProtected = (roomStatus === "booked" || roomStatus === "checked_in") && !isUnlockedProtected;
  const isCompact = viewMode === "compact";
  const displayPrice = isCompact ? formatCompactPrice(localPrice) : localPrice;
  const canDrag = roomStatus === "available" || roomStatus === "";

  const handleInputClick = () => {
    if (isProtected && !isLocked) {
      onProtectedClick(dateKey);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (canDrag && e.button === 0) {
      e.preventDefault();
      onDragStart(dateKey);
    }
  };

  const handleMouseEnter = () => {
    onDragEnter(dateKey);
  };

  return (
    <div
      className={`border rounded-lg flex flex-col gap-0.5 transition-colors select-none ${
        isCompact ? "p-0.5 sm:p-1 min-h-[48px] sm:min-h-[56px]" : "p-1.5 sm:p-2 min-h-[70px] sm:min-h-[90px]"
      } ${style.bg} ${style.border} ${isLocked ? "opacity-75" : ""} ${
        isInDragRange ? "ring-2 ring-primary ring-offset-1 bg-primary/10" : ""
      } ${canDrag ? "cursor-crosshair" : ""}`}
      data-testid={`day-cell-${dateKey}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={onDragEnd}
    >
      <div className="flex items-center justify-between">
        <span className={`font-bold ${isCompact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"} ${isWeekendDay ? "text-amber-700" : "text-gray-500"}`}>
          {dayNum}
        </span>
        <div className="flex items-center gap-0.5">
          {statusInfo && statusInfo.totalRooms > 1 && (
            <span className={`text-muted-foreground ${isCompact ? "text-[7px]" : "text-[9px]"}`} data-testid={`status-summary-${dateKey}`}>
              {statusInfo.availableCount}/{statusInfo.totalRooms}
            </span>
          )}
          {!statusOnly && !isCompact && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock(dateKey); }}
              className={`p-0.5 rounded hover:bg-gray-100 ${isLocked ? "text-red-500" : "text-gray-300"}`}
              title={isLocked ? "Unlock rate" : "Lock rate"}
              data-testid={`lock-toggle-${dateKey}`}
            >
              {isLocked ? <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Unlock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            </button>
          )}
          {!statusOnly && isCompact && isLocked && (
            <Lock className="h-2 w-2 text-red-500" />
          )}
        </div>
      </div>
      <div className="flex-1 flex items-center">
        {statusOnly ? (
          <div className={`w-full text-center font-semibold ${isCompact ? "text-[10px] sm:text-[11px]" : "text-xs sm:text-sm"} ${style.text}`} data-testid={`status-display-${dateKey}`}>
            {statusInfo ? `${statusInfo.availableCount} avail` : "—"}
          </div>
        ) : isCompact ? (
          <div className={`w-full text-center font-semibold ${isCompact ? "text-[10px] sm:text-[11px]" : "text-xs sm:text-sm"}`} data-testid={`price-display-${dateKey}`}>
            {displayPrice}
          </div>
        ) : (
          <div className="relative w-full">
            <input
              type="number"
              className={`w-full px-1 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-sm font-semibold rounded border text-center ${
                isLocked || isProtected
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                  : "bg-white/80 focus:outline-none focus:ring-1 focus:ring-primary border-gray-200"
              }`}
              value={localPrice}
              onChange={(e) => {
                if (!isProtected) setLocalPrice(e.target.value);
              }}
              onBlur={() => {
                if (!isProtected && localPrice !== price) {
                  onChange(dateKey, localPrice);
                }
              }}
              onClick={(e) => { e.stopPropagation(); handleInputClick(); }}
              onMouseDown={(e) => e.stopPropagation()}
              readOnly={isLocked || isProtected}
              data-testid={`price-input-${dateKey}`}
            />
          </div>
        )}
      </div>
      {roomStatus && (
        <div className={`text-center font-medium truncate ${isCompact ? "text-[7px] sm:text-[8px]" : "text-[8px] sm:text-[10px]"} ${style.text}`} data-testid={`status-label-${dateKey}`}>
          {STATUS_LABEL[roomStatus] || roomStatus}
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  monthDate,
  selectedRoomTypeId,
  basePrice,
  pricingMap,
  calendarStatus,
  localPrices,
  localLocks,
  onPriceChange,
  onToggleLock,
  onProtectedClick,
  unlockedProtectedDates,
  viewMode,
  dragRange,
  onDragStart,
  onDragEnter,
  onDragEnd,
  statusOnly = false,
}: {
  monthDate: Date;
  selectedRoomTypeId: string;
  basePrice: string;
  pricingMap: Record<string, Record<string, RoomPricing>>;
  calendarStatus: Record<string, CalendarStatusEntry>;
  localPrices: Record<string, string>;
  localLocks: Record<string, boolean>;
  onPriceChange: (dateKey: string, value: string) => void;
  onToggleLock: (dateKey: string) => void;
  onProtectedClick: (dateKey: string) => void;
  unlockedProtectedDates: Set<string>;
  viewMode: ViewMode;
  dragRange: { start: string; end: string } | null;
  onDragStart: (dateKey: string) => void;
  onDragEnter: (dateKey: string) => void;
  onDragEnd: () => void;
  statusOnly?: boolean;
}) {
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const firstDayOfWeek = getDay(startDate);
  const emptySlots = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const isCompact = viewMode === "compact";

  const isInDragRange = (dateKey: string) => {
    if (!dragRange) return false;
    const s = dragRange.start <= dragRange.end ? dragRange.start : dragRange.end;
    const e = dragRange.start <= dragRange.end ? dragRange.end : dragRange.start;
    return dateKey >= s && dateKey <= e;
  };

  return (
    <div>
      <div className={`text-center font-semibold mb-1 sm:mb-2 py-1 ${isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`} data-testid={`text-month-${format(monthDate, "yyyy-MM")}`}>
        {format(monthDate, "MMMM yyyy")}
      </div>
      <div className={`grid grid-cols-7 mb-1 ${isCompact ? "gap-0.5" : "gap-0.5 sm:gap-1"}`}>
        {DAY_LABELS.map((label) => (
          <div key={label} className={`text-center font-semibold ${isCompact ? "text-[8px] sm:text-[9px] py-0.5" : "text-[9px] sm:text-xs py-0.5 sm:py-1"} ${label === "Sat" || label === "Sun" ? "text-amber-600" : "text-gray-500"}`}>
            {label}
          </div>
        ))}
      </div>
      <div className={`grid grid-cols-7 ${isCompact ? "gap-0.5" : "gap-0.5 sm:gap-1"}`}>
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const weekendDay = isWeekend(day);
          const statusEntry = calendarStatus[dateKey];
          const roomStatus: DayStatus = (statusEntry?.status as DayStatus) || "";
          return (
            <DayCell
              key={dateKey}
              dateKey={dateKey}
              dayNum={day.getDate()}
              isWeekendDay={weekendDay}
              price={localPrices[dateKey] || basePrice}
              isLocked={localLocks[dateKey] || false}
              pricingId={pricingMap[selectedRoomTypeId]?.[dateKey]?.id ?? null}
              onChange={onPriceChange}
              onToggleLock={onToggleLock}
              roomStatus={roomStatus}
              statusInfo={statusEntry}
              onProtectedClick={onProtectedClick}
              isUnlockedProtected={unlockedProtectedDates.has(dateKey)}
              viewMode={viewMode}
              isInDragRange={isInDragRange(dateKey)}
              onDragStart={onDragStart}
              onDragEnter={onDragEnter}
              onDragEnd={onDragEnd}
              statusOnly={statusOnly}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PricingCalendar({ roomTypes }: PricingCalendarProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("all");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});
  const [localLocks, setLocalLocks] = useState<Record<string, boolean>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMonths, setBulkMonths] = useState<string[]>([]);
  const [bulkWeekdayPrice, setBulkWeekdayPrice] = useState("");
  const [bulkWeekendPrice, setBulkWeekendPrice] = useState("");
  const [bulkSamePrice, setBulkSamePrice] = useState(false);
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState<string>("");
  const [protectedDateKey, setProtectedDateKey] = useState<string | null>(null);
  const [priceChangeReason, setPriceChangeReason] = useState("");
  const [unlockedProtectedDates, setUnlockedProtectedDates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [dragEndDate, setDragEndDate] = useState<string | null>(null);
  const [quickBookDialog, setQuickBookDialog] = useState(false);
  const [quickBookDates, setQuickBookDates] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockAction, setBlockAction] = useState<"block" | "unblock">("block");
  const [selectedBlockRoomIds, setSelectedBlockRoomIds] = useState<number[]>([]);
  const [bulkDateMode, setBulkDateMode] = useState<"months" | "range">("months");
  const [bulkDateFrom, setBulkDateFrom] = useState("");
  const [bulkDateTo, setBulkDateTo] = useState("");
  const [bulkRoomNumber, setBulkRoomNumber] = useState<string>("all");
  const [blockRoomTypeId, setBlockRoomTypeId] = useState<string>("");
  const [blockDateMode, setBlockDateMode] = useState<"months" | "range">("months");
  const [blockMonths, setBlockMonths] = useState<string[]>([]);
  const [blockDateFrom, setBlockDateFrom] = useState("");
  const [blockDateTo, setBlockDateTo] = useState("");
  const [blockWeekendsOnly, setBlockWeekendsOnly] = useState(false);

  const monthCount = viewMode === "compact" ? 3 : 1;

  const monthsToShow = useMemo(() => {
    const months: Date[] = [];
    for (let i = 0; i < monthCount; i++) {
      months.push(addMonths(currentDate, i));
    }
    return months;
  }, [currentDate, monthCount]);

  const { data: allRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const isAllRoomTypes = selectedRoomTypeId === "all";

  const filteredRooms = useMemo(() => {
    if (isAllRoomTypes) return allRooms;
    return allRooms.filter(r => String(r.roomTypeId) === selectedRoomTypeId);
  }, [allRooms, selectedRoomTypeId, isAllRoomTypes]);

  useEffect(() => {
    setSelectedRoomId("all");
  }, [selectedRoomTypeId]);

  const { data: allPricing = [], isLoading: pricingLoading } = useQuery<RoomPricing[]>({
    queryKey: ["/api/room-pricing"],
  });

  const dateRange = useMemo(() => {
    const first = monthsToShow[0];
    const last = monthsToShow[monthsToShow.length - 1];
    return {
      startDate: format(startOfMonth(first), "yyyy-MM-dd"),
      endDate: format(endOfMonth(last), "yyyy-MM-dd"),
    };
  }, [monthsToShow]);

  const calendarStatusParams = useMemo(() => {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    if (!isAllRoomTypes) params.set("roomTypeId", selectedRoomTypeId);
    if (selectedRoomId !== "all") params.set("roomId", selectedRoomId);
    return params.toString();
  }, [dateRange, selectedRoomTypeId, selectedRoomId, isAllRoomTypes]);

  const { data: calendarStatus = {} } = useQuery<Record<string, CalendarStatusEntry>>({
    queryKey: ["/api/rooms/calendar-status", calendarStatusParams],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/calendar-status?${calendarStatusParams}`);
      if (!res.ok) throw new Error("Failed to fetch calendar status");
      return res.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const pricingMap = useMemo(() => {
    const map: Record<string, Record<string, RoomPricing>> = {};
    allPricing.forEach((p) => {
      const rtKey = String(p.roomTypeId);
      if (!map[rtKey]) map[rtKey] = {};
      map[rtKey][p.date] = p;
    });
    return map;
  }, [allPricing]);

  const selectedRoomType = isAllRoomTypes ? null : roomTypes.find((r) => String(r.id) === selectedRoomTypeId);
  const basePrice = selectedRoomType ? String(selectedRoomType.basePrice || "0") : "0";

  const pricingVersion = useMemo(() => {
    return allPricing.map((p) => `${p.id}:${p.price}:${p.isLocked}`).join(",");
  }, [allPricing]);

  const allMonthsKey = monthsToShow.map(m => format(m, "yyyy-MM")).join(",");

  useEffect(() => {
    if (isAllRoomTypes) return;
    const bp = basePrice;
    const newPrices: Record<string, string> = {};
    const newLocks: Record<string, boolean> = {};
    monthsToShow.forEach((monthDate) => {
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const mDays = eachDayOfInterval({ start: mStart, end: mEnd });
      mDays.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const existing = pricingMap[selectedRoomTypeId]?.[dateKey];
        if (existing) {
          newPrices[dateKey] = String(existing.price);
          newLocks[dateKey] = existing.isLocked;
        } else {
          newPrices[dateKey] = bp;
          newLocks[dateKey] = false;
        }
      });
    });
    setLocalPrices(newPrices);
    setLocalLocks(newLocks);
    setDirtyKeys(new Set());
    setUnlockedProtectedDates(new Set());
  }, [selectedRoomTypeId, allMonthsKey, pricingVersion]);

  const handlePriceChange = useCallback((dateKey: string, value: string) => {
    setLocalPrices((prev) => ({ ...prev, [dateKey]: value }));
    setDirtyKeys((prev) => new Set(prev).add(dateKey));
  }, []);

  const handleToggleLock = useCallback((dateKey: string) => {
    setLocalLocks((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
    setDirtyKeys((prev) => new Set(prev).add(dateKey));
  }, []);

  const handleProtectedClick = useCallback((dateKey: string) => {
    if (!unlockedProtectedDates.has(dateKey)) {
      setProtectedDateKey(dateKey);
      setPriceChangeReason("");
    }
  }, [unlockedProtectedDates]);

  const handleConfirmProtectedChange = () => {
    if (!priceChangeReason.trim()) {
      toast({ title: "Reason Required", description: "Please provide a reason for changing the price.", variant: "destructive" });
      return;
    }
    if (protectedDateKey) {
      setUnlockedProtectedDates(prev => new Set(prev).add(protectedDateKey));
      setProtectedDateKey(null);
      setPriceChangeReason("");
      toast({ title: "Price Unlocked", description: `You can now edit the price for ${protectedDateKey}. Remember to save your changes.` });
    }
  };

  const handlePrevMonth = () => setCurrentDate(addMonths(currentDate, viewMode === "compact" ? -3 : -1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, viewMode === "compact" ? 3 : 1));

  const handleDragStart = useCallback((dateKey: string) => {
    setIsDragging(true);
    setDragStartDate(dateKey);
    setDragEndDate(dateKey);
  }, []);

  const handleDragEnter = useCallback((dateKey: string) => {
    if (isDragging) {
      setDragEndDate(dateKey);
    }
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !dragStartDate || !dragEndDate) {
      setIsDragging(false);
      return;
    }

    const start = dragStartDate <= dragEndDate ? dragStartDate : dragEndDate;
    const end = dragStartDate <= dragEndDate ? dragEndDate : dragStartDate;

    if (start === end) {
      setIsDragging(false);
      setDragStartDate(null);
      setDragEndDate(null);
      return;
    }

    const checkIn = start;
    const checkOut = format(addDays(new Date(end), 1), "yyyy-MM-dd");

    setQuickBookDates({ checkIn, checkOut });
    setQuickBookDialog(true);
    setIsDragging(false);
  }, [isDragging, dragStartDate, dragEndDate]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, handleDragEnd]);

  const handleQuickBookConfirm = () => {
    if (!quickBookDates) return;
    const params = new URLSearchParams({
      checkIn: quickBookDates.checkIn,
      checkOut: quickBookDates.checkOut,
      roomTypeId: selectedRoomTypeId,
    });
    if (selectedRoomId !== "all") {
      params.set("roomId", selectedRoomId);
    }
    setQuickBookDialog(false);
    setDragStartDate(null);
    setDragEndDate(null);
    setLocation(`/admin/bookings?${params.toString()}`);
  };

  const handleQuickBookCancel = () => {
    setQuickBookDialog(false);
    setQuickBookDates(null);
    setDragStartDate(null);
    setDragEndDate(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiRequest("POST", "/api/room-pricing/bulk", items);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-pricing"] });
      setDirtyKeys(new Set());
      toast({ title: "Saved", description: "Pricing changes saved successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (dirtyKeys.size === 0) {
      toast({ title: "No Changes", description: "No pricing changes to save." });
      return;
    }
    const items = Array.from(dirtyKeys).map((dateKey) => ({
      roomTypeId: Number(selectedRoomTypeId),
      date: dateKey,
      price: localPrices[dateKey] || basePrice,
      isLocked: localLocks[dateKey] ?? false,
    }));
    saveMutation.mutate(items);
  };

  const bulkMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiRequest("POST", "/api/room-pricing/bulk", items);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-pricing"] });
      setBulkDialogOpen(false);
      setBulkMonths([]);
      setBulkWeekdayPrice("");
      setBulkWeekendPrice("");
      setBulkSamePrice(false);
      setBulkDateFrom("");
      setBulkDateTo("");
      setBulkDateMode("months");
      setBulkRoomNumber("all");
      toast({ title: "Bulk Update Complete", description: "Pricing updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getDaysFromSelection = (mode: "months" | "range", months: string[], dateFrom: string, dateTo: string): Date[] => {
    if (mode === "range") {
      if (!dateFrom || !dateTo) return [];
      return eachDayOfInterval({ start: new Date(dateFrom), end: new Date(dateTo) });
    }
    const days: Date[] = [];
    months.forEach((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      days.push(...eachDayOfInterval({ start: monthStart, end: monthEnd }));
    });
    return days;
  };

  const handleBulkSubmit = () => {
    const hasDateSelection = bulkDateMode === "months" ? bulkMonths.length > 0 : (bulkDateFrom && bulkDateTo);
    if (!bulkRoomTypeId || !hasDateSelection || !bulkWeekdayPrice) {
      toast({ title: "Missing Info", description: "Please select room type, date range, and enter prices.", variant: "destructive" });
      return;
    }
    const weekdayP = bulkWeekdayPrice;
    const weekendP = bulkSamePrice ? bulkWeekdayPrice : (bulkWeekendPrice || bulkWeekdayPrice);

    const targetRoomTypeIds = bulkRoomTypeId === "all"
      ? roomTypes.map((rt: any) => rt.id)
      : [Number(bulkRoomTypeId)];

    const days = getDaysFromSelection(bulkDateMode, bulkMonths, bulkDateFrom, bulkDateTo);

    const items: any[] = [];
    for (const rtId of targetRoomTypeIds) {
      days.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const existing = pricingMap[String(rtId)]?.[dateKey];
        if (existing?.isLocked) return;
        items.push({
          roomTypeId: rtId,
          date: dateKey,
          price: isWeekend(day) ? weekendP : weekdayP,
          isLocked: false,
        });
      });
    }

    if (items.length === 0) {
      toast({ title: "No Updates", description: "All selected dates are locked.", variant: "destructive" });
      return;
    }
    bulkMutation.mutate(items);
  };

  const blockMutation = useMutation({
    mutationFn: async (payload: { action: "block" | "unblock"; roomIds: number[]; startDate: string; endDate: string }) => {
      if (payload.action === "block") {
        const blocks = payload.roomIds.map((roomId) => ({
          roomId,
          startDate: payload.startDate,
          endDate: payload.endDate,
          reason: "",
        }));
        await apiRequest("POST", "/api/room-blocks", blocks);
      } else {
        await apiRequest("POST", "/api/room-blocks/unblock", {
          roomIds: payload.roomIds,
          startDate: payload.startDate,
          endDate: payload.endDate,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/room-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-status"] });
      setBlockDialogOpen(false);
      setSelectedBlockRoomIds([]);
      setBlockMonths([]);
      setBlockDateFrom("");
      setBlockDateTo("");
      setBlockWeekendsOnly(false);
      toast({
        title: blockAction === "block" ? "Rooms Blocked" : "Rooms Unblocked",
        description: `Room(s) ${blockAction === "block" ? "blocked" : "unblocked"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleBlockSubmit = () => {
    if (selectedBlockRoomIds.length === 0) {
      toast({ title: "No Rooms Selected", description: "Please select at least one room.", variant: "destructive" });
      return;
    }
    const hasDateSelection = blockDateMode === "months" ? blockMonths.length > 0 : (blockDateFrom && blockDateTo);
    if (!hasDateSelection) {
      toast({ title: "No Dates Selected", description: "Please select months or a date range.", variant: "destructive" });
      return;
    }

    if (blockWeekendsOnly) {
      const days = getDaysFromSelection(blockDateMode, blockMonths, blockDateFrom, blockDateTo);
      const weekendDays = days.filter(d => isWeekend(d));
      if (weekendDays.length === 0) {
        toast({ title: "No Weekends", description: "No weekend days found in the selected range.", variant: "destructive" });
        return;
      }
      let startD = format(weekendDays[0], "yyyy-MM-dd");
      let currentEnd = startD;
      const ranges: { start: string; end: string }[] = [];
      for (let i = 1; i < weekendDays.length; i++) {
        const prev = weekendDays[i - 1];
        const curr = weekendDays[i];
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 3600 * 24);
        if (diffDays <= 1) {
          currentEnd = format(curr, "yyyy-MM-dd");
        } else {
          ranges.push({ start: startD, end: currentEnd });
          startD = format(curr, "yyyy-MM-dd");
          currentEnd = startD;
        }
      }
      ranges.push({ start: startD, end: currentEnd });
      const promises = ranges.map(r =>
        blockMutation.mutateAsync({
          action: blockAction,
          roomIds: selectedBlockRoomIds,
          startDate: r.start,
          endDate: r.end,
        })
      );
      Promise.all(promises);
      return;
    }

    let startDate: string;
    let endDate: string;
    if (blockDateMode === "range") {
      startDate = blockDateFrom;
      endDate = blockDateTo;
    } else {
      const sortedMonths = [...blockMonths].sort();
      const firstMonth = sortedMonths[0];
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      const [fy, fm] = firstMonth.split("-").map(Number);
      const [ly, lm] = lastMonth.split("-").map(Number);
      startDate = format(new Date(fy, fm - 1, 1), "yyyy-MM-dd");
      endDate = format(endOfMonth(new Date(ly, lm - 1, 1)), "yyyy-MM-dd");
    }

    blockMutation.mutate({
      action: blockAction,
      roomIds: selectedBlockRoomIds,
      startDate,
      endDate,
    });
  };

  const blockFilteredRooms = useMemo(() => {
    if (!blockRoomTypeId || blockRoomTypeId === "all") return allRooms;
    return allRooms.filter(r => String(r.roomTypeId) === blockRoomTypeId);
  }, [allRooms, blockRoomTypeId]);

  const next12Months = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = addMonths(now, i);
      months.push({
        key: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy"),
      });
    }
    return months;
  }, []);

  const protectedStatus = protectedDateKey ? calendarStatus[protectedDateKey] : null;
  const protectedStatusLabel = protectedStatus
    ? (STATUS_LABEL[protectedStatus.status] || protectedStatus.status)
    : "";

  const dragRange = isDragging && dragStartDate && dragEndDate
    ? { start: dragStartDate, end: dragEndDate }
    : (dragStartDate && dragEndDate && quickBookDialog ? { start: dragStartDate, end: dragEndDate } : null);

  const headerLabel = viewMode === "compact"
    ? `${format(monthsToShow[0], "MMM yyyy")} - ${format(monthsToShow[monthsToShow.length - 1], "MMM yyyy")}`
    : format(monthsToShow[0], "MMMM yyyy");

  const quickBookNights = quickBookDates
    ? Math.ceil((new Date(quickBookDates.checkOut).getTime() - new Date(quickBookDates.checkIn).getTime()) / (1000 * 3600 * 24))
    : 0;

  const selectedRoomForBooking = selectedRoomId !== "all"
    ? filteredRooms.find(r => String(r.id) === selectedRoomId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Select value={selectedRoomTypeId} onValueChange={setSelectedRoomTypeId}>
            <SelectTrigger className="w-[160px] sm:w-[200px] text-xs sm:text-sm" data-testid="select-room-type">
              <SelectValue placeholder="Select Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="room-type-option-all">All Room Types</SelectItem>
              {roomTypes.map((rt) => (
                <SelectItem key={rt.id} value={String(rt.id)} data-testid={`room-type-option-${rt.id}`}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isAllRoomTypes && (
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm" data-testid="select-room-number">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="room-option-all">All Rooms</SelectItem>
                {filteredRooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)} data-testid={`room-option-${room.id}`}>
                    Room {room.roomNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isAllRoomTypes && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              Showing availability across all rooms ({allRooms.length} total)
            </span>
          )}
          {selectedRoomType && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              Base: <span className="font-semibold">{basePrice}</span>
            </span>
          )}
        </div>
        {!isAllRoomTypes && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBlockAction("block");
                setSelectedBlockRoomIds([]);
                setBlockRoomTypeId(selectedRoomTypeId);
                setBlockMonths([]);
                setBlockDateFrom("");
                setBlockDateTo("");
                setBlockWeekendsOnly(false);
                setBlockDateMode("months");
                setBlockDialogOpen(true);
              }}
              data-testid="button-block-rooms"
            >
              <Lock className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Block</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBlockAction("unblock");
                setSelectedBlockRoomIds([]);
                setBlockRoomTypeId(selectedRoomTypeId);
                setBlockMonths([]);
                setBlockDateFrom("");
                setBlockDateTo("");
                setBlockWeekendsOnly(false);
                setBlockDateMode("months");
                setBlockDialogOpen(true);
              }}
              data-testid="button-unblock-rooms"
            >
              <Unlock className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Unblock</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkRoomTypeId(selectedRoomTypeId);
                setBulkRoomNumber("all");
                setBulkDateMode("months");
                setBulkDateFrom("");
                setBulkDateTo("");
                setBulkMonths([]);
                setBulkWeekdayPrice("");
                setBulkWeekendPrice("");
                setBulkSamePrice(false);
                setBulkDialogOpen(true);
              }}
              data-testid="button-bulk-update"
            >
              <Layers className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Bulk Pricing Update</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || dirtyKeys.size === 0} data-testid="button-save-pricing">
              <Save className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Save Changes</span>
              {dirtyKeys.size > 0 && (
                <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{dirtyKeys.size}</span>
              )}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md bg-card p-1">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 sm:h-8 sm:w-8" data-testid="button-prev-month">
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <span className="font-semibold text-xs sm:text-sm w-auto text-center whitespace-nowrap px-1" data-testid="text-current-month">
                  {headerLabel}
                </span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 sm:h-8 sm:w-8" data-testid="button-next-month">
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setViewMode(viewMode === "compact" ? "expanded" : "compact")}
                title={viewMode === "compact" ? "Expand to single month" : "Collapse to 3 months"}
                data-testid="button-toggle-view"
              >
                {viewMode === "compact" ? <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>
            </div>
            <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-50 border border-green-200 rounded" />
                Available
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-50 border border-blue-200 rounded" />
                Booked
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-50 border border-indigo-200 rounded" />
                Checked In
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-50 border border-red-200 rounded" />
                Blocked
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500" />
                Locked
              </div>
            </div>
          </div>
          {viewMode === "expanded" && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Drag across available dates to quickly create a booking
            </p>
          )}
        </CardHeader>
        <CardContent>
          {pricingLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading pricing data...</div>
          ) : (
            <div className={viewMode === "compact" ? "grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6" : ""}>
              {monthsToShow.map((monthDate) => (
                <MonthGrid
                  key={format(monthDate, "yyyy-MM")}
                  monthDate={monthDate}
                  selectedRoomTypeId={selectedRoomTypeId}
                  basePrice={basePrice}
                  pricingMap={pricingMap}
                  calendarStatus={calendarStatus}
                  localPrices={localPrices}
                  localLocks={localLocks}
                  onPriceChange={handlePriceChange}
                  onToggleLock={handleToggleLock}
                  onProtectedClick={handleProtectedClick}
                  unlockedProtectedDates={unlockedProtectedDates}
                  viewMode={viewMode}
                  dragRange={dragRange}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  statusOnly={isAllRoomTypes}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!protectedDateKey} onOpenChange={(open) => { if (!open) setProtectedDateKey(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Price Change Warning
            </DialogTitle>
            <DialogDescription>
              This date ({protectedDateKey}) currently has a guest who is <strong>{protectedStatusLabel}</strong>.
              Changing the price will affect the existing booking and may reflect on the booking page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason for price change *</Label>
              <Textarea
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                placeholder="Please explain why this price needs to be changed..."
                className="mt-1"
                data-testid="input-price-change-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProtectedDateKey(null)} data-testid="button-cancel-price-change">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmProtectedChange}
              data-testid="button-confirm-price-change"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quickBookDialog} onOpenChange={(open) => { if (!open) handleQuickBookCancel(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Quick Book
            </DialogTitle>
            <DialogDescription>
              Create a new reservation for the selected dates. The room will be temporarily held until you complete or cancel the booking.
            </DialogDescription>
          </DialogHeader>
          {quickBookDates && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Check-in</Label>
                  <div className="font-semibold text-sm" data-testid="text-quick-checkin">{quickBookDates.checkIn}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Check-out</Label>
                  <div className="font-semibold text-sm" data-testid="text-quick-checkout">{quickBookDates.checkOut}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nights</Label>
                  <div className="font-semibold text-sm">{quickBookNights}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Room Type</Label>
                  <div className="font-semibold text-sm">{selectedRoomType?.name}</div>
                </div>
              </div>
              {selectedRoomForBooking && (
                <div>
                  <Label className="text-xs text-muted-foreground">Room</Label>
                  <div className="font-semibold text-sm">Room {selectedRoomForBooking.roomNumber}</div>
                </div>
              )}
              {selectedRoomId === "all" && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  No specific room selected. You will choose a room in the booking wizard.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleQuickBookCancel} data-testid="button-quick-book-cancel">
              Cancel
            </Button>
            <Button onClick={handleQuickBookConfirm} data-testid="button-quick-book-confirm">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Book Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Pricing Update</DialogTitle>
            <DialogDescription>
              Set prices for multiple months or a date range at once. Locked dates will not be overwritten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room Type</Label>
                <Select value={bulkRoomTypeId} onValueChange={(v) => { setBulkRoomTypeId(v); setBulkRoomNumber("all"); }}>
                  <SelectTrigger data-testid="bulk-select-room-type">
                    <SelectValue placeholder="Select Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    {roomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={String(rt.id)}>
                        {rt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Room Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Select value={bulkRoomNumber} onValueChange={setBulkRoomNumber}>
                  <SelectTrigger data-testid="bulk-select-room-number">
                    <SelectValue placeholder="All Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {(bulkRoomTypeId === "all" ? allRooms : allRooms.filter(r => String(r.roomTypeId) === bulkRoomTypeId)).map((room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        Room {room.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Date Selection</Label>
                <div className="flex border rounded-md overflow-hidden ml-auto">
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-medium transition-colors ${bulkDateMode === "months" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setBulkDateMode("months")}
                    data-testid="bulk-mode-months"
                  >
                    By Month
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-medium transition-colors ${bulkDateMode === "range" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setBulkDateMode("range")}
                    data-testid="bulk-mode-range"
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {bulkDateMode === "months" ? (
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border rounded-md p-2">
                  {next12Months.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox
                        checked={bulkMonths.includes(m.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkMonths((prev) => [...prev, m.key]);
                          } else {
                            setBulkMonths((prev) => prev.filter((k) => k !== m.key));
                          }
                        }}
                        data-testid={`bulk-month-${m.key}`}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Input
                      type="date"
                      value={bulkDateFrom}
                      onChange={(e) => setBulkDateFrom(e.target.value)}
                      data-testid="bulk-date-from"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To</Label>
                    <Input
                      type="date"
                      value={bulkDateTo}
                      onChange={(e) => setBulkDateTo(e.target.value)}
                      min={bulkDateFrom}
                      data-testid="bulk-date-to"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weekday Price</Label>
                <Input
                  type="number"
                  value={bulkWeekdayPrice}
                  onChange={(e) => {
                    setBulkWeekdayPrice(e.target.value);
                    if (bulkSamePrice) setBulkWeekendPrice(e.target.value);
                  }}
                  placeholder="e.g. 150"
                  data-testid="input-bulk-weekday-price"
                />
              </div>
              <div>
                <Label>Weekend Price</Label>
                <Input
                  type="number"
                  value={bulkSamePrice ? bulkWeekdayPrice : bulkWeekendPrice}
                  onChange={(e) => setBulkWeekendPrice(e.target.value)}
                  placeholder="e.g. 200"
                  disabled={bulkSamePrice}
                  data-testid="input-bulk-weekend-price"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={bulkSamePrice}
                onCheckedChange={(checked) => {
                  setBulkSamePrice(!!checked);
                  if (checked) setBulkWeekendPrice(bulkWeekdayPrice);
                }}
                data-testid="checkbox-same-price"
              />
              Same price for weekdays and weekends
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)} data-testid="button-bulk-cancel">
              Cancel
            </Button>
            <Button onClick={handleBulkSubmit} disabled={bulkMutation.isPending} data-testid="button-bulk-apply">
              {bulkMutation.isPending ? "Applying..." : "Apply Pricing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{blockAction === "block" ? "Block Rooms" : "Unblock Rooms"}</DialogTitle>
            <DialogDescription>
              {blockAction === "block"
                ? "Select rooms and date range to block. Blocked rooms won't be available for booking."
                : "Select rooms and date range to unblock. Removes blocking for the selected period."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room Type</Label>
              <Select value={blockRoomTypeId} onValueChange={(v) => { setBlockRoomTypeId(v); setSelectedBlockRoomIds([]); }}>
                <SelectTrigger data-testid="block-select-room-type">
                  <SelectValue placeholder="Select Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={String(rt.id)}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Select Rooms</Label>
                {blockFilteredRooms.length > 0 && (
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer ml-auto">
                    <Checkbox
                      checked={selectedBlockRoomIds.length === blockFilteredRooms.length && blockFilteredRooms.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBlockRoomIds(blockFilteredRooms.map((r) => r.id));
                        } else {
                          setSelectedBlockRoomIds([]);
                        }
                      }}
                      data-testid="checkbox-select-all-block"
                    />
                    Select All ({blockFilteredRooms.length})
                  </label>
                )}
              </div>
              {blockFilteredRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                  No rooms found for this room type.
                </p>
              ) : (
                <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 space-y-1">
                  {blockFilteredRooms.map((room) => (
                    <label key={room.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox
                        checked={selectedBlockRoomIds.includes(room.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBlockRoomIds((prev) => [...prev, room.id]);
                          } else {
                            setSelectedBlockRoomIds((prev) => prev.filter((id) => id !== room.id));
                          }
                        }}
                        data-testid={`checkbox-block-room-${room.id}`}
                      />
                      <span>Room {room.roomNumber}</span>
                      <span className="text-muted-foreground text-xs">— {room.roomName || "No name"}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Date Selection</Label>
                <div className="flex border rounded-md overflow-hidden ml-auto">
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-medium transition-colors ${blockDateMode === "months" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setBlockDateMode("months")}
                    data-testid="block-mode-months"
                  >
                    By Month
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-medium transition-colors ${blockDateMode === "range" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setBlockDateMode("range")}
                    data-testid="block-mode-range"
                  >
                    Date Range
                  </button>
                </div>
              </div>

              {blockDateMode === "months" ? (
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                  {next12Months.map((m) => (
                    <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                      <Checkbox
                        checked={blockMonths.includes(m.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBlockMonths((prev) => [...prev, m.key]);
                          } else {
                            setBlockMonths((prev) => prev.filter((k) => k !== m.key));
                          }
                        }}
                        data-testid={`block-month-${m.key}`}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">From</Label>
                    <Input
                      type="date"
                      value={blockDateFrom}
                      onChange={(e) => setBlockDateFrom(e.target.value)}
                      data-testid="block-date-from"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To</Label>
                    <Input
                      type="date"
                      value={blockDateTo}
                      onChange={(e) => setBlockDateTo(e.target.value)}
                      min={blockDateFrom}
                      data-testid="block-date-to"
                    />
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={blockWeekendsOnly}
                onCheckedChange={(checked) => setBlockWeekendsOnly(!!checked)}
                data-testid="checkbox-weekends-only"
              />
              {blockAction === "block" ? "Block weekends only" : "Unblock weekends only"}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)} data-testid="button-block-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleBlockSubmit}
              disabled={blockMutation.isPending || selectedBlockRoomIds.length === 0}
              variant={blockAction === "block" ? "destructive" : "default"}
              data-testid="button-block-confirm"
            >
              {blockMutation.isPending
                ? "Processing..."
                : `${blockAction === "block" ? "Block" : "Unblock"} ${selectedBlockRoomIds.length} Room${selectedBlockRoomIds.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
