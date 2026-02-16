import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Hotel, Plus, LogOut, Building2, MapPin, Mail, Phone } from "lucide-react";

export default function PlatformDashboard() {
  const [, setLocation] = useLocation();
  const [hotels, setHotels] = useState([
    { id: 1, name: "Grand Luxe Hotel", location: "New York, NY", owner: "John Smith", email: "john@grandluxe.com", status: "Active", joined: "2024-01-15" },
    { id: 2, name: "Seaside Resort", location: "Miami, FL", owner: "Sarah Connor", email: "sarah@seaside.com", status: "Active", joined: "2024-02-01" },
    { id: 3, name: "Mountain View Lodge", location: "Aspen, CO", owner: "Mike Ross", email: "mike@lodge.com", status: "Pending", joined: "2024-02-14" },
  ]);

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-xl text-primary">
            <Hotel className="h-6 w-6" />
            <span>LuxeStay SaaS Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as <span className="font-semibold text-foreground">Super Admin</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-primary">Hotel Management</h1>
            <p className="text-muted-foreground">Onboard new hotels and manage subscriptions.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Onboard New Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Onboard New Hotel</DialogTitle>
                <CardDescription>Enter the hotel details to create a new tenant instance.</CardDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary">
                    <Building2 className="h-4 w-4" />
                    Hotel Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hotelName">Hotel Name</Label>
                      <Input id="hotelName" placeholder="e.g. Grand Plaza" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain">Subdomain</Label>
                      <div className="flex items-center">
                        <Input id="domain" placeholder="grand-plaza" className="rounded-r-none" />
                        <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                          .luxestay.com
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" placeholder="Full hotel address" rows={2} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary">
                    <UserCog className="h-4 w-4" /> {/* UserCog is not imported, let's use Mail/Phone instead or define it if needed. Actually it's imported as UserCog below but I used Lucide icon name UserCog in imports? No I used Building2, MapPin etc. Let me check imports. */}
                    {/* Wait, I didn't import UserCog in the top import list. I'll stick to icons I have or add it. */}
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input id="ownerName" placeholder="Full Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="owner@hotel.com" />
                    <p className="text-[0.8rem] text-muted-foreground">
                      An invitation will be sent to this email to set up the owner account.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Hotel Instance</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarded Hotels</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((hotel) => (
                    <TableRow key={hotel.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {hotel.name}
                        </div>
                      </TableCell>
                      <TableCell>{hotel.location}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{hotel.owner}</span>
                          <span className="text-xs text-muted-foreground">{hotel.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{hotel.joined}</TableCell>
                      <TableCell>
                        <Badge variant={hotel.status === "Active" ? "default" : "secondary"}>
                          {hotel.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
// Adding UserCog to imports to fix the missing icon usage
import { UserCog } from "lucide-react";