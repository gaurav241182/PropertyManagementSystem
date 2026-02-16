import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, RefreshCw, BedDouble, Plus } from "lucide-react";

export default function AdminInventory({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [rooms] = useState([
    { id: "101", type: "Standard King", status: "Available", price: 150, platform: "Direct" },
    { id: "102", type: "Standard King", status: "Occupied", price: 150, platform: "Booking.com" },
    { id: "103", type: "Standard Twin", status: "Available", price: 140, platform: "Direct" },
    { id: "201", type: "Deluxe Ocean", status: "Maintenance", price: 250, platform: "-" },
    { id: "202", type: "Deluxe Ocean", status: "Occupied", price: 250, platform: "Direct" },
    { id: "301", type: "Executive Suite", status: "Reserved", price: 450, platform: "Expedia" },
    { id: "302", type: "Executive Suite", status: "Available", price: 450, platform: "Direct" },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case "Occupied": return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case "Reserved": return "bg-amber-100 text-amber-800 hover:bg-amber-100/80";
      case "Maintenance": return "bg-red-100 text-red-800 hover:bg-red-100/80";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Inventory Management</h2>
            <p className="text-muted-foreground">Manage room availability and rates across all platforms.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Booking.com
            </Button>
            {/* Show management buttons for Owner */}
            {role === "owner" && (
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-80">Total Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Occupied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">14</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">2</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Room Status</CardTitle>
                <CardDescription>Real-time view of all room inventory.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Filter rooms..." className="pl-8 w-[200px]" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Room Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rate / Night</TableHead>
                  <TableHead>Source</TableHead>
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
                    <TableCell>
                      <Badge className={getStatusColor(room.status)} variant="secondary">
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${room.price}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{room.platform}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage</Button>
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