import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, BedDouble, Image as ImageIcon, CalendarX, Lock, Unlock, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Room, RoomType, Facility } from "@shared/schema";

export default function AdminRooms({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: roomTypes = [], isLoading: roomTypesLoading } = useQuery<RoomType[]>({
    queryKey: ['/api/room-types'],
  });

  const { data: facilitiesData = [] } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
  });

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlockingRange, setIsBlockingRange] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [roomType, setRoomType] = useState("");
  const [selectedTypeData, setSelectedTypeData] = useState<any>(null);

  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (roomType) {
      const found = roomTypes.find(rt => rt.id === Number(roomType));
      setSelectedTypeData(found);
    } else {
      setSelectedTypeData(null);
    }
  }, [roomType, roomTypes]);

  const getRoomTypeName = (roomTypeId: number) => {
    const rt = roomTypes.find(t => t.id === roomTypeId);
    return rt?.name || "Unknown";
  };

  const getRoomTypeData = (roomTypeId: number) => {
    return roomTypes.find(t => t.id === roomTypeId);
  };

  const createRoomMutation = useMutation({
    mutationFn: async (data: { roomNumber: string; roomTypeId: number; floor: number; status: string }) => {
      await apiRequest('POST', '/api/rooms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setAddDialogOpen(false);
      setNewRoomNumber("");
      setRoomType("");
      setNewRoomFloor(1);
      setNewRoomDescription("");
      toast({ title: "Room Created", description: "New room has been added to the inventory." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Room> }) => {
      await apiRequest('PATCH', `/api/rooms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setEditDialogOpen(false);
      toast({ title: "Room Updated", description: `Room details have been saved.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Room Deleted", description: "Room has been removed from inventory." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleBlockRoom = () => {
    if (!selectedRoom) return;
    setBlockDialogOpen(false);
    updateRoomMutation.mutate({ id: selectedRoom.id, data: { status: "blocked" } });
  };

  const handleUnblockRoom = (room: Room) => {
    updateRoomMutation.mutate({ id: room.id, data: { status: "available" } });
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom({ ...room });
    setEditDialogOpen(true);
  };

  const handleSaveRoom = () => {
    if (!editingRoom) return;
    updateRoomMutation.mutate({
      id: editingRoom.id,
      data: {
        roomNumber: editingRoom.roomNumber,
        roomTypeId: editingRoom.roomTypeId,
        floor: editingRoom.floor,
        status: editingRoom.status,
      },
    });
  };

  const handleCreateRoom = () => {
    if (!newRoomNumber || !roomType) return;
    createRoomMutation.mutate({
      roomNumber: newRoomNumber,
      roomTypeId: Number(roomType),
      floor: newRoomFloor,
      status: "available",
    });
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      available: "Available",
      occupied: "Occupied",
      maintenance: "Maintenance",
      blocked: "Blocked",
      reserved: "Reserved",
    };
    return map[status] || status;
  };

  const isLoading = roomsLoading || roomTypesLoading;

  if (isLoading) {
    return (
      <AdminLayout role={role}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading rooms...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Room Inventory</h2>
            <p className="text-muted-foreground">Add, update, or remove rooms and manage rates.</p>
          </div>
          
          {role === "owner" && (
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setNewRoomNumber("");
                setRoomType("");
                setSelectedTypeData(null);
                setNewRoomFloor(1);
                setNewRoomDescription("");
              }
              setAddDialogOpen(open);
            }}>
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
                    <Input id="roomNumber" placeholder="e.g. 104" value={newRoomNumber} onChange={(e) => setNewRoomNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Room Type</Label>
                    <Select value={roomType} onValueChange={(val) => setRoomType(val)}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={String(rt.id)}>{rt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                      {selectedTypeData.size && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Room Size:</span>
                          <span className="font-medium">{selectedTypeData.size}</span>
                        </div>
                      )}
                    </div>
                    
                    {(() => {
                      const rtFacilityIds: number[] = (() => { try { return JSON.parse(selectedTypeData.facilityIds || "[]"); } catch { return []; } })();
                      const defaultFacilities = facilitiesData.filter((f: any) => f.isDefault && f.active);
                      const allFacilityIds = [...new Set([...rtFacilityIds, ...defaultFacilities.map((f: any) => f.id)])];
                      const assignedFacilities = allFacilityIds.map((id: number) => facilitiesData.find((f: any) => f.id === id && f.active)).filter(Boolean);
                      if (assignedFacilities.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {assignedFacilities.map((f: any) => (
                            <span key={f.id} className={`text-xs px-2 py-1 rounded-md ${f.isFree ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {f.name}{!f.isFree && ` (₹${Number(f.price).toFixed(0)}/${f.unit})`}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price ($/Night)</Label>
                    <Input id="price" type="number" value={selectedTypeData ? Number(selectedTypeData.basePrice) : ""} disabled placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input id="floor" type="number" value={newRoomFloor} onChange={(e) => setNewRoomFloor(parseInt(e.target.value) || 1)} placeholder="1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Room features and view..." value={newRoomDescription} onChange={(e) => setNewRoomDescription(e.target.value)} />
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
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateRoom} disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Room Status: {selectedRoom?.roomNumber}</DialogTitle>
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
                <Button variant="destructive" onClick={handleBlockRoom} disabled={updateRoomMutation.isPending}>
                  <Lock className="mr-2 h-4 w-4" />
                  Block Room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Room Details</DialogTitle>
                <CardDescription>Update configuration for Room {editingRoom?.roomNumber}</CardDescription>
              </DialogHeader>
              {editingRoom && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Number</Label>
                      <Input value={editingRoom.roomNumber} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={editingRoom.status} 
                        onValueChange={(val) => setEditingRoom({...editingRoom, status: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Room Type</Label>
                    <Select 
                      value={String(editingRoom.roomTypeId)} 
                      onValueChange={(val) => {
                         setEditingRoom({...editingRoom, roomTypeId: Number(val)});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={String(rt.id)}>{rt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Price ($/Night)</Label>
                      <Input 
                        type="number" 
                        value={Number(getRoomTypeData(editingRoom.roomTypeId)?.basePrice || 0)} 
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Floor</Label>
                      <Input 
                        type="number" 
                        value={editingRoom.floor} 
                        onChange={(e) => setEditingRoom({...editingRoom, floor: parseInt(e.target.value) || 1})} 
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveRoom} disabled={updateRoomMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateRoomMutation.isPending ? "Saving..." : "Save Changes"}
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
                {rooms.map((room) => {
                  const typeData = getRoomTypeData(room.roomTypeId);
                  return (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        {room.roomNumber}
                      </div>
                    </TableCell>
                    <TableCell>{getRoomTypeName(room.roomTypeId)}</TableCell>
                    <TableCell>{typeData?.capacity || "-"} Guests</TableCell>
                    <TableCell>${typeData ? Number(typeData.basePrice) : 0}</TableCell>
                    <TableCell>
                      <Badge variant={room.status === "available" ? "outline" : "secondary"} className={room.status === "blocked" ? "bg-red-100 text-red-800" : ""}>
                        {getStatusDisplay(room.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {room.status === "blocked" || room.status === "maintenance" ? (
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
                        {role === "owner" && (
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(room)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {role === "owner" && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteRoomMutation.mutate(room.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}