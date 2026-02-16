import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, BedDouble, Image as ImageIcon, CalendarX, Lock, Unlock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_ROOM_TYPES = [
  { id: "standard_king", name: "Standard King", beds: "1 King Bed", capacity: 2, price: 150, cots: true, infant: true },
  { id: "standard_twin", name: "Standard Twin", beds: "2 Twin Beds", capacity: 2, price: 140, cots: true, infant: true },
  { id: "deluxe_ocean", name: "Deluxe Ocean", beds: "1 King Bed", capacity: 2, price: 250, cots: true, infant: true, balcony: true },
  { id: "executive_suite", name: "Executive Suite", beds: "2 King Beds", capacity: 4, price: 450, cots: true, infant: true, living_area: true },
];

export default function AdminRooms({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [rooms, setRooms] = useState([
    { id: "101", type: "Standard King", status: "Available", price: 150, capacity: 2 },
    { id: "102", type: "Standard King", status: "Occupied", price: 150, capacity: 2 },
    { id: "103", type: "Standard Twin", status: "Available", price: 140, capacity: 2 },
    { id: "201", type: "Deluxe Ocean", status: "Maintenance", price: 250, capacity: 2 },
    { id: "202", type: "Deluxe Ocean", status: "Occupied", price: 250, capacity: 2 },
    { id: "301", type: "Executive Suite", status: "Reserved", price: 450, capacity: 4 },
  ]);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlockingRange, setIsBlockingRange] = useState(false);
  
  // Room Type Configuration State
  const [roomTypes, setRoomTypes] = useState<any[]>(DEFAULT_ROOM_TYPES);
  const [roomType, setRoomType] = useState("");
  const [selectedTypeData, setSelectedTypeData] = useState<any>(null);

  // Load configured room types on mount
  useEffect(() => {
    const savedTypes = localStorage.getItem("roomTypes");
    if (savedTypes) {
      setRoomTypes(JSON.parse(savedTypes));
    }
  }, []);

  // Update selected room type data when roomType changes
  useEffect(() => {
    if (roomType) {
      const found = roomTypes.find(rt => rt.id === roomType);
      setSelectedTypeData(found);
    } else {
      setSelectedTypeData(null);
    }
  }, [roomType, roomTypes]);

  const handleBlockRoom = () => {
    // Logic to update room status would go here
    setBlockDialogOpen(false);
    // Simulate update
    const updatedRooms = rooms.map(r => r.id === selectedRoom.id ? { ...r, status: "Blocked" } : r);
    setRooms(updatedRooms);
  };

  const handleUnblockRoom = (room: any) => {
     const updatedRooms = rooms.map(r => r.id === room.id ? { ...r, status: "Available" } : r);
     setRooms(updatedRooms);
  }

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Room Inventory</h2>
            <p className="text-muted-foreground">Add, update, or remove rooms and manage rates.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <CardDescription>Create a new room in the inventory.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input id="roomNumber" placeholder="e.g. 104" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Room Type</Label>
                    <Select onValueChange={(val) => setRoomType(val)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dynamic Property Details from Configuration */}
                {selectedTypeData && (
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <BedDouble className="h-4 w-4" />
                      Room Properties
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bed Configuration:</span>
                        <span className="font-medium">{selectedTypeData.beds}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Capacity:</span>
                        <span className="font-medium">{selectedTypeData.capacity} Persons</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cot" defaultChecked={selectedTypeData.cots} disabled />
                        <label htmlFor="cot" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Extra Cot Allowed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="infant" defaultChecked={selectedTypeData.infant} disabled />
                        <label htmlFor="infant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Infant Friendly
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price ($/Night)</Label>
                    <Input id="price" type="number" defaultValue={selectedTypeData?.price || ""} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity Override</Label>
                    <Input id="capacity" type="number" placeholder="Optional" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Room features and view..." />
                </div>

                <div className="space-y-2">
                  <Label>Room Photos</Label>
                  <div className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Click to upload photos</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Room</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Block Room Dialog */}
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Room Status: {selectedRoom?.id}</DialogTitle>
                <CardDescription>Block this room for maintenance or other reasons.</CardDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center space-x-2">
                   <Switch id="range-mode" checked={isBlockingRange} onCheckedChange={setIsBlockingRange} />
                   <Label htmlFor="range-mode">Block for specific date range</Label>
                </div>

                {isBlockingRange ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground">
                     Room will be blocked indefinitely until manually unblocked.
                   </p>
                )}
                
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance / Repair</SelectItem>
                      <SelectItem value="cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="reserved">Reserved by Owner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleBlockRoom}>
                  <Lock className="mr-2 h-4 w-4" />
                  Block Room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Rooms</CardTitle>
            <CardDescription>Manage your property's physical inventory.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        {room.id}
                      </div>
                    </TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>{room.capacity} Guests</TableCell>
                    <TableCell>${room.price}</TableCell>
                    <TableCell>
                      <Badge variant={room.status === "Available" ? "outline" : "secondary"} className={room.status === "Blocked" ? "bg-red-100 text-red-800" : ""}>
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {room.status === "Blocked" || room.status === "Maintenance" ? (
                           <Button variant="ghost" size="sm" onClick={() => handleUnblockRoom(room)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                             <Unlock className="h-4 w-4 mr-1" />
                             Unblock
                           </Button>
                        ) : (
                           <Button variant="ghost" size="sm" onClick={() => { setSelectedRoom(room); setBlockDialogOpen(true); }} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                             <CalendarX className="h-4 w-4 mr-1" />
                             Block
                           </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}