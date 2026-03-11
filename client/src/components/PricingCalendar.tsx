import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Save, Lock, Unlock, Layers, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDay, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoomPricing, Room } from "@shared/schema";

interface PricingCalendarProps {
  roomTypes: any[];
}

type DayStatus = "available" | "booked" | "checked_in" | "blocked" | "";

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
}) {
  const [localPrice, setLocalPrice] = useState(price);

  useEffect(() => {
    setLocalPrice(price);
  }, [price]);

  const style = getStatusStyle(roomStatus);
  const isProtected = (roomStatus === "booked" || roomStatus === "checked_in") && !isUnlockedProtected;

  const handleInputClick = () => {
    if (isProtected && !isLocked) {
      onProtectedClick(dateKey);
    }
  };

  return (
    <div
      className={`border rounded-lg p-1 sm:p-2 min-h-[56px] sm:min-h-[80px] flex flex-col gap-0.5 sm:gap-1 transition-colors ${style.bg} ${style.border} ${isLocked ? "opacity-75" : ""}`}
      data-testid={`day-cell-${dateKey}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] sm:text-xs font-bold ${isWeekendDay ? "text-amber-700" : "text-gray-500"}`}>
          {dayNum}
        </span>
        <div className="flex items-center gap-0.5">
          {statusInfo && statusInfo.totalRooms > 1 && (
            <span className="text-[8px] sm:text-[10px] text-muted-foreground hidden sm:inline" data-testid={`status-summary-${dateKey}`}>
              {statusInfo.availableCount}/{statusInfo.totalRooms}
            </span>
          )}
          <button
            onClick={() => onToggleLock(dateKey)}
            className={`p-0.5 rounded hover:bg-gray-100 ${isLocked ? "text-red-500" : "text-gray-300"}`}
            title={isLocked ? "Unlock rate" : "Lock rate"}
            data-testid={`lock-toggle-${dateKey}`}
          >
            {isLocked ? <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Unlock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center">
        <div className="relative w-full">
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-400">$</span>
          <input
            type="number"
            className={`w-full pl-3.5 sm:pl-5 pr-0.5 sm:pr-1 py-0.5 sm:py-1 text-[11px] sm:text-sm font-semibold rounded border text-center ${
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
            onClick={handleInputClick}
            readOnly={isLocked || isProtected}
            data-testid={`price-input-${dateKey}`}
          />
        </div>
      </div>
      {roomStatus && (
        <div className={`text-[8px] sm:text-[10px] text-center font-medium truncate ${style.text}`} data-testid={`status-label-${dateKey}`}>
          {STATUS_LABEL[roomStatus] || roomStatus}
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  monthDate,
  selectedRoomTypeId,
  selectedRoomId,
  basePrice,
  pricingMap,
  calendarStatus,
  localPrices,
  localLocks,
  onPriceChange,
  onToggleLock,
  onProtectedClick,
  unlockedProtectedDates,
}: {
  monthDate: Date;
  selectedRoomTypeId: string;
  selectedRoomId: string;
  basePrice: string;
  pricingMap: Record<string, Record<string, RoomPricing>>;
  calendarStatus: Record<string, CalendarStatusEntry>;
  localPrices: Record<string, string>;
  localLocks: Record<string, boolean>;
  onPriceChange: (dateKey: string, value: string) => void;
  onToggleLock: (dateKey: string) => void;
  onProtectedClick: (dateKey: string) => void;
  unlockedProtectedDates: Set<string>;
}) {
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const firstDayOfWeek = getDay(startDate);
  const emptySlots = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div>
      <div className="text-center font-semibold text-sm sm:text-base mb-2 py-1" data-testid={`text-month-${format(monthDate, "yyyy-MM")}`}>
        {format(monthDate, "MMMM yyyy")}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {DAY_LABELS.map((label) => (
          <div key={label} className={`text-center text-[9px] sm:text-xs font-semibold py-0.5 sm:py-1 ${label === "Sat" || label === "Sun" ? "text-amber-600" : "text-gray-500"}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
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
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PricingCalendar({ roomTypes }: PricingCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
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

  const monthsToShow = useMemo(() => {
    const months: Date[] = [];
    for (let i = 0; i < 3; i++) {
      months.push(addMonths(currentDate, i));
    }
    return months;
  }, [currentDate]);

  useEffect(() => {
    if (roomTypes.length > 0 && !selectedRoomTypeId) {
      setSelectedRoomTypeId(String(roomTypes[0].id));
    }
  }, [roomTypes, selectedRoomTypeId]);

  const { data: allRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const filteredRooms = useMemo(() => {
    if (!selectedRoomTypeId) return [];
    return allRooms.filter(r => String(r.roomTypeId) === selectedRoomTypeId);
  }, [allRooms, selectedRoomTypeId]);

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
    if (selectedRoomTypeId) params.set("roomTypeId", selectedRoomTypeId);
    if (selectedRoomId !== "all") params.set("roomId", selectedRoomId);
    return params.toString();
  }, [dateRange, selectedRoomTypeId, selectedRoomId]);

  const { data: calendarStatus = {} } = useQuery<Record<string, CalendarStatusEntry>>({
    queryKey: ["/api/rooms/calendar-status", calendarStatusParams],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/calendar-status?${calendarStatusParams}`);
      if (!res.ok) throw new Error("Failed to fetch calendar status");
      return res.json();
    },
    enabled: !!selectedRoomTypeId,
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

  const selectedRoomType = roomTypes.find((r) => String(r.id) === selectedRoomTypeId);
  const basePrice = selectedRoomType ? String(selectedRoomType.basePrice || "0") : "0";

  const pricingVersion = useMemo(() => {
    return allPricing.map((p) => `${p.id}:${p.price}:${p.isLocked}`).join(",");
  }, [allPricing]);

  const allMonthsKey = monthsToShow.map(m => format(m, "yyyy-MM")).join(",");

  useEffect(() => {
    if (!selectedRoomTypeId) return;
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

  const handlePrevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

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
      toast({ title: "Bulk Update Complete", description: "Pricing updated for selected months." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleBulkSubmit = () => {
    if (!bulkRoomTypeId || bulkMonths.length === 0 || !bulkWeekdayPrice) {
      toast({ title: "Missing Info", description: "Please select room type, months, and enter prices.", variant: "destructive" });
      return;
    }
    const weekdayP = bulkWeekdayPrice;
    const weekendP = bulkSamePrice ? bulkWeekdayPrice : (bulkWeekendPrice || bulkWeekdayPrice);

    const items: any[] = [];
    bulkMonths.forEach((mk) => {
      const [y, m] = mk.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      monthDays.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const existing = pricingMap[bulkRoomTypeId]?.[dateKey];
        if (existing?.isLocked) return;
        items.push({
          roomTypeId: Number(bulkRoomTypeId),
          date: dateKey,
          price: isWeekend(day) ? weekendP : weekdayP,
          isLocked: false,
        });
      });
    });

    if (items.length === 0) {
      toast({ title: "No Updates", description: "All selected dates are locked.", variant: "destructive" });
      return;
    }
    bulkMutation.mutate(items);
  };

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Select value={selectedRoomTypeId} onValueChange={setSelectedRoomTypeId}>
            <SelectTrigger className="w-[160px] sm:w-[200px] text-xs sm:text-sm" data-testid="select-room-type">
              <SelectValue placeholder="Select Room Type" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((rt) => (
                <SelectItem key={rt.id} value={String(rt.id)} data-testid={`room-type-option-${rt.id}`}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          {selectedRoomType && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              Base: <span className="font-semibold">${basePrice}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBulkRoomTypeId(selectedRoomTypeId);
              setBulkDialogOpen(true);
            }}
            data-testid="button-bulk-update"
          >
            <Layers className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Bulk Update</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || dirtyKeys.size === 0} data-testid="button-save-pricing">
            <Save className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Save Changes</span>
            {dirtyKeys.size > 0 && (
              <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{dirtyKeys.size}</span>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 border rounded-md bg-card p-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 sm:h-8 sm:w-8" data-testid="button-prev-month">
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <span className="font-semibold text-xs sm:text-sm w-auto text-center whitespace-nowrap" data-testid="text-current-month">
                {format(monthsToShow[0], "MMM yyyy")} - {format(monthsToShow[monthsToShow.length - 1], "MMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 sm:h-8 sm:w-8" data-testid="button-next-month">
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
        </CardHeader>
        <CardContent>
          {pricingLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Loading pricing data...</div>
          ) : !selectedRoomTypeId ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">Select a room type to view pricing.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {monthsToShow.map((monthDate) => (
                <MonthGrid
                  key={format(monthDate, "yyyy-MM")}
                  monthDate={monthDate}
                  selectedRoomTypeId={selectedRoomTypeId}
                  selectedRoomId={selectedRoomId}
                  basePrice={basePrice}
                  pricingMap={pricingMap}
                  calendarStatus={calendarStatus}
                  localPrices={localPrices}
                  localLocks={localLocks}
                  onPriceChange={handlePriceChange}
                  onToggleLock={handleToggleLock}
                  onProtectedClick={handleProtectedClick}
                  unlockedProtectedDates={unlockedProtectedDates}
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

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
            <DialogDescription>
              Set prices for multiple months at once. Locked dates will not be overwritten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room Type</Label>
              <Select value={bulkRoomTypeId} onValueChange={setBulkRoomTypeId}>
                <SelectTrigger data-testid="bulk-select-room-type">
                  <SelectValue placeholder="Select Room Type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={String(rt.id)}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Select Months</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weekday Price ($)</Label>
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
                <Label>Weekend Price ($)</Label>
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
              {bulkMutation.isPending ? "Applying..." : `Apply to ${bulkMonths.length} Month${bulkMonths.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
