import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, DollarSign, FileText, Upload, Calculator } from "lucide-react";
import { differenceInYears } from "date-fns";

export default function AdminStaff({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [staff] = useState([
    { id: 1, name: "John Doe", role: "Manager", salary: 2500, status: "Active", joined: "2023-01-15", advance: 0 },
    { id: 2, name: "Jane Smith", role: "Chef", salary: 1800, status: "Active", joined: "2023-03-10", advance: 200 },
    { id: 3, name: "Mike Johnson", role: "Housekeeping", salary: 1200, status: "Active", joined: "2023-06-01", advance: 0 },
    { id: 4, name: "Emily Davis", role: "Receptionist", salary: 1400, status: "On Leave", joined: "2023-08-20", advance: 0 },
  ]);

  // Form State
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | null>(null);
  
  // Salary Components
  const [basicSalary, setBasicSalary] = useState(0);
  const [transport, setTransport] = useState(0);
  const [hra, setHra] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const totalSalary = basicSalary + transport + hra + allowance;

  useEffect(() => {
    if (dob) {
      const calculatedAge = differenceInYears(new Date(), new Date(dob));
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [dob]);

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Staff Management</h2>
            <p className="text-muted-foreground">Manage employees, salaries, and advances.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Onboard Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Personal Info */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-medium flex items-center gap-2">Personal Information</h3>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors shrink-0">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-[10px]">Photo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input 
                        id="dob" 
                        type="date" 
                        value={dob} 
                        onChange={(e) => setDob(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                        {age !== null ? `${age} Years` : "-"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Role & Salary */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">Role & Compensation</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="chef">Chef</SelectItem>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Joining Date</Label>
                      <Input id="joinDate" type="date" />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Salary Breakdown</Label>
                      <Badge variant="outline" className="bg-background">
                        Total: ${totalSalary.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Basic Pay</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          className="h-8 bg-white"
                          value={basicSalary || ""}
                          onChange={(e) => setBasicSalary(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">HRA</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          className="h-8 bg-white"
                          value={hra || ""}
                          onChange={(e) => setHra(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Transport</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          className="h-8 bg-white"
                          value={transport || ""}
                          onChange={(e) => setTransport(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Other Allowance</Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          className="h-8 bg-white"
                          value={allowance || ""}
                          onChange={(e) => setAllowance(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>ID Proof Upload</Label>
                  <Input type="file" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Onboard Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Salaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">$4,500</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Advances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">$850</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Advance Taken</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>${employee.salary}</TableCell>
                    <TableCell>{employee.joined}</TableCell>
                    <TableCell>
                      {employee.advance > 0 ? (
                        <span className="text-red-600 font-medium">${employee.advance}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View Docs">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Pay Salary">
                          <DollarSign className="h-4 w-4 text-green-600" />
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