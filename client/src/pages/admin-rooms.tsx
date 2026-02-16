import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, BedDouble, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminRooms({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [rooms, setRooms] = useState([
    { id: "101", type: "Standard King", status: "Available", price: 150, capacity: 2 },
    { id: "102", type: "Standard King", status: "Occupied", price: 150, capacity: 2 },
    { id: "103", type: "Standard Twin", status: "Available", price: 140, capacity: 2 },
    { id: "201", type: "Deluxe Ocean", status: "Maintenance", price: 250, capacity: 2 },
    { id: "202", type: "Deluxe Ocean", status: "Occupied", price: 250, capacity: 2 },
    { id: "301", type: "Executive Suite", status: "Reserved", price: 450, capacity: 4 },
  ]);

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
            <DialogContent className="sm:max-w-[600px]">
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
                    <Select>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard_king">Standard King</SelectItem>
                        <SelectItem value="standard_twin">Standard Twin</SelectItem>
                        <SelectItem value="deluxe_ocean">Deluxe Ocean</SelectItem>
                        <SelectItem value="executive_suite">Executive Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Base Price ($/Night)</Label>
                    <Input id="price" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Max Capacity</Label>
                    <Input id="capacity" type="number" placeholder="2" />
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
                      <Badge variant={room.status === "Available" ? "outline" : "secondary"}>
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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