import { useState, useEffect, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Power, Ban, Trash2, AlertTriangle, Loader2, Camera, Eye, Calculator, LogOut, MoreVertical, Users, DollarSign, Archive, FileText, Upload, Download, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { differenceInYears, isSameMonth, parseISO } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { getCurrencySymbol } from "@/hooks/use-hotel-settings";

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

function generateEmployeeIdPrefix(hotelName: string): string {
  if (!hotelName) return "EMP";
  const words = hotelName.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
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

export default function AdminStaff({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: staffData = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/staff'] });
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const { data: hotelsData = [] } = useQuery<any[]>({ queryKey: ['/api/hotels'] });
  const { data: branchesData = [] } = useQuery<any[]>({ queryKey: ['/api/branches'] });
  const { data: hotelRoles = [] } = useQuery<any[]>({ queryKey: ['/api/hotel-roles'] });

  const currency = (settingsData as Record<string, string>)?.currency || "USD";
  const cs = getCurrencySymbol(currency);

  const currentHotel = useMemo(() => {
    if (user?.hotelId) return hotelsData.find((h: any) => h.id === user.hotelId);
    return hotelsData[0];
  }, [hotelsData, user]);

  const empIdPrefix = useMemo(() => generateEmployeeIdPrefix(currentHotel?.name || ""), [currentHotel]);

  const staff = staffData.map((s: any) => ({
    ...s,
    salary: Number(s.salary) || 0,
    bonusAmount: Number(s.bonusAmount) || 0,
    joined: s.joinDate,
    status: s.status === "active" ? "Active" : "Inactive",
  }));

  const addStaffMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
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
    mutationFn: ({ id, password }: { id: number; password: string }) => apiRequest("DELETE", `/api/staff/${id}`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      toast({ title: "Staff Deleted", description: "Employee and all associated records have been permanently removed.", variant: "destructive" });
      setStaffToDelete(null);
      setStaffToDeleteName("");
      setIsDeleteAlertOpen(false);
      setDeletePassword("");
      setDeleteDues(null);
      setDuesForStaffId(null);
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

  const [isGenerateSalaryOpen, setIsGenerateSalaryOpen] = useState(false);
  const [generateStaff, setGenerateStaff] = useState<any>(null);
  const [generateMonth, setGenerateMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generateAmount, setGenerateAmount] = useState(0);
  const [generateBonus, setGenerateBonus] = useState(0);
  const [generateWelfare, setGenerateWelfare] = useState(0);

  const openGenerateSalary = (emp: any) => {
    setGenerateStaff(emp);
    const totalSalary = Number(emp.salary) || 0;
    const basicPay = Number(emp.basicPay) || totalSalary;
    const bonusAmt = Number(emp.bonusAmount) || 0;
    const welfareAmt = emp.welfareEnabled ? Math.round(basicPay * 0.01) : 0;
    setGenerateAmount(totalSalary);
    setGenerateBonus(bonusAmt);
    setGenerateWelfare(welfareAmt);
    const now = new Date();
    setGenerateMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    setIsGenerateSalaryOpen(true);
  };

  const generateSalaryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/salaries/generate", data),
    onSuccess: async (res: any) => {
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      if (result.skipped > 0) {
        toast({
          title: "Already Exists",
          description: `Salary for ${generateStaff?.name || 'this employee'} for the selected month has already been generated.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Salary Generated",
          description: `Salary record created for ${generateStaff?.name || 'employee'}.`,
        });
      }
      setIsGenerateSalaryOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerateSalary = () => {
    if (!generateStaff) return;
    generateSalaryMutation.mutate({
      month: generateMonth,
      staffSalaries: [{
        staffId: generateStaff.id,
        netPay: generateAmount,
        bonus: generateBonus,
        welfareContribution: generateWelfare,
      }],
    });
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "add">("add");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
  const [staffToDeleteName, setStaffToDeleteName] = useState<string>("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteDues, setDeleteDues] = useState<{ hasDues: boolean; count: number; totalDue: number } | null>(null);
  const [checkingDues, setCheckingDues] = useState(false);
  const [duesForStaffId, setDuesForStaffId] = useState<number | null>(null);
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const [staffToDeactivate, setStaffToDeactivate] = useState<number | null>(null);
  const [staffToDeactivateName, setStaffToDeactivateName] = useState<string>("");
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateDues, setDeactivateDues] = useState<{ hasDues: boolean; count: number; totalDue: number } | null>(null);
  const [checkingDeactivateDues, setCheckingDeactivateDues] = useState(false);
  const [deactivateDuesForStaffId, setDeactivateDuesForStaffId] = useState<number | null>(null);
  const [isActivateAlertOpen, setIsActivateAlertOpen] = useState(false);
  const [staffToActivateId, setStaffToActivateId] = useState<number | null>(null);
  const [staffToActivateName, setStaffToActivateName] = useState<string>("");
  const [activatePassword, setActivatePassword] = useState("");
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
  const [staffRole, setStaffRole] = useState("");
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
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [idDocumentName, setIdDocumentName] = useState<string>("");
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const [createLogin, setCreateLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [basicSalary, setBasicSalary] = useState(0);
  const [transport, setTransport] = useState(0);
  const [hra, setHra] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const totalSalary = basicSalary + transport + hra + allowance;
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [settlementStaff, setSettlementStaff] = useState<any>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [lastWorkDay, setLastWorkDay] = useState("");
  const [goodbyeConfirmMode, setGoodbyeConfirmMode] = useState(false);
  const [goodbyePassword, setGoodbyePassword] = useState("");
  const [goodbyePending, setGoodbyePending] = useState(false);

  const welfareSettingsParsed = (() => {
    try { return JSON.parse((settingsData as any)?.welfareSettings || '{}'); } catch { return {}; }
  })();
  const welfareEnabled = welfareSettingsParsed?.enabled ?? false;
  const firstYearRate = Number(welfareSettingsParsed?.firstYearAmount) || 0;
  const afterFirstYearRate = Number(welfareSettingsParsed?.afterFirstYearAmount) || 0;

  const settlementCalc = (() => {
    if (!settlementStaff || !lastWorkDay) return null;
    const joinDate = new Date(settlementStaff.joinDate || settlementStaff.joined);
    const lastDay = new Date(lastWorkDay);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(joinDate.getTime()) || isNaN(lastDay.getTime()) || lastDay <= today || lastDay < joinDate) return null;
    const totalMonths = (lastDay.getFullYear() - joinDate.getFullYear()) * 12 + (lastDay.getMonth() - joinDate.getMonth());
    const months = Math.max(0, totalMonths);
    const rate = months >= 12 ? afterFirstYearRate : firstYearRate;
    const totalWelfare = months * rate;
    const totalSalaryAmt = Number(settlementStaff.salary) || 0;
    return { months, rate, totalWelfare, totalSalaryAmt };
  })();

  const handleSayGoodbye = async () => {
    if (!settlementStaff || !settlementCalc || !goodbyePassword) return;
    setGoodbyePending(true);
    try {
      const verifyRes = await apiRequest("POST", "/api/auth/verify-password", { password: goodbyePassword });
      if (!verifyRes.ok) {
        toast({ title: "Incorrect Password", description: "The password you entered is wrong.", variant: "destructive" });
        return;
      }
      const duesRes = await apiRequest("GET", `/api/staff/${settlementStaff.id}/dues`);
      const duesData = await duesRes.json();
      if (duesData.hasDues) {
        toast({
          title: "Pending Salaries",
          description: `${settlementStaff.name} has ${duesData.count} unpaid salary record(s) totalling ${cs}${duesData.totalDue.toFixed(2)}. Please clear all dues before proceeding.`,
          variant: "destructive",
        });
        return;
      }
      const [yr, mo] = lastWorkDay.split("-");
      const settlementMonth = `${yr}-${mo}`;
      await apiRequest("POST", "/api/salaries/generate", {
        month: settlementMonth,
        staffSalaries: [{
          staffId: settlementStaff.id,
          netPay: settlementCalc.totalWelfare,
          bonus: 0,
          welfareContribution: settlementCalc.totalWelfare,
          isFinalSettlement: true,
          paidDate: lastWorkDay,
        }],
      });
      await apiRequest("POST", `/api/staff/${settlementStaff.id}/deactivate`, { password: goodbyePassword });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      toast({ title: "Farewell!", description: `${settlementStaff.name}'s final settlement has been recorded and the employee has been deactivated.` });
      setSettlementOpen(false);
      setGoodbyeConfirmMode(false);
      setGoodbyePassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setGoodbyePending(false);
    }
  };

  useEffect(() => {
    if (dob) {
      setAge(differenceInYears(new Date(), new Date(dob)));
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
        setProratedSalary(Math.round((totalSalary / daysInMonth) * daysWorked));
      } else {
        setProratedSalary(null);
      }
    } else {
      setProratedSalary(null);
    }
  }, [joiningDate, totalSalary]);

  const populateFormFromEmployee = (emp: any) => {
    const names = (emp.name || "").split(" ");
    setFirstName(names[0] || "");
    setLastName(names.slice(1).join(" ") || "");
    setEmployeeId(emp.employeeId || "");
    setStaffRole(emp.role || "");
    setEmail(emp.email || "");
    setPhone((emp.phone || "").replace(/^\+\d{1,3}/, ""));
    setCountryCode(emp.countryCode || "+1");
    setBasicSalary(Number(emp.basicPay) || Number(emp.salary) || 0);
    setHra(Number(emp.hra) || 0);
    setTransport(Number(emp.transport) || 0);
    setAllowance(Number(emp.allowance) || 0);
    setJoiningDate(emp.joinDate || "");
    setWelfareFund(emp.welfareEnabled || false);
    setBonus(Number(emp.bonusAmount) || 0);
    setDob(emp.dob || "");
    setGender(emp.gender || "");
    setNationality(emp.nationality || "");
    setState(emp.state || "");
    setCity(emp.city || "");
    setAddress(emp.address || "");
    setSelectedBranchId(emp.branchId || null);
    setEmergencyName(emp.emergencyName || "");
    setEmergencyRelation(emp.emergencyRelation || "");
    setEmergencyPhone(emp.emergencyPhone || "");
    setIdCardNumber(emp.idCardNumber || "");
    setPoliceVerification(emp.policeVerification || false);
    setPhotoPreview(emp.photo || null);
    setIdDocument(emp.idDocument || null);
    setIdDocumentName(emp.idDocumentName || "");
    setCreateLogin(false);
    setLoginPassword("");
    setFormErrors({});
  };

  const handleView = (employee: any) => {
    setEditingStaff(employee);
    populateFormFromEmployee(employee);
    setDialogMode("view");
    setIsDialogOpen(true);
  };

  const handleSwitchToEdit = () => {
    setDialogMode("edit");
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setFirstName(""); setLastName("");
    setEmployeeId(getNextEmployeeId(empIdPrefix, staffData));
    setBasicSalary(0); setTransport(0); setHra(0); setAllowance(0);
    setStaffRole(""); setGender(""); setDob(""); setNationality(""); setState("");
    setCity(""); setAddress(""); setPhone(""); setEmail(""); setCountryCode("+1");
    setJoiningDate(""); setWelfareFund(false); setBonus(0); setPoliceVerification(false);
    setEmergencyName(""); setEmergencyRelation(""); setEmergencyPhone("");
    setIdCardNumber(""); setPhotoPreview(null); setIdDocument(null); setIdDocumentName("");
    setSelectedBranchId(null);
    setCreateLogin(false); setLoginPassword(""); setFormErrors({});
    setDialogMode("add");
    setIsDialogOpen(true);
  };

  const deactivateStaffMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => apiRequest("POST", `/api/staff/${id}/deactivate`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      toast({ title: "Staff Deactivated", description: "Employee has been deactivated and moved to archived records." });
      setStaffToDeactivate(null);
      setStaffToDeactivateName("");
      setIsDeactivateAlertOpen(false);
      setDeactivatePassword("");
      setDeactivateDues(null);
      setDeactivateDuesForStaffId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openDeactivateDialog = async (staffId: number, staffName?: string) => {
    setStaffToDeactivate(staffId);
    setStaffToDeactivateName(staffName || "");
    setDeactivatePassword("");
    setDeactivateDues(null);
    setDeactivateDuesForStaffId(staffId);
    setIsDeactivateAlertOpen(true);
    setCheckingDeactivateDues(true);
    try {
      const res = await apiRequest("GET", `/api/staff/${staffId}/dues`);
      const data = await res.json();
      setDeactivateDues(data);
    } catch {
      setDeactivateDues({ hasDues: false, count: 0, totalDue: 0 });
    } finally {
      setCheckingDeactivateDues(false);
    }
  };

  const confirmDeactivate = () => {
    if (staffToDeactivate && deactivatePassword) {
      deactivateStaffMutation.mutate({ id: staffToDeactivate, password: deactivatePassword });
    }
  };

  const activateStaffMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      apiRequest("POST", `/api/staff/${id}/activate`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff Activated", description: "Employee has been re-activated and is now in the active staff list." });
      setIsActivateAlertOpen(false);
      setStaffToActivateId(null);
      setStaffToActivateName("");
      setActivatePassword("");
    },
    onError: (error: any) => {
      toast({ title: "Activation Failed", description: error.message, variant: "destructive" });
    },
  });

  const openActivateDialog = (id: number, name?: string) => {
    setStaffToActivateId(id);
    setStaffToActivateName(name || "");
    setActivatePassword("");
    setIsActivateAlertOpen(true);
  };

  const confirmActivate = () => {
    if (staffToActivateId && activatePassword) {
      activateStaffMutation.mutate({ id: staffToActivateId, password: activatePassword });
    }
  };

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
        if (dialogMode === "view") setDialogMode("edit");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Document must be under 5MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdDocument(reader.result as string);
        setIdDocumentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameInput = (value: string, setter: (v: string) => void) => {
    setter(value.replace(/[^a-zA-Z\s'-]/g, ""));
  };

  const handlePhoneInput = (value: string, setter: (v: string) => void) => {
    setter(value.replace(/[^0-9]/g, ""));
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
      employeeId,
      name: `${firstName} ${lastName}`.trim(),
      role: staffRole,
      email,
      phone: `${countryCode}${phone}`,
      salary: String(totalSalary),
      joinDate: joiningDate || new Date().toISOString().split('T')[0],
      status: "active",
      welfareEnabled: welfareFund,
      bonusEnabled: bonus > 0,
      bonusAmount: String(bonus),
      dob: dob || null,
      gender: gender || null,
      nationality: nationality || null,
      state: state || null,
      city: city || null,
      address: address || null,
      countryCode,
      branchId: selectedBranchId || null,
      basicPay: String(basicSalary),
      hra: String(hra),
      transport: String(transport),
      allowance: String(allowance),
      emergencyName: emergencyName || null,
      emergencyRelation: emergencyRelation || null,
      emergencyPhone: emergencyPhone || null,
      idCardNumber: idCardNumber || null,
      policeVerification,
      photo: photoPreview || null,
      idDocument: idDocument || null,
      idDocumentName: idDocumentName || null,
    };

    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data: staffPayload });
    } else {
      addStaffMutation.mutate(staffPayload);
      if (createLogin && email.trim() && loginPassword) {
        createUserMutation.mutate({
          name: `${firstName} ${lastName}`.trim(),
          email, password: loginPassword, role: "staff",
          hotelId: user?.hotelId || currentHotel?.id || null,
          status: "Active",
        });
      }
    }
  };

  const activeStaff = staff.filter(s => s.status !== "Inactive");
  const isViewMode = dialogMode === "view";
  const isEditable = dialogMode === "edit" || dialogMode === "add";

  const openDeleteDialog = async (staffId: number, staffName?: string) => {
    setStaffToDelete(staffId);
    setStaffToDeleteName(staffName || "");
    setDeletePassword("");
    setDeleteDues(null);
    setDuesForStaffId(staffId);
    setIsDeleteAlertOpen(true);
    setCheckingDues(true);
    try {
      const res = await apiRequest("GET", `/api/staff/${staffId}/dues`);
      const data = await res.json();
      setDeleteDues(data);
    } catch {
      setDeleteDues({ hasDues: false, count: 0, totalDue: 0 });
    } finally {
      setCheckingDues(false);
    }
  };

  const confirmDelete = () => {
    if (staffToDelete && deletePassword) {
      deleteStaffMutation.mutate({ id: staffToDelete, password: deletePassword });
    }
  };

  const Req = () => <span className="text-red-500">*</span>;
  const FieldError = ({ field }: { field: string }) => formErrors[field] ? <p className="text-red-500 text-xs mt-1">{formErrors[field]}</p> : null;

  const ViewField = ({ label, value, span2 }: { label: string; value: string | number | null | undefined; span2?: boolean }) => (
    <div className={`space-y-1 ${span2 ? "col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium min-h-[20px]">{value || <span className="text-muted-foreground italic">Not provided</span>}</div>
    </div>
  );

  return (
    <AdminLayout role={role}>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-page-title">Staff Management</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} size="icon" title="Onboard Staff" className="bg-black text-white hover:bg-black/80" data-testid="button-onboard-staff">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>
                      {dialogMode === "view" ? "Employee Details" : editingStaff ? "Edit Employee Details" : "Onboard New Employee"}
                    </DialogTitle>
                    <DialogDescription>
                      {dialogMode === "view" ? "Viewing employee information." : editingStaff ? "Update employee information." : "Fill in the details to register a new staff member. Fields marked with * are mandatory."}
                    </DialogDescription>
                  </div>
                  {isViewMode && (
                    <Button variant="outline" size="sm" onClick={handleSwitchToEdit} data-testid="button-switch-to-edit">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* VIEW MODE */}
              {isViewMode && editingStaff && (
                <div className="grid gap-6 py-4">
                  <div className="space-y-4 border-b pb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-primary">Personal Information</h3>
                      <Badge variant="outline" className="font-mono">ID: {employeeId}</Badge>
                    </div>
                    <div className="flex items-start gap-4">
                      <div
                        className="relative h-20 w-20 rounded-full shrink-0 cursor-pointer group"
                        onClick={() => photoInputRef.current?.click()}
                        data-testid="button-view-photo-change"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Staff photo" className="h-full w-full rounded-full object-cover border-2 border-primary/20" />
                        ) : (
                          <div className="h-full w-full rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-photo-view" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <ViewField label="Full Name" value={`${firstName} ${lastName}`} />
                        <ViewField label="Gender" value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : null} />
                        <ViewField label="Nationality" value={nationality} />
                        <ViewField label="Date of Birth" value={dob} />
                        <ViewField label="Age" value={age !== null ? `${age} Years` : null} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-primary">Contact Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ViewField label="Phone Number" value={phone ? `${countryCode} ${phone}` : null} />
                      <ViewField label="Email ID" value={email} />
                      <ViewField label="State / Province" value={state} />
                      <ViewField label="City" value={city} />
                      <ViewField label="Permanent Address" value={address} span2 />
                    </div>
                    {(emergencyName || emergencyPhone) && (
                      <div className="bg-red-50 p-4 rounded-md border border-red-100">
                        <Label className="text-red-800 font-semibold text-sm mb-2 block">Emergency Contact</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <ViewField label="Contact Person" value={emergencyName} />
                          <ViewField label="Relation" value={emergencyRelation} />
                          <ViewField label="Phone" value={emergencyPhone} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="font-medium text-primary">Role & Compensation</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <ViewField label="Job Role" value={staffRole} />
                      <ViewField label="Joining Date" value={joiningDate} />
                      <ViewField label="Status" value={editingStaff.status} />
                      <ViewField label="Assigned Branch" value={selectedBranchId ? branchesData.find((b: any) => b.id === selectedBranchId)?.name || "Unknown" : "Unassigned"} />
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-sm font-semibold">Monthly Salary</Label>
                        <Badge variant="outline" className="font-mono">{cs}{totalSalary.toFixed(2)} / mo</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <ViewField label="Basic Pay" value={`${cs}${basicSalary}`} />
                        <ViewField label="HRA" value={`${cs}${hra}`} />
                        <ViewField label="Transport" value={`${cs}${transport}`} />
                        <ViewField label="Other Allowance" value={`${cs}${allowance}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-dashed">
                        <ViewField label="Welfare Fund" value={welfareFund ? "Enabled" : "Disabled"} />
                        <ViewField label="Monthly Bonus" value={`${cs}${bonus}`} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-primary">Verification & Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ViewField label="ID Card Number" value={idCardNumber} />
                      <ViewField label="Police Verification" value={policeVerification ? "Completed" : "Pending"} />
                    </div>
                    {idDocument ? (
                      <div className="flex items-center gap-3 border rounded-lg p-3 bg-primary/5">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{idDocumentName || "ID Document"}</p>
                          <p className="text-xs text-muted-foreground">Identity proof on file</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs shrink-0"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = idDocument;
                            a.download = idDocumentName || "id_document";
                            a.click();
                          }}
                          data-testid="button-download-document"
                        >
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-3 text-center text-muted-foreground text-sm">
                        No ID document uploaded
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EDIT / ADD MODE */}
              {isEditable && (
              <div className="grid gap-6 py-4">
                <div className="space-y-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2 text-primary">Personal Information</h3>
                    <Badge variant="outline" className="font-mono" data-testid="text-employee-id">ID: {employeeId}</Badge>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div 
                      className="h-24 w-24 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors shrink-0 mt-1 overflow-hidden"
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
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-photo" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label>First Name <Req /></Label>
                        <Input value={firstName} onChange={e => handleNameInput(e.target.value, setFirstName)} className={formErrors.firstName ? "border-red-500" : ""} data-testid="input-first-name" placeholder="John" />
                        <FieldError field="firstName" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name <Req /></Label>
                        <Input value={lastName} onChange={e => handleNameInput(e.target.value, setLastName)} className={formErrors.lastName ? "border-red-500" : ""} data-testid="input-last-name" placeholder="Doe" />
                        <FieldError field="lastName" />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender <Req /></Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className={formErrors.gender ? "border-red-500" : ""} data-testid="select-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError field="gender" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality <Req /></Label>
                        <Select value={nationality} onValueChange={(val) => { setNationality(val); setState(""); }}>
                          <SelectTrigger className={formErrors.nationality ? "border-red-500" : ""} data-testid="select-nationality"><SelectValue placeholder="Select Nationality" /></SelectTrigger>
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
                      <Label>Date of Birth <Req /></Label>
                      <Input type="date" value={dob} max={getMaxDob()} onChange={(e) => setDob(e.target.value)} className={formErrors.dob ? "border-red-500" : ""} data-testid="input-dob" />
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
                      <Label>Phone Number <Req /></Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[100px]" data-testid="select-country-code"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {countryCodes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="tel" placeholder="9876543210" value={phone} onChange={e => handlePhoneInput(e.target.value, setPhone)} maxLength={15} className={formErrors.phone ? "border-red-500" : ""} data-testid="input-phone" />
                      </div>
                      <FieldError field="phone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email ID</Label>
                      <Input type="email" placeholder="john.doe@example.com" value={email} onChange={e => setEmail(e.target.value)} className={formErrors.email ? "border-red-500" : ""} data-testid="input-email" />
                      <FieldError field="email" />
                    </div>
                    <div className="space-y-2">
                      <Label>State / Province <Req /></Label>
                      <Select value={state} onValueChange={setState} disabled={!nationality}>
                        <SelectTrigger className={formErrors.state ? "border-red-500" : ""} data-testid="select-state"><SelectValue placeholder="Select State" /></SelectTrigger>
                        <SelectContent>
                          {nationality && countries[nationality]?.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError field="state" />
                    </div>
                    <div className="space-y-2">
                      <Label>City <Req /></Label>
                      <Input placeholder="City Name" value={city} onChange={e => setCity(e.target.value)} className={formErrors.city ? "border-red-500" : ""} data-testid="input-city" />
                      <FieldError field="city" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Permanent Address <Req /></Label>
                    <Textarea placeholder="House No, Street, Landmark, Zip Code" className={`min-h-[60px] ${formErrors.address ? "border-red-500" : ""}`} value={address} onChange={e => setAddress(e.target.value)} data-testid="input-address" />
                    <FieldError field="address" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-md border border-red-100">
                    <div className="col-span-2">
                      <Label className="text-red-800 font-semibold">Emergency Contact (Optional)</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-700">Contact Person Name</Label>
                      <Input className="bg-white" placeholder="Name" value={emergencyName} onChange={e => handleNameInput(e.target.value, setEmergencyName)} data-testid="input-emergency-name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-700">Relation</Label>
                      <Select value={emergencyRelation} onValueChange={setEmergencyRelation}>
                        <SelectTrigger className="bg-white" data-testid="select-emergency-relation"><SelectValue placeholder="Select Relation" /></SelectTrigger>
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
                      <Label className="text-red-700">Contact Number</Label>
                      <Input className="bg-white" type="tel" placeholder="Phone" value={emergencyPhone} onChange={e => handlePhoneInput(e.target.value, setEmergencyPhone)} data-testid="input-emergency-phone" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-primary">Role & Compensation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Role <Req /></Label>
                      <Select value={staffRole} onValueChange={setStaffRole}>
                        <SelectTrigger className={formErrors.staffRole ? "border-red-500" : ""} data-testid="select-role"><SelectValue placeholder="Select Role" /></SelectTrigger>
                        <SelectContent>
                          {hotelRoles.length > 0 ? (
                            hotelRoles.map((r: any) => (
                              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No roles defined. Add roles in Settings → Roles & Permissions.</div>
                          )}
                        </SelectContent>
                      </Select>
                      <FieldError field="staffRole" />
                    </div>
                    <div className="space-y-2">
                      <Label>Assign to Branch</Label>
                      <Select value={String(selectedBranchId || "")} onValueChange={(val) => setSelectedBranchId(val ? Number(val) : null)}>
                        <SelectTrigger data-testid="select-branch"><SelectValue placeholder="Select Branch (Optional)" /></SelectTrigger>
                        <SelectContent>
                          {branchesData && branchesData.map((branch: any) => (
                            <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Joining Date <Req /></Label>
                      <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={formErrors.joiningDate ? "border-red-500" : ""} data-testid="input-join-date" />
                      <FieldError field="joiningDate" />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">Monthly Salary Breakdown <Req /></Label>
                      <Badge variant="outline" className="bg-background font-mono" data-testid="text-total-salary">Total: {cs}{totalSalary.toFixed(2)} / mo</Badge>
                    </div>
                    {formErrors.salary && <p className="text-red-500 text-xs">{formErrors.salary}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Basic Pay <Req /></Label>
                        <Input type="number" min="0" placeholder="0" className="h-8 bg-white" value={basicSalary || ""} onChange={(e) => setBasicSalary(Number(e.target.value))} data-testid="input-basic-salary" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">HRA</Label>
                        <Input type="number" min="0" placeholder="0" className="h-8 bg-white" value={hra || ""} onChange={(e) => setHra(Number(e.target.value))} data-testid="input-hra" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Transport</Label>
                        <Input type="number" min="0" placeholder="0" className="h-8 bg-white" value={transport || ""} onChange={(e) => setTransport(Number(e.target.value))} data-testid="input-transport" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Other Allowance</Label>
                        <Input type="number" min="0" placeholder="0" className="h-8 bg-white" value={allowance || ""} onChange={(e) => setAllowance(Number(e.target.value))} data-testid="input-allowance" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="welfare" checked={welfareFund} onCheckedChange={(checked) => setWelfareFund(checked as boolean)} data-testid="checkbox-welfare" />
                        <Label htmlFor="welfare" className="text-sm font-medium cursor-pointer">Enable Welfare Fund Liability</Label>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Monthly Bonus (Owner Config)</Label>
                        <Input type="number" min="0" placeholder="0" className="h-8 bg-white" value={bonus || ""} onChange={(e) => setBonus(Number(e.target.value))} data-testid="input-bonus" />
                      </div>
                    </div>
                    {proratedSalary !== null && (
                      <div className="mt-4 pt-3 border-t border-dashed">
                        <div className="flex items-center justify-between">
                          <Label className="text-amber-700 text-sm">Pro-rated Salary (Current Month)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Auto-calculated:</span>
                            <Input className="h-8 w-28 bg-amber-50 border-amber-200" value={`${cs}${proratedSalary}`} readOnly data-testid="input-prorated-salary" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">*Based on joining date. This amount will be used for the first month's salary.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t mt-2">
                  <h3 className="font-medium flex items-center gap-2 text-primary mt-2">Verification & Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID Card Number</Label>
                      <Input placeholder="Enter ID Number" value={idCardNumber} onChange={e => setIdCardNumber(e.target.value)} data-testid="input-id-card" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID Proof Document</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${idDocument ? "border-primary/40 bg-primary/5" : "border-muted-foreground/30"}`}
                        onClick={() => idDocumentInputRef.current?.click()}
                        data-testid="button-id-document-upload"
                      >
                        <input
                          ref={idDocumentInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleDocumentUpload}
                          data-testid="input-id-document"
                        />
                        {idDocument ? (
                          <>
                            <FileText className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary truncate">{idDocumentName}</p>
                              <p className="text-xs text-muted-foreground">Click to replace</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                              onClick={(e) => { e.stopPropagation(); setIdDocument(null); setIdDocumentName(""); }}
                              data-testid="button-clear-document"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Upload ID Document</p>
                              <p className="text-xs text-muted-foreground">PDF or image, max 5MB</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center space-x-2 pt-2">
                      <Checkbox id="policeVerification" checked={policeVerification} onCheckedChange={(checked) => setPoliceVerification(checked as boolean)} data-testid="checkbox-police-verification" />
                      <label htmlFor="policeVerification" className="text-sm font-medium leading-none">Police Verification Completed</label>
                    </div>
                  </div>
                </div>

                {dialogMode === "add" && (
                  <div className="space-y-4 pt-2 border-t mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2 text-primary">Login Access</h3>
                        <p className="text-xs text-muted-foreground mt-1">Optionally create a system login for this employee</p>
                      </div>
                      <Switch checked={createLogin} onCheckedChange={setCreateLogin} data-testid="switch-create-login" />
                    </div>
                    {createLogin && (
                      <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <div className="space-y-2">
                          <Label className="text-blue-700">Login ID (Email) <Req /></Label>
                          <Input type="email" placeholder="john.doe@example.com" value={email} onChange={e => setEmail(e.target.value)} className={`bg-white ${formErrors.email ? "border-red-500" : ""}`} data-testid="input-login-email" />
                          <FieldError field="email" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-blue-700">Password <Req /></Label>
                          <Input type="password" placeholder="Minimum 6 characters" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`bg-white ${formErrors.loginPassword ? "border-red-500" : ""}`} data-testid="input-login-password" />
                          <FieldError field="loginPassword" />
                        </div>
                        <p className="text-xs text-blue-600 col-span-2">This employee will be able to log in with their email and the password set above.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {isEditable && (
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
              )}

              {isViewMode && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
              </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
            </div>
          </div>
          <p className="text-muted-foreground">Manage employees and their records.</p>

        <Dialog open={isGenerateSalaryOpen} onOpenChange={setIsGenerateSalaryOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Generate Salary</DialogTitle>
              <DialogDescription>
                Generate a salary record for {generateStaff?.name || 'employee'}. Edit the values below as needed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium">Month</Label>
                <Input type="month" value={generateMonth} onChange={e => setGenerateMonth(e.target.value)} data-testid="input-generate-month" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Salary Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{cs}</span>
                  <Input type="number" min="0" className="pl-8" value={generateAmount || ""} onChange={e => setGenerateAmount(Number(e.target.value) || 0)} data-testid="input-generate-amount" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Bonus</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{cs}</span>
                  <Input type="number" min="0" className="pl-8" value={generateBonus || ""} onChange={e => setGenerateBonus(Number(e.target.value) || 0)} data-testid="input-generate-bonus" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Welfare Fund</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{cs}</span>
                  <Input type="number" min="0" className="pl-8" value={generateWelfare || ""} onChange={e => setGenerateWelfare(Number(e.target.value) || 0)} data-testid="input-generate-welfare" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm font-medium">Total Pay</span>
                <span className="text-lg font-bold">{cs}{(generateAmount + generateBonus).toLocaleString()}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGenerateSalaryOpen(false)}>Cancel</Button>
              <Button
                onClick={handleGenerateSalary}
                disabled={generateSalaryMutation.isPending}
                data-testid="button-confirm-generate-salary"
              >
                {generateSalaryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Salary
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4 md:px-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Active Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-xl md:text-2xl font-bold" data-testid="text-active-staff-count">{activeStaff.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4 md:px-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                Monthly Payroll
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4">
              <div className="text-xl md:text-2xl font-bold text-amber-600" data-testid="text-pending-salaries">{cs}{activeStaff.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Card View - visible only on small screens */}
        <div className="md:hidden space-y-3">
          <h3 className="font-semibold text-base text-primary px-1">Active Staff Directory</h3>
          {activeStaff.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No active staff members found.</div>
          )}
          {activeStaff.map((employee) => {
            const initials = employee.name
              ? employee.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
              : "?";
            return (
              <div
                key={employee.id}
                data-testid={`card-staff-${employee.id}`}
                className="bg-card border rounded-xl shadow-sm p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleView(employee)}
              >
                <div className="flex-shrink-0">
                  {employee.photo ? (
                    <img src={employee.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate" data-testid={`text-staff-name-${employee.id}`}>{employee.name}</span>
                    <Badge variant="outline" className="font-mono text-[10px] shrink-0">{employee.employeeId}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{employee.role}</div>
                  <div className="text-sm font-semibold text-amber-600 mt-1">{cs}{employee.salary?.toLocaleString()}</div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => handleView(employee)} data-testid={`button-view-staff-mobile-${employee.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Archive Staff" onClick={() => openDeactivateDialog(employee.id, employee.name)} data-testid={`button-archive-staff-mobile-${employee.id}`}>
                    <Archive className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-more-staff-mobile-${employee.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openGenerateSalary(employee)} data-testid={`menu-salary-staff-mobile-${employee.id}`}>
                        <Calculator className="h-4 w-4 mr-2" /> Generate Salary
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSettlementStaff(employee); setLastWorkDay(""); setSettlementOpen(true); }} data-testid={`menu-settlement-staff-mobile-${employee.id}`}>
                        <LogOut className="h-4 w-4 mr-2 text-orange-500" /> Final Settlement
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeactivateDialog(employee.id, employee.name)} data-testid={`menu-archive-staff-mobile-${employee.id}`}>
                        <Archive className="h-4 w-4 mr-2 text-amber-600" /> Archive
                      </DropdownMenuItem>
                      {role === "owner" && (
                        <DropdownMenuItem onClick={() => openDeleteDialog(employee.id, employee.name)} className="text-destructive" data-testid={`menu-delete-staff-mobile-${employee.id}`}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View - hidden on mobile */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Active Staff Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStaff.map((employee) => (
                  <TableRow key={employee.id} data-testid={`row-staff-${employee.id}`} className="cursor-pointer" onClick={() => handleView(employee)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {employee.photo ? (
                          <img src={employee.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted" />
                        )}
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{employee.employeeId}</Badge></TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{cs}{employee.salary}</TableCell>
                    <TableCell>{employee.joined}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-600 hover:bg-green-700">{employee.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" title="Generate Salary" className="h-8 px-2 text-xs gap-1" onClick={() => openGenerateSalary(employee)} data-testid={`button-generate-salary-${employee.id}`}>
                          <Calculator className="h-3.5 w-3.5" /> Salary
                        </Button>
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => handleView(employee)} data-testid={`button-view-staff-${employee.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Final Settlement" className="text-orange-500 hover:text-orange-700 hover:bg-orange-50" onClick={e => { e.stopPropagation(); setSettlementStaff(employee); setLastWorkDay(""); setSettlementOpen(true); }} data-testid={`button-settlement-staff-${employee.id}`}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Archive Staff" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => openDeactivateDialog(employee.id, employee.name)}>
                          <Archive className="h-4 w-4" />
                        </Button>
                        {role === "owner" && (
                        <Button variant="ghost" size="icon" title="Delete Permanent" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(employee.id, employee.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {activeStaff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active staff members found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => {
        setIsDeleteAlertOpen(open);
        if (!open) { setStaffToDelete(null); setStaffToDeleteName(""); setDeletePassword(""); setDeleteDues(null); setDuesForStaffId(null); }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This action cannot be undone. This will permanently delete <strong>{staffToDeleteName || "this staff"}</strong> along with all associated salary records.</p>

                {checkingDues && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking outstanding dues for {staffToDeleteName || "staff"}...
                  </div>
                )}

                {deleteDues && duesForStaffId === staffToDelete && deleteDues?.hasDues && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 font-medium">Outstanding Dues Found for {staffToDeleteName || "Staff"}</p>
                    <p className="text-red-600 text-sm mt-1">
                      <strong>{staffToDeleteName || "This staff"}</strong> has {deleteDues.count} unpaid salary record(s) totalling {cs}{deleteDues.totalDue.toFixed(2)}.
                      Please clear all dues before deleting.
                    </p>
                  </div>
                )}

                {deleteDues && duesForStaffId === staffToDelete && !deleteDues.hasDues && (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-green-700 text-sm">No outstanding dues. Staff can be deleted.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-password" className="text-sm font-medium">Enter your password to confirm</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        placeholder="Enter your login password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && deletePassword) confirmDelete(); }}
                        data-testid="input-delete-password"
                      />
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setStaffToDelete(null); setStaffToDeleteName(""); setDeletePassword(""); setDeleteDues(null); setDuesForStaffId(null); }}>Cancel</AlertDialogCancel>
            {deleteDues && duesForStaffId === staffToDelete && !deleteDues.hasDues && (
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={!deletePassword || deleteStaffMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteStaffMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Permanently Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isActivateAlertOpen} onOpenChange={(open) => {
        setIsActivateAlertOpen(open);
        if (!open) { setStaffToActivateId(null); setStaffToActivateName(""); setActivatePassword(""); }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Power className="h-5 w-5" />
              <AlertDialogTitle>Re-activate Staff Member?</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to re-activate <strong>{staffToActivateName || "this staff member"}</strong> and move them back to the active staff list. They will be included in future salary generation.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-amber-800 text-sm font-medium flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Please confirm this action carefully
                  </p>
                  <p className="text-amber-700 text-sm mt-1">Re-activating a staff member will restore their access and include them in payroll. Make sure this is intentional.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activate-password" className="text-sm font-medium">Enter your password to confirm</Label>
                  <Input
                    id="activate-password"
                    type="password"
                    placeholder="Enter your login password"
                    value={activatePassword}
                    onChange={(e) => setActivatePassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && activatePassword) confirmActivate(); }}
                    data-testid="input-activate-password"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setStaffToActivateId(null); setStaffToActivateName(""); setActivatePassword(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              disabled={!activatePassword || activateStaffMutation.isPending}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              {activateStaffMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm Activation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeactivateAlertOpen} onOpenChange={(open) => {
        setIsDeactivateAlertOpen(open);
        if (!open) { setStaffToDeactivate(null); setStaffToDeactivateName(""); setDeactivatePassword(""); setDeactivateDues(null); setDeactivateDuesForStaffId(null); }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Ban className="h-5 w-5" />
              <AlertDialogTitle>Deactivate Staff Member?</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This will deactivate <strong>{staffToDeactivateName || "this staff member"}</strong> and move them to archived records. They will no longer appear in active staff lists or be included in salary generation.</p>

                {checkingDeactivateDues && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking outstanding dues for {staffToDeactivateName || "staff"}...
                  </div>
                )}

                {deactivateDues && deactivateDuesForStaffId === staffToDeactivate && deactivateDues?.hasDues && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 font-medium">Outstanding Dues Found for {staffToDeactivateName || "Staff"}</p>
                    <p className="text-red-600 text-sm mt-1">
                      <strong>{staffToDeactivateName || "This staff"}</strong> has {deactivateDues.count} unpaid salary record(s) totalling {cs}{deactivateDues.totalDue.toFixed(2)}.
                      Please clear all dues before deactivating.
                    </p>
                  </div>
                )}

                {deactivateDues && deactivateDuesForStaffId === staffToDeactivate && !deactivateDues.hasDues && (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-green-700 text-sm">No outstanding dues. Staff can be deactivated.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deactivate-password" className="text-sm font-medium">Enter your password to confirm</Label>
                      <Input
                        id="deactivate-password"
                        type="password"
                        placeholder="Enter your login password"
                        value={deactivatePassword}
                        onChange={(e) => setDeactivatePassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && deactivatePassword) confirmDeactivate(); }}
                        data-testid="input-deactivate-password"
                      />
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setStaffToDeactivate(null); setStaffToDeactivateName(""); setDeactivatePassword(""); setDeactivateDues(null); setDeactivateDuesForStaffId(null); }}>Cancel</AlertDialogCancel>
            {deactivateDues && !deactivateDues.hasDues && (
              <AlertDialogAction
                onClick={confirmDeactivate}
                disabled={!deactivatePassword || deactivateStaffMutation.isPending}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {deactivateStaffMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Deactivate Staff
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Settlement Dialog */}
      <Dialog open={settlementOpen} onOpenChange={(open) => { setSettlementOpen(open); if (!open) { setGoodbyeConfirmMode(false); setGoodbyePassword(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-500" />
              Final Settlement
            </DialogTitle>
            <DialogDescription>
              {settlementStaff ? `${settlementStaff.name} · ${settlementStaff.employeeId}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Last Working Day</Label>
              <Input
                type="date"
                value={lastWorkDay}
                min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })()}
                onChange={e => setLastWorkDay(e.target.value)}
                data-testid="input-last-work-day"
              />
            </div>

            {settlementCalc && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Settlement Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Join Date</span>
                    <span>{settlementStaff?.joinDate || settlementStaff?.joined}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Working Day</span>
                    <span>{lastWorkDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Months Worked</span>
                    <span className="font-medium">{settlementCalc.months} month{settlementCalc.months !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Salary</span>
                    <span>{cs}{Number(settlementStaff?.salary || 0).toLocaleString()}</span>
                  </div>

                  {welfareEnabled && (
                    <>
                      <div className="border-t pt-2 mt-1" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Welfare Rate</span>
                        <span>{settlementCalc.months >= 12 ? "After 1 Year" : "1st Year"} — {cs}{settlementCalc.rate}/month</span>
                      </div>
                      <div className="flex justify-between font-medium text-teal-700">
                        <span>Total Welfare Fund</span>
                        <span>{cs}{settlementCalc.totalWelfare.toLocaleString()}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-2 mt-1" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total Settlement Amount</span>
                    <span className="text-green-700">{cs}{(settlementCalc.totalWelfare).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {!settlementCalc && lastWorkDay && (
              <p className="text-sm text-destructive">Last working day must be a future date after the employee's join date.</p>
            )}

            {goodbyeConfirmMode && settlementCalc && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-destructive">This action cannot be undone</p>
                    <p className="text-xs text-muted-foreground">
                      This will create a final settlement salary record of <strong>{cs}{settlementCalc.totalWelfare.toLocaleString()}</strong> for <strong>{settlementStaff?.name}</strong> and permanently deactivate their account.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Enter your password to confirm</Label>
                  <Input
                    type="password"
                    placeholder="Your login password"
                    value={goodbyePassword}
                    onChange={e => setGoodbyePassword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && goodbyePassword) handleSayGoodbye(); }}
                    data-testid="input-goodbye-password"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSettlementOpen(false); setGoodbyeConfirmMode(false); setGoodbyePassword(""); }}>Close</Button>
            {!goodbyeConfirmMode ? (
              <Button
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!settlementCalc}
                onClick={() => setGoodbyeConfirmMode(true)}
                data-testid="button-say-goodbye"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Say Goodbye
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={!goodbyePassword || goodbyePending}
                onClick={handleSayGoodbye}
                data-testid="button-confirm-goodbye"
              >
                {goodbyePending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm & Farewell
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
