import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Save, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { addDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PricingCalendarProps {
  roomTypes: any[];
}

export default function PricingCalendar({ roomTypes }: PricingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({});
  const [availability, setAvailability] = useState<Record<string, Record<string, number>>>({});

  // Generate days for the current month view
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Mock initial data (if empty)
  if (Object.keys(prices).length === 0) {
    const initialPrices: Record<string, Record<string, number>> = {};
    const initialAvail: Record<string, Record<string, number>> = {};
    
    roomTypes.forEach(room => {
      initialPrices[room.id] = {};
      initialAvail[room.id] = {};
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        // Higher prices on weekends
        initialPrices[room.id][dateKey] = isWeekend(day) ? room.price * 1.2 : room.price;
        initialAvail[room.id][dateKey] = Math.floor(Math.random() * room.capacity) + 1; // Random availability
      });
    });
    setPrices(initialPrices);
    setAvailability(initialAvail);
  }

  const updatePrice = (roomId: string, date: string, newPrice: number) => {
    setPrices(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        [date]: newPrice
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-md bg-card p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold w-32 text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Sync OTA Rates
          </Button>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">Bulk Update</Button>
           <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky left-0 bg-background z-20 border-r">Room Type</TableHead>
              {days.map(day => (
                <TableHead key={day.toString()} className={`text-center min-w-[80px] border-r ${isWeekend(day) ? 'bg-muted/50' : ''}`}>
                  <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                  <div className="font-bold">{format(day, "d")}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomTypes.map(room => (
              <TableRow key={room.id}>
                <TableCell className="sticky left-0 bg-background z-10 border-r font-medium">
                  <div className="flex flex-col">
                    <span>{room.name}</span>
                    <span className="text-xs text-muted-foreground">Base: ${room.price}</span>
                  </div>
                </TableCell>
                {days.map(day => {
                   const dateKey = format(day, 'yyyy-MM-dd');
                   const price = prices[room.id]?.[dateKey] || room.price;
                   const avail = availability[room.id]?.[dateKey] || 0;
                   const isSoldOut = avail === 0;

                   return (
                    <TableCell key={dateKey} className={`p-1 border-r text-center ${isWeekend(day) ? 'bg-muted/20' : ''}`}>
                      <div className={`rounded p-1 ${isSoldOut ? 'bg-red-100' : 'hover:bg-accent group transition-colors'}`}>
                        <input 
                          type="number" 
                          className="w-full text-center bg-transparent text-sm font-semibold focus:outline-none focus:bg-white rounded h-6"
                          value={Math.round(price)}
                          onChange={(e) => updatePrice(room.id, dateKey, Number(e.target.value))}
                        />
                        <div className="text-[10px] flex justify-center items-center gap-1 mt-1">
                          <span className={`${isSoldOut ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                            {isSoldOut ? 'SOLD' : `${avail} left`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                   );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex gap-4 text-sm text-muted-foreground mt-2">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-red-100 rounded"></div> Sold Out
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 bg-muted/50 rounded"></div> Weekend Pricing
         </div>
      </div>
    </div>
  );
}