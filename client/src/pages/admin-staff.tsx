import { useState, useEffect, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, DollarSign, FileText, Upload, Calculator, Edit, Power, Ban, Trash2, AlertTriangle, Loader2, Camera } from "lucide-react";
import { differenceInYears, isSameMonth, parseISO, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

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

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥", CNY: "¥", AED: "د.إ", SGD: "S$",
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency || "$";
}

function generateEmployeeIdPrefix(hotelName: string): string {
  if (!hotelName) return "EMP";
  const words = hotelName.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.map(w => w[0]).join("").toUpperCase().substring(0, 3);
}

function getNextEmployeeId(prefix: string, existingStaff: any[]): string {
  let maxNum = 0;
  for (const s of existingStaff) {
    const eid = s.employeeId || "";
    const match = eid.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
}

function getMaxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 14);
  return d.toISOString().split("T")[0];
}

export default function AdminStaff({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: staffData = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/staff'] });
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const { data: hotelsData = [] } = useQuery<any[]>({ queryKey: ['/api/hotels'] });

  const currency = (settingsData as Record<string, string>)?.currency || "USD";
  const cs = getCurrencySymbol(currency);

  const currentHotel = useMemo(() => {
    if (user?.hotelId) {
      return hotelsData.find((h: any) => h.id === user.hotelId);
    }
    return hotelsData[0];
  }, [hotelsData, user]);

  const empIdPrefix = useMemo(() => generateEmployeeIdPrefix(currentHotel?.name || ""), [currentHotel]);

  const staff = staffData.map((s: any) => ({
    ...s,
    salary: Number(s.salary) || 0,
    bonusAmount: Number(s.bonusAmount) || 0,
    joined: s.joinDate,
    advance: 0,
    status: s.status === "active" ? "Active" : "Inactive",
  }));

  const addStaffMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: "Staff Added", description: "New employee has been onboarded successfully." });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/staff/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: "Staff Updated", description: "Employee details have been updated." });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: "Staff Deleted", description: "Employee has been permanently removed.", variant: "destructive" });
      setStaffToDelete(null);
      setIsDeleteAlertOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/platform-users", data),
    onError: (error: any) => {
      toast({ title: "Login creation failed", description: error.message, variant: "destructive" });
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState("");
  const [policeVerification, setPoliceVerification] = useState(false);
  const [welfareFund, setWelfareFund] = useState(false);
  const [bonus, setBonus] = useState(0);

  const [staffRole, setStaffRole] = useState("Staff");
  const [relation, setRelation] = useState("");
  const [nationality, setNationality] = useState("");
  const [state, setState] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [proratedSalary, setProratedSalary] = useState<number | null>(null);

  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [createLogin, setCreateLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");

  const [basicSalary, setBasicSalary] = useState(0);
  const [transport, setTransport] = useState(0);
  const [hra, setHra] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const totalSalary = basicSalary + transport + hra + allowance;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const countries: Record<string, string[]> = {
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

  useEffect(() => {
    if (joiningDate && totalSalary > 0) {
      const join = parseISO(joiningDate);
      const today = new Date();
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Photo must be under 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/[^a-zA-Z\s'-]/g, "");
    setter(cleaned);
  };

  const handlePhoneInput = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setPhone(cleaned);
  };

  const handleEmergencyPhoneInput = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setEmergencyPhone(cleaned);
  };

  const handleEdit = (employee: any) => {
    setEditingStaff(employee);
    setFirstName(employee.name.split(" ")[0]);
    setLastName(employee.name.split(" ")[1] || "");
    setEmployeeId(employee.employeeId || `${empIdPrefix}-${employee.id.toString().padStart(4, '0')}`);
    setBasicSalary(employee.salary);
    setStaffRole(employee.role || "Staff");
    setJoiningDate(employee.joined);
    setWelfareFund(employee.welfareEnabled || false);
    setBonus(employee.bonusAmount || 0);
    setPhotoPreview(null);
    setCreateLogin(false);
    setLoginPassword("");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setFirstName("");
    setLastName("");
    setEmployeeId(getNextEmployeeId(empIdPrefix, staffData));
    setBasicSalary(0);
    setTransport(0);
    setHra(0);
    setAllowance(0);
    setStaffRole("Staff");
    setGender("");
    setDob("");
    setNationality("");
    setState("");
    setCity("");
    setAddress("");
    setPhone("");
    setEmail("");
    setCountryCode("+1");
    setJoiningDate("");
    setWelfareFund(false);
    setBonus(0);
    setPoliceVerification(false);
    setRelation("");
    setEmergencyName("");
    setEmergencyRelation("");
    setEmergencyPhone("");
    setIdCardNumber("");
    setPhotoPreview(null);
    setCreateLogin(false);
    setLoginPassword("");
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "inactive" : "active";
    updateStaffMutation.mutate({ id, data: { status: newStatus } });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!gender) errors.gender = "Gender is required";
    if (!nationality) errors.nationality = "Nationality is required";
    if (!dob) errors.dob = "Date of birth is required";
    if (age !== null && age < 14) errors.dob = "Minimum age is 14 years";
    if (!phone.trim() || phone.length < 7) errors.phone = "Valid phone number is required";
    if (!state) errors.state = "State is required";
    if (!city.trim()) errors.city = "City is required";
    if (!address.trim()) errors.address = "Address is required";
    if (!staffRole) errors.staffRole = "Job role is required";
    if (!joiningDate) errors.joiningDate = "Joining date is required";
    if (totalSalary <= 0) errors.salary = "Salary must be greater than 0";
    if (createLogin) {
      if (!email.trim()) errors.email = "Email is required for login creation";
      if (!loginPassword || loginPassword.length < 6) errors.loginPassword = "Password must be at least 6 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fill all required fields correctly.", variant: "destructive" });
      return;
    }

    const staffPayload = {
      employeeId: employeeId,
      name: `${firstName} ${lastName}`.trim(),
      role: staffRole,
      email: email,
      phone: `${countryCode}${phone}`,
      salary: String(totalSalary),
      joinDate: joiningDate || new Date().toISOString().split('T')[0],
      status: "active",
      welfareEnabled: welfareFund,
      bonusEnabled: bonus > 0,
      bonusAmount: String(bonus),
    };

    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data: staffPayload });
    } else {
      addStaffMutation.mutate(staffPayload);
      if (createLogin && email.trim() && loginPassword) {
        createUserMutation.mutate({
          name: `${firstName} ${lastName}`.trim(),
          email: email,
          password: loginPassword,
          role: "staff",
          hotelId: user?.hotelId || currentHotel?.id || null,
          status: "Active",
        });
      }
    }
  };

  const activeStaff = staff.filter(s => s.status !== "Inactive");
  const inactiveStaff = staff.filter(s => s.status === "Inactive");

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete);
    }
  };

  const Req = () => <span className="text-red-500">*</span>;
  const FieldError = ({ field }: { field: string }) => formErrors[field] ? <p className="text-red-500 text-xs mt-1">{formErrors[field]}</p> : null;

  return (
    <AdminLayout role={role}>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">Staff Management</h2>
            <p className="text-muted-foreground">Manage employees, salaries, and advances.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} data-testid="button-onboard-staff">
                <UserPlus className="mr-2 h-4 w-4" />
                Onboard Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStaff ? "Edit Employee Details" : "Onboard New Employee"}</DialogTitle>
                <DialogDescription>
                  {editingStaff ? "Update employee information." : "Fill in the details to register a new staff member. Fields marked with * are mandatory."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2 text-primary">Personal Information</h3>
                    <Badge variant="outline" className="font-mono" data-testid="text-employee-id">ID: {employeeId}</Badge>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div 
                      className="h-24 w-24 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors shrink-0 mt-1 overflow-hidden relative"
                      onClick={() => photoInputRef.current?.click()}
                      data-testid="button-photo-upload"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Staff photo" className="h-full w-full object-cover" />
                      ) : (
                        <>
                          <Camera className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Photo</span>
                        </>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        data-testid="input-photo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name <Req /></Label>
                        <Input 
                          id="firstName" 
                          placeholder="John" 
                          value={firstName} 
                          onChange={e => handleNameInput(e.target.value, setFirstName)} 
                          className={formErrors.firstName ? "border-red-500" : ""}
                          data-testid="input-first-name"
                        />
                        <FieldError field="firstName" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name <Req /></Label>
                        <Input 
                          id="lastName" 
                          placeholder="Doe" 
                          value={lastName} 
                          onChange={e => handleNameInput(e.target.value, setLastName)} 
                          className={formErrors.lastName ? "border-red-500" : ""}
                          data-testid="input-last-name"
                        />
                        <FieldError field="lastName" />
                      </div>
                      <div className="space-y-2">
                         <Label htmlFor="gender">Gender <Req /></Label>
                         <Select value={gender} onValueChange={setGender}>
                           <SelectTrigger id="gender" className={formErrors.gender ? "border-red-500" : ""} data-testid="select-gender">
                             <SelectValue placeholder="Select" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="male">Male</SelectItem>
                             <SelectItem value="female">Female</SelectItem>
                             <SelectItem value="other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                         <FieldError field="gender" />
                      </div>
                       <div className="space-y-2">
                         <Label htmlFor="nationality">Nationality <Req /></Label>
                         <Select value={nationality} onValueChange={(val) => { setNationality(val); setState(""); }}>
                           <SelectTrigger id="nationality" className={formErrors.nationality ? "border-red-500" : ""} data-testid="select-nationality">
                             <SelectValue placeholder="Select Nationality" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="American">American</SelectItem>
                             <SelectItem value="Canadian">Canadian</SelectItem>
                             <SelectItem value="Indian">Indian</SelectItem>
                             <SelectItem value="British">British</SelectItem>
                           </SelectContent>
                         </Select>
                         <FieldError field="nationality" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth <Req /></Label>
                      <Input 
                        id="dob" 
                        type="date" 
                        value={dob} 
                        max={getMaxDob()}
                        onChange={(e) => setDob(e.target.value)} 
                        className={formErrors.dob ? "border-red-500" : ""}
                        data-testid="input-dob"
                      />
                      <FieldError field="dob" />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground" data-testid="text-age">
                        {age !== null ? `${age} Years` : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Contact Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <Req /></Label>
                      <div className="flex gap-2">
                         <Select value={countryCode} onValueChange={setCountryCode}>
                           <SelectTrigger className="w-[100px]" data-testid="select-country-code">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {countryCodes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                           </SelectContent>
                         </Select>
                         <Input 
                           id="phone" 
                           type="tel" 
                           placeholder="9876543210" 
                           value={phone} 
                           onChange={e => handlePhoneInput(e.target.value)} 
                           maxLength={15}
                           className={formErrors.phone ? "border-red-500" : ""}
                           data-testid="input-phone"
                         />
                      </div>
                      <FieldError field="phone" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email ID</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john.doe@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className={formErrors.email ? "border-red-500" : ""}
                        data-testid="input-email"
                      />
                      <FieldError field="email" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="state">State / Province <Req /></Label>
                      <Select value={state} onValueChange={setState} disabled={!nationality}>
                         <SelectTrigger id="state" className={formErrors.state ? "border-red-500" : ""} data-testid="select-state">
                           <SelectValue placeholder="Select State" />
                         </SelectTrigger>
                         <SelectContent>
                           {nationality && countries[nationality]?.map((s) => (
                             <SelectItem key={s} value={s}>{s}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FieldError field="state" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City <Req /></Label>
                      <Input 
                        id="city" 
                        placeholder="City Name" 
                        value={city} 
                        onChange={e => setCity(e.target.value)} 
                        className={formErrors.city ? "border-red-500" : ""}
                        data-testid="input-city"
                      />
                      <FieldError field="city" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Permanent Address <Req /></Label>
                    <Textarea 
                      id="address" 
                      placeholder="House No, Street, Landmark, Zip Code" 
                      className={`min-h-[60px] ${formErrors.address ? "border-red-500" : ""}`} 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      data-testid="input-address"
                    />
                    <FieldError field="address" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-md border border-red-100">
                     <div className="col-span-2">
                        <Label className="text-red-800 font-semibold">Emergency Contact (Optional)</Label>
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="emergencyName" className="text-red-700">Contact Person Name</Label>
                        <Input id="emergencyName" className="bg-white" placeholder="Name" value={emergencyName} onChange={e => handleNameInput(e.target.value, setEmergencyName)} data-testid="input-emergency-name" />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="emergencyRelation" className="text-red-700">Relation</Label>
                        <Select value={emergencyRelation} onValueChange={setEmergencyRelation}>
                          <SelectTrigger className="bg-white" data-testid="select-emergency-relation">
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
                        <Input id="emergencyPhone" className="bg-white" type="tel" placeholder="Phone" value={emergencyPhone} onChange={e => handleEmergencyPhoneInput(e.target.value)} data-testid="input-emergency-phone" />
                     </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Role & Compensation</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Job Role <Req /></Label>
                      <Select value={staffRole} onValueChange={setStaffRole}>
                        <SelectTrigger id="role" className={formErrors.staffRole ? "border-red-500" : ""} data-testid="select-role">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Receptionist">Receptionist</SelectItem>
                          <SelectItem value="Kitchen">Kitchen / Chef</SelectItem>
                          <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Staff">General Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError field="staffRole" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Joining Date <Req /></Label>
                      <Input 
                        id="joinDate" 
                        type="date" 
                        value={joiningDate} 
                        onChange={(e) => setJoiningDate(e.target.value)} 
                        className={formErrors.joiningDate ? "border-red-500" : ""}
                        data-testid="input-join-date"
                      />
                      <FieldError field="joiningDate" />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Monthly Salary Breakdown <Req /></Label>
                      <Badge variant="outline" className="bg-background font-mono" data-testid="text-total-salary">
                        Total: {cs}{totalSalary.toFixed(2)} / mo
                      </Badge>
                    </div>
                    {formErrors.salary && <p className="text-red-500 text-xs">{formErrors.salary}</p>}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Basic Pay <Req /></Label>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          className="h-8 bg-white"
                          value={basicSalary || ""}
                          onChange={(e) => setBasicSalary(Number(e.target.value))}
                          data-testid="input-basic-salary"
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
                          data-testid="input-hra"
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
                          data-testid="input-transport"
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
                          data-testid="input-allowance"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed">
                       <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="welfare" 
                            checked={welfareFund}
                            onCheckedChange={(checked) => setWelfareFund(checked as boolean)}
                            data-testid="checkbox-welfare"
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
                            data-testid="input-bonus"
                          />
                       </div>
                    </div>
                    
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
                                data-testid="input-prorated-salary"
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
                      <Input id="idCard" placeholder="Enter ID Number" value={idCardNumber} onChange={e => setIdCardNumber(e.target.value)} data-testid="input-id-card" />
                    </div>
                     <div className="space-y-2">
                      <Label>ID Proof Document</Label>
                      <Input type="file" data-testid="input-id-document" />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2 h-full pt-2">
                      <Checkbox 
                        id="policeVerification" 
                        checked={policeVerification}
                        onCheckedChange={(checked) => setPoliceVerification(checked as boolean)}
                        data-testid="checkbox-police-verification"
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

                {!editingStaff && (
                  <div className="space-y-4 pt-2 border-t mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2 text-primary">Login Access</h3>
                        <p className="text-xs text-muted-foreground mt-1">Optionally create a system login for this employee</p>
                      </div>
                      <Switch 
                        checked={createLogin} 
                        onCheckedChange={setCreateLogin} 
                        data-testid="switch-create-login"
                      />
                    </div>
                    
                    {createLogin && (
                      <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <div className="space-y-2">
                          <Label className="text-blue-700">Login ID (Email) <Req /></Label>
                          <Input 
                            type="email" 
                            placeholder="john.doe@example.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className={`bg-white ${formErrors.email ? "border-red-500" : ""}`}
                            data-testid="input-login-email"
                          />
                          <FieldError field="email" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-blue-700">Password <Req /></Label>
                          <Input 
                            type="password" 
                            placeholder="Minimum 6 characters" 
                            value={loginPassword} 
                            onChange={e => setLoginPassword(e.target.value)} 
                            className={`bg-white ${formErrors.loginPassword ? "border-red-500" : ""}`}
                            data-testid="input-login-password"
                          />
                          <FieldError field="loginPassword" />
                        </div>
                        <p className="text-xs text-blue-600 col-span-2">This employee will be able to log in with their email and the password set above.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button 
                  disabled={addStaffMutation.isPending || updateStaffMutation.isPending}
                  onClick={handleSubmit}
                  data-testid="button-submit-staff"
                >
                  {(addStaffMutation.isPending || updateStaffMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStaff ? "Update Details" : "Onboard Employee"}
                </Button>
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
              <div className="text-2xl font-bold" data-testid="text-active-staff-count">{activeStaff.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Salaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-salaries">{cs}{activeStaff.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Advances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-active-advances">{cs}0</div>
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
                  <TableRow key={employee.id} data-testid={`row-staff-${employee.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{employee.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{cs}{employee.salary}</TableCell>
                    <TableCell>{employee.joined}</TableCell>
                    <TableCell>
                      {employee.advance > 0 ? (
                        <span className="text-red-600 font-medium">{cs}{employee.advance}</span>
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
                        <Button variant="ghost" size="icon" title="Edit Details" onClick={() => handleEdit(employee)} data-testid={`button-edit-staff-${employee.id}`}>
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
                    <TableRow key={employee.id} data-testid={`row-inactive-staff-${employee.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 grayscale opacity-70">
                            <AvatarFallback>{employee.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>{cs}{employee.salary}</TableCell>
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
      )}

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
