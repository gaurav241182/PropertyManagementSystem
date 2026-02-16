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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  MapPin, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Power,
  GitBranch,
  Upload,
  User,
  CreditCard,
  Trash2,
  Lock,
  Globe
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

  const [branches, setBranches] = useState([{ name: "", city: "", address: "" }]);

  const addBranch = () => {
    setBranches([...branches, { name: "", city: "", address: "" }]);
  };

  const removeBranch = (index: number) => {
    const newBranches = [...branches];
    newBranches.splice(index, 1);
    setBranches(newBranches);
  };

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
            <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>Onboard New Hotel Partner</DialogTitle>
                <CardDescription>Complete registration for a new tenant account.</CardDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-6 py-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="details">Hotel Details</TabsTrigger>
                    <TabsTrigger value="owner">Owner Profile</TabsTrigger>
                    <TabsTrigger value="branches">Branches & Setup</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Hotel Details */}
                  <TabsContent value="details" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Upload Logo</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Hotel Brand Name</Label>
                          <Input placeholder="e.g. Grand Plaza Hotels" />
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Headquarters Country</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us">United States</SelectItem>
                              <SelectItem value="uk">United Kingdom</SelectItem>
                              <SelectItem value="in">India</SelectItem>
                              <SelectItem value="ae">UAE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Headquarters City</Label>
                          <Input placeholder="e.g. New York" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Registration / Tax ID</Label>
                        <Input placeholder="Business Registration Number" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Owner Profile */}
                  <TabsContent value="owner" className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Owner Full Name</Label>
                          <Input placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Input type="date" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input type="email" placeholder="owner@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>National ID / Passport Number</Label>
                        <Input placeholder="ID Number" />
                      </div>

                      <div className="space-y-2">
                        <Label>ID Document Upload</Label>
                        <div className="border border-input rounded-md p-3 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Upload Passport/ID Copy...</span>
                          <Button variant="outline" size="sm">Browse</Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Branches & Setup */}
                  <TabsContent value="branches" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Hotel Branches
                        </h3>
                        <Button size="sm" variant="outline" onClick={addBranch}>
                          <Plus className="h-3 w-3 mr-1" /> Add Branch
                        </Button>
                      </div>

                      {branches.map((branch, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-muted/10 space-y-3 relative group">
                          {branches.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeBranch(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Branch Name</Label>
                              <Input placeholder="e.g. Downtown Branch" className="h-8" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">City</Label>
                              <Input placeholder="City" className="h-8" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Full Address</Label>
                            <Input placeholder="Address line..." className="h-8" />
                          </div>
                        </div>
                      ))}

                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium flex items-center gap-2 mb-3">
                          <Lock className="h-4 w-4" />
                          Account Access
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Admin Login ID</Label>
                            <Input placeholder="admin_username" />
                          </div>
                          <div className="space-y-2">
                            <Label>Initial Password</Label>
                            <Input type="password" placeholder="••••••••" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
              
              <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                <Button variant="outline">Cancel</Button>
                <Button>Create Hotel Account</Button>
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