import { useState } from "react";
import PlatformLayout from "@/components/layout/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Power,
  GitBranch
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PlatformHotels() {
  const [hotels, setHotels] = useState([
    { id: 1, name: "Grand Luxe Hotel", branches: 3, location: "New York, NY", owner: "John Smith", plan: "Enterprise", status: "Active", revenue: "$12,450" },
    { id: 2, name: "Seaside Resort", branches: 1, location: "Miami, FL", owner: "Sarah Connor", plan: "Professional", status: "Active", revenue: "$8,200" },
    { id: 3, name: "Mountain View Lodge", branches: 2, location: "Aspen, CO", owner: "Mike Ross", plan: "Starter", status: "Suspended", revenue: "$0" },
    { id: 4, name: "City Center Inn", branches: 5, location: "Chicago, IL", owner: "Jessica Pearson", plan: "Enterprise", status: "Active", revenue: "$18,900" },
  ]);

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Hotels & Branches</h2>
            <p className="text-muted-foreground">Manage hotel accounts, subscriptions, and branch configurations.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Onboard New Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Onboard New Hotel</DialogTitle>
                <CardDescription>Create a new tenant account and initial branch.</CardDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary">
                    <Building2 className="h-4 w-4" />
                    Hotel Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hotel Group Name</Label>
                      <Input placeholder="e.g. Grand Plaza Group" />
                    </div>
                    <div className="space-y-2">
                      <Label>Subscription Plan</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter ($49/mo)</SelectItem>
                          <SelectItem value="pro">Professional ($149/mo)</SelectItem>
                          <SelectItem value="enterprise">Enterprise ($499/mo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary">
                    <GitBranch className="h-4 w-4" />
                    Main Branch Details
                  </h3>
                  <div className="space-y-2">
                    <Label>Branch Name</Label>
                    <Input placeholder="e.g. Grand Plaza - Downtown" />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Textarea placeholder="Full address..." rows={2} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Hotels</CardTitle>
                <CardDescription>List of all registered hotel groups.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search hotels, owners, or locations..." className="pl-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel Name</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Main Location</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue (MTD)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {hotel.name.substring(0, 2)}
                        </div>
                        {hotel.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <GitBranch className="h-3 w-3" />
                        {hotel.branches}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {hotel.location}
                      </div>
                    </TableCell>
                    <TableCell>{hotel.owner}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{hotel.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hotel.status === "Active" ? "default" : "destructive"} className={hotel.status === "Active" ? "bg-green-600 hover:bg-green-700" : ""}>
                        {hotel.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{hotel.revenue}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Login as Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <GitBranch className="mr-2 h-4 w-4" />
                            Manage Branches
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Power className="mr-2 h-4 w-4" />
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}