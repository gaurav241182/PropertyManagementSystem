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
import { UserPlus, DollarSign, FileText, Upload, Calculator, Edit, Power, Ban } from "lucide-react";
import { differenceInYears } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AdminStaff({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const [staff, setStaff] = useState([
    { id: 1, name: "John Doe", role: "Manager", salary: 2500, status: "Active", joined: "2023-01-15", advance: 0 },
    { id: 2, name: "Jane Smith", role: "Chef", salary: 1800, status: "Active", joined: "2023-03-10", advance: 200 },
    { id: 3, name: "Mike Johnson", role: "Housekeeping", salary: 1200, status: "Active", joined: "2023-06-01", advance: 0 },
    { id: 4, name: "Emily Davis", role: "Receptionist", salary: 1400, status: "Inactive", joined: "2023-08-20", advance: 0 },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [policeVerification, setPoliceVerification] = useState(false);
  const [relation, setRelation] = useState("");
  
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

  // Open dialog for editing
  const handleEdit = (employee: any) => {
    setEditingStaff(employee);
    setFirstName(employee.name.split(" ")[0]);
    setLastName(employee.name.split(" ")[1] || "");
    setBasicSalary(employee.salary); // Simplified for mock
    setIsDialogOpen(true);
  };

  // Open dialog for adding
  const handleAdd = () => {
    setEditingStaff(null);
    setFirstName("");
    setLastName("");
    setBasicSalary(0);
    setDob("");
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    setStaff(staff.map(s => s.id === id ? { ...s, status: newStatus } : s));
    
    toast({
      title: `Staff ${newStatus === "Active" ? "Activated" : "Deactivated"}`,
      description: `Employee status has been updated to ${newStatus}.`,
      variant: newStatus === "Active" ? "default" : "destructive",
    });
  };

  const activeStaff = staff.filter(s => s.status !== "Inactive");
  const inactiveStaff = staff.filter(s => s.status === "Inactive");

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Staff Management</h2>
            <p className="text-muted-foreground">Manage employees, salaries, and advances.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <UserPlus className="mr-2 h-4 w-4" />
                Onboard Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStaff ? "Edit Employee Details" : "Onboard New Employee"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Personal Info */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Personal Information</h3>
                  
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-24 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors shrink-0 mt-1">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-[10px]">Photo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="gender">Gender</Label>
                         <Select>
                           <SelectTrigger id="gender">
                             <SelectValue placeholder="Select" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="male">Male</SelectItem>
                             <SelectItem value="female">Female</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="nationality">Nationality</Label>
                         <Input id="nationality" placeholder="e.g. American" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                     <div className="space-y-2">
                      <Label htmlFor="idCard">ID Card No. (Optional)</Label>
                      <Input id="idCard" placeholder="SSN / Passport / ID" />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Contact Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altPhone">Alternate Phone (Optional)</Label>
                      <Input id="altPhone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email ID</Label>
                      <Input id="email" type="email" placeholder="john.doe@example.com" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Input id="state" placeholder="California" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Permanent Address</Label>
                    <Textarea id="address" placeholder="House No, Street, City, Zip Code" className="min-h-[60px]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-md border border-red-100">
                     <div className="col-span-2">
                        <Label className="text-red-800 font-semibold">Emergency Contact (Mandatory)</Label>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="emergencyName" className="text-red-700">Contact Person Name</Label>
                        <Input id="emergencyName" className="bg-white" placeholder="Name" />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="emergencyRelation" className="text-red-700">Relation</Label>
                        <Select value={relation} onValueChange={setRelation}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem>
                            <SelectItem value="Children">Children</SelectItem>
                            <SelectItem value="Guardian">Guardian</SelectItem>
                            <SelectItem value="Friend">Friend</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2 col-span-2">
                        <Label htmlFor="emergencyPhone" className="text-red-700">Contact Number</Label>
                        <Input id="emergencyPhone" className="bg-white" type="tel" placeholder="Phone" />
                     </div>
                  </div>
                </div>
                
                {/* Role & Salary */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Role & Compensation</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Job Role</Label>
                      <Select>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="chef">Chef</SelectItem>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
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
                      <Badge variant="outline" className="bg-background font-mono">
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

                <div className="space-y-4 pt-2 border-t mt-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary mt-2">Verification & Documents</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label>ID Proof Document</Label>
                      <Input type="file" />
                    </div>
                    <div className="flex items-center space-x-2 h-full pt-6">
                      <Checkbox 
                        id="policeVerification" 
                        checked={policeVerification}
                        onCheckedChange={(checked) => setPoliceVerification(checked as boolean)}
                      />
                      <label
                        htmlFor="policeVerification"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Police Verification Completed
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button>{editingStaff ? "Update Details" : "Onboard Employee"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStaff.length}</div>
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
            <CardTitle>Active Staff Directory</CardTitle>
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
                {activeStaff.map((employee) => (
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
                      <Badge className="bg-green-600 hover:bg-green-700">
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Edit Details" onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Deactivate Staff" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleToggleStatus(employee.id, employee.status)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {activeStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No active staff members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Deactivated Staff Section */}
        {inactiveStaff.length > 0 && (
          <Card className="bg-muted/20 border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Deactivated / Past Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Employee</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Last Salary</TableHead>
                    <TableHead className="text-muted-foreground">Joined</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-muted-foreground opacity-75">
                  {inactiveStaff.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 grayscale opacity-70">
                            <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>${employee.salary}</TableCell>
                      <TableCell>{employee.joined}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" onClick={() => handleToggleStatus(employee.id, employee.status)}>
                            <Power className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}