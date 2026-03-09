import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Save, Lock, Unlock, Layers } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, getDay, addMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoomPricing } from "@shared/schema";

interface PricingCalendarProps {
  roomTypes: any[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DayCell({
  dateKey,
  dayNum,
  isWeekendDay,
  price,
  isLocked,
  pricingId,
  onChange,
  onToggleLock,
}: {
  dateKey: string;
  dayNum: number;
  isWeekendDay: boolean;
  price: string;
  isLocked: boolean;
  pricingId: number | null;
  onChange: (dateKey: string, value: string) => void;
  onToggleLock: (dateKey: string) => void;
}) {
  const [localPrice, setLocalPrice] = useState(price);

  useEffect(() => {
    setLocalPrice(price);
  }, [price]);

  return (
    <div
      className={`border rounded-lg p-2 min-h-[80px] flex flex-col gap-1 transition-colors ${
        isWeekendDay ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
      } ${isLocked ? "opacity-75" : ""}`}
      data-testid={`day-cell-${dateKey}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${isWeekendDay ? "text-amber-700" : "text-gray-500"}`}>
          {dayNum}
        </span>
        <button
          onClick={() => onToggleLock(dateKey)}
          className={`p-0.5 rounded hover:bg-gray-100 ${isLocked ? "text-red-500" : "text-gray-300"}`}
          title={isLocked ? "Unlock rate" : "Lock rate"}
          data-testid={`lock-toggle-${dateKey}`}
        >
          {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
        </button>
      </div>
      <div className="flex-1 flex items-center">
        <div className="relative w-full">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
          <input
            type="number"
            className={`w-full pl-5 pr-1 py-1 text-sm font-semibold rounded border text-center ${
              isLocked
                ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                : "bg-white focus:outline-none focus:ring-1 focus:ring-primary border-gray-200"
            }`}
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
            onBlur={() => {
              if (localPrice !== price) {
                onChange(dateKey, localPrice);
              }
            }}
            readOnly={isLocked}
            data-testid={`price-input-${dateKey}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function PricingCalendar({ roomTypes }: PricingCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>("");
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});
  const [localLocks, setLocalLocks] = useState<Record<string, boolean>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMonths, setBulkMonths] = useState<string[]>([]);
  const [bulkWeekdayPrice, setBulkWeekdayPrice] = useState("");
  const [bulkWeekendPrice, setBulkWeekendPrice] = useState("");
  const [bulkSamePrice, setBulkSamePrice] = useState(false);
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState<string>("");

  useEffect(() => {
    if (roomTypes.length > 0 && !selectedRoomTypeId) {
      setSelectedRoomTypeId(String(roomTypes[0].id));
    }
  }, [roomTypes, selectedRoomTypeId]);

  const { data: allPricing = [], isLoading: pricingLoading } = useQuery<RoomPricing[]>({
    queryKey: ["/api/room-pricing"],
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

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const pricingVersion = useMemo(() => {
    return allPricing.map((p) => `${p.id}:${p.price}:${p.isLocked}`).join(",");
  }, [allPricing]);

  const monthKey = format(currentDate, "yyyy-MM");

  useEffect(() => {
    if (!selectedRoomTypeId) return;
    const mStart = startOfMonth(currentDate);
    const mEnd = endOfMonth(currentDate);
    const mDays = eachDayOfInterval({ start: mStart, end: mEnd });
    const bp = basePrice;
    const newPrices: Record<string, string> = {};
    const newLocks: Record<string, boolean> = {};
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
    setLocalPrices(newPrices);
    setLocalLocks(newLocks);
    setDirtyKeys(new Set());
  }, [selectedRoomTypeId, monthKey, pricingVersion]);

  const handlePriceChange = useCallback((dateKey: string, value: string) => {
    setLocalPrices((prev) => ({ ...prev, [dateKey]: value }));
    setDirtyKeys((prev) => new Set(prev).add(dateKey));
  }, []);

  const handleToggleLock = useCallback((dateKey: string) => {
    setLocalLocks((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
    setDirtyKeys((prev) => new Set(prev).add(dateKey));
  }, []);

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
    bulkMonths.forEach((monthKey) => {
      const [y, m] = monthKey.split("-").map(Number);
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

  const firstDayOfWeek = getDay(startDate);
  const emptySlots = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={selectedRoomTypeId} onValueChange={setSelectedRoomTypeId}>
            <SelectTrigger className="w-[200px]" data-testid="select-room-type">
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
          {selectedRoomType && (
            <span className="text-sm text-muted-foreground">
              Base: <span className="font-semibold">${basePrice}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setBulkRoomTypeId(selectedRoomTypeId);
              setBulkDialogOpen(true);
            }}
            data-testid="button-bulk-update"
          >
            <Layers className="mr-2 h-4 w-4" /> Bulk Update
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || dirtyKeys.size === 0} data-testid="button-save-pricing">
            <Save className="mr-2 h-4 w-4" /> Save Changes
            {dirtyKeys.size > 0 && (
              <span className="ml-1 bg-white/20 rounded-full px-1.5 text-xs">{dirtyKeys.size}</span>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 border rounded-md bg-card p-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8" data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold w-36 text-center" data-testid="text-current-month">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8" data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded" />
                Weekend
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-red-500" />
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
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_LABELS.map((label) => (
                  <div key={label} className={`text-center text-xs font-semibold py-1 ${label === "Sat" || label === "Sun" ? "text-amber-600" : "text-gray-500"}`}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const weekendDay = isWeekend(day);
                  return (
                    <DayCell
                      key={dateKey}
                      dateKey={dateKey}
                      dayNum={day.getDate()}
                      isWeekendDay={weekendDay}
                      price={localPrices[dateKey] || basePrice}
                      isLocked={localLocks[dateKey] || false}
                      pricingId={pricingMap[selectedRoomTypeId]?.[dateKey]?.id ?? null}
                      onChange={handlePriceChange}
                      onToggleLock={handleToggleLock}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
