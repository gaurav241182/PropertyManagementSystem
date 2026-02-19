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
import { UserPlus, DollarSign, FileText, Upload, Calculator, Edit, Power, Ban, Trash2, AlertTriangle } from "lucide-react";
import { differenceInYears, isSameMonth, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminStaff({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const [staff, setStaff] = useState([
    { id: 1, name: "John Doe", role: "Manager", salary: 2500, status: "Active", joined: "2023-01-15", advance: 0 },
    { id: 2, name: "Jane Smith", role: "Chef", salary: 1800, status: "Active", joined: "2023-03-10", advance: 200 },
    { id: 3, name: "Mike Johnson", role: "Housekeeping", salary: 1200, status: "Active", joined: "2023-06-01", advance: 0 },
    { id: 4, name: "Emily Davis", role: "Receptionist", salary: 1400, status: "Inactive", joined: "2023-08-20", advance: 0 },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [policeVerification, setPoliceVerification] = useState(false);
  const [welfareFund, setWelfareFund] = useState(false);
  const [bonus, setBonus] = useState(0);

  const [relation, setRelation] = useState("");
  const [nationality, setNationality] = useState("");
  const [state, setState] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [proratedSalary, setProratedSalary] = useState<number | null>(null);

  // Salary Components
  const [basicSalary, setBasicSalary] = useState(0);
  const [transport, setTransport] = useState(0);
  const [hra, setHra] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const totalSalary = basicSalary + transport + hra + allowance;

  // Mock Data for States
  const countries = {
    "American": ["California", "New York", "Texas", "Florida"],
    "Canadian": ["Ontario", "Quebec", "British Columbia"],
    "Indian": ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"],
    "British": ["England", "Scotland", "Wales"]
  };

  const countryCodes = [
     { code: "+1", label: "US/CA" },
     { code: "+44", label: "UK" },
     { code: "+91", label: "IN" },
     { code: "+61", label: "AU" }
  ];

  useEffect(() => {
    if (dob) {
      const calculatedAge = differenceInYears(new Date(), new Date(dob));
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [dob]);

  // Calculate Prorated Salary if joining mid-month
  useEffect(() => {
    if (joiningDate && totalSalary > 0) {
      const join = parseISO(joiningDate);
      const today = new Date();
      
      // If joining in current month
      if (isSameMonth(join, today)) {
         const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
         const dayOfJoining = join.getDate();
         const daysWorked = daysInMonth - dayOfJoining + 1;
         const dailyRate = totalSalary / daysInMonth;
         setProratedSalary(Math.round(dailyRate * daysWorked));
      } else {
        setProratedSalary(null);
      }
    } else {
      setProratedSalary(null);
    }
  }, [joiningDate, totalSalary]);

  // Open dialog for editing
  const handleEdit = (employee: any) => {
    setEditingStaff(employee);
    setFirstName(employee.name.split(" ")[0]);
    setLastName(employee.name.split(" ")[1] || "");
    setEmployeeId(employee.employeeId || `EMP-${employee.id.toString().padStart(4, '0')}`);
    setBasicSalary(employee.salary); // Simplified for mock
    setJoiningDate(employee.joined);
    setWelfareFund(employee.welfareFund || false);
    setBonus(employee.bonus || 0);
    setIsDialogOpen(true);
  };

  // Open dialog for adding
  const handleAdd = () => {
    setEditingStaff(null);
    setFirstName("");
    setLastName("");
    setEmployeeId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setBasicSalary(0);
    setDob("");
    setNationality("");
    setState("");
    setJoiningDate("");
    setWelfareFund(false);
    setBonus(0);
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

  const confirmDelete = () => {
    if (staffToDelete) {
      setStaff(staff.filter(s => s.id !== staffToDelete));
      toast({ 
        title: "Staff Deleted", 
        description: "Employee has been permanently removed.", 
        variant: "destructive" 
      });
      setStaffToDelete(null);
      setIsDeleteAlertOpen(false);
    }
  };

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
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStaff ? "Edit Employee Details" : "Onboard New Employee"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Personal Info */}
                <div className="space-y-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2 text-primary">Personal Information</h3>
                    <Badge variant="outline" className="font-mono">ID: {employeeId}</Badge>
                  </div>
                  
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
                         <Select value={nationality} onValueChange={setNationality}>
                           <SelectTrigger id="nationality">
                             <SelectValue placeholder="Select Nationality" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="American">American</SelectItem>
                             <SelectItem value="Canadian">Canadian</SelectItem>
                             <SelectItem value="Indian">Indian</SelectItem>
                             <SelectItem value="British">British</SelectItem>
                           </SelectContent>
                         </Select>
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
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Contact Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                         <Select value={countryCode} onValueChange={setCountryCode}>
                           <SelectTrigger className="w-[100px]">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {countryCodes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                           </SelectContent>
                         </Select>
                         <Input id="phone" type="tel" placeholder="000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email ID</Label>
                      <Input id="email" type="email" placeholder="john.doe@example.com" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="state">State / Province</Label>
                      <Select value={state} onValueChange={setState} disabled={!nationality}>
                         <SelectTrigger id="state">
                           <SelectValue placeholder="Select State" />
                         </SelectTrigger>
                         <SelectContent>
                           {nationality && countries[nationality as keyof typeof countries]?.map((s) => (
                             <SelectItem key={s} value={s}>{s}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="City Name" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Permanent Address</Label>
                    <Textarea id="address" placeholder="House No, Street, Landmark, Zip Code" className="min-h-[60px]" />
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
                      <Input 
                        id="joinDate" 
                        type="date" 
                        value={joiningDate} 
                        onChange={(e) => setJoiningDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Monthly Salary Breakdown</Label>
                      <Badge variant="outline" className="bg-background font-mono">
                        Total: ${totalSalary.toFixed(2)} / mo
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

                    {/* Welfare & Bonus */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed">
                       <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="welfare" 
                            checked={welfareFund}
                            onCheckedChange={(checked) => setWelfareFund(checked as boolean)}
                          />
                          <Label htmlFor="welfare" className="text-sm font-medium cursor-pointer">Enable Welfare Fund Liability</Label>
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Monthly Bonus (Owner Config)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            className="h-8 bg-white"
                            value={bonus || ""}
                            onChange={(e) => setBonus(Number(e.target.value))}
                          />
                       </div>
                    </div>
                    
                    {/* Pro-rated Salary Warning */}
                    {proratedSalary !== null && (
                      <div className="mt-4 pt-3 border-t border-dashed">
                         <div className="flex items-center justify-between">
                            <Label className="text-amber-700 text-sm">Pro-rated Salary (Current Month)</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Auto-calculated:</span>
                              <Input 
                                className="h-8 w-24 bg-amber-50 border-amber-200"
                                value={proratedSalary}
                                onChange={(e) => setProratedSalary(Number(e.target.value))}
                              />
                            </div>
                         </div>
                         <p className="text-[10px] text-muted-foreground mt-1">
                           *Based on joining date. Will be added to pending salaries.
                         </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t mt-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary mt-2">Verification & Documents</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="idCard">ID Card Number</Label>
                      <Input id="idCard" placeholder="Enter ID Number" />
                    </div>
                     <div className="space-y-2">
                      <Label>ID Proof Document</Label>
                      <Input type="file" />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2 h-full pt-2">
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
                        {role === "owner" && (
                        <Button variant="ghost" size="icon" title="Delete Permanent" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                          setStaffToDelete(employee.id);
                          setIsDeleteAlertOpen(true);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                            setStaffToDelete(employee.id);
                            setIsDeleteAlertOpen(true);
                          }}>
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
        )}
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff record
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}