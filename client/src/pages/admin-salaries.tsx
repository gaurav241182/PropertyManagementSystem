import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, CheckCircle2, Clock, CalendarDays, Filter, Undo, Trash2, Loader2, Banknote, Search, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useHotelSettings } from "@/hooks/use-hotel-settings";

function getEndOfMonth(monthStr: string): string {
  if (!monthStr) return "-";
  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return "-";
  const lastDay = new Date(year, month, 0);
  return lastDay.toISOString().split("T")[0];
}

export default function AdminSalaries({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { currencySymbol: cs } = useHotelSettings();
  const { data: salariesData = [], isLoading: salariesLoading } = useQuery<any[]>({ queryKey: ['/api/salaries'] });
  const { data: staffData = [], isLoading: staffLoading } = useQuery<any[]>({ queryKey: ['/api/staff'] });

  const staffMap = new Map(staffData.map((s: any) => [s.id, s]));

  const { data: staffAdvancesData = [] } = useQuery<any[]>({ queryKey: ['/api/staff-advances'] });

  const salaries = salariesData.map((s: any) => {
    const staffMember = staffMap.get(s.staffId);
    const netPay = Number(s.netPay) || 0;
    const advanceAmount = Number(s.advanceAmount) || 0;
    const instalmentDeduction = Number(s.instalmentDeduction) || 0;
    const pending = s.status === "Paid" ? 0 : (instalmentDeduction > 0 ? Math.max(0, netPay - instalmentDeduction) : Math.max(0, netPay - advanceAmount));
    const dueDate = s.dueDate || getEndOfMonth(s.month);
    return {
      ...s,
      name: staffMember?.name || `Staff #${s.staffId}`,
      role: staffMember?.role || "Unknown",
      employeeId: staffMember?.employeeId || "-",
      photo: staffMember?.photo || null,
      netPayNum: netPay,
      advanceNum: advanceAmount,
      instalmentDeduction,
      pending,
      dueDate,
      paymentDate: s.paidDate || "-",
    };
  });

  const isLoading = salariesLoading || staffLoading;

  const [selectedMonth, setSelectedMonth] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedSalaries, setSelectedSalaries] = useState<number[]>([]);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceSalary, setAdvanceSalary] = useState<any>(null);
  const [advanceInput, setAdvanceInput] = useState("");
  const [useInstalments, setUseInstalments] = useState(false);
  const [numberOfInstalments, setNumberOfInstalments] = useState("");

  const updateSalaryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/salaries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, amount, useInstalments, numberOfInstalments }: { id: number; amount: number; useInstalments?: boolean; numberOfInstalments?: number }) =>
      apiRequest("POST", `/api/salaries/${id}/advance`, { amount, useInstalments, numberOfInstalments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff-advances'] });
      if (useInstalments) {
        toast({ title: "Advance with Instalments Created", description: `Advance recorded with ${numberOfInstalments} monthly instalments.` });
      } else {
        toast({ title: "Advance Recorded", description: "Advance payment has been applied to the salary." });
      }
      setAdvanceDialogOpen(false);
      setAdvanceInput("");
      setUseInstalments(false);
      setNumberOfInstalments("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const paySalaryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/salaries/${id}/pay`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      if (data.overflowToNextMonth > 0) {
        toast({ title: "Salary Paid", description: `Salary marked as paid. ${cs}${Number(data.overflowToNextMonth).toLocaleString()} excess advance carried forward to next month.` });
      } else {
        toast({ title: "Salary Paid", description: "Employee salary has been marked as paid." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePay = (id: number) => {
    paySalaryMutation.mutate(id);
  };

  const handleRevert = (id: number) => {
    updateSalaryMutation.mutate({
      id,
      data: { status: "Pending", paidDate: null }
    }, {
      onSuccess: () => {
        toast({ title: "Status Reverted", description: "Salary status has been reverted to pending." });
      }
    });
  };

  const deleteSalaryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/salaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/staff-advances'] });
      toast({ title: "Record Deleted", description: "Salary record has been permanently removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: number) => {
    deleteSalaryMutation.mutate(id);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSalaries(filteredSalaries.map(s => s.id));
    } else {
      setSelectedSalaries([]);
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedSalaries.includes(id)) {
      setSelectedSalaries(selectedSalaries.filter(sid => sid !== id));
    } else {
      setSelectedSalaries([...selectedSalaries, id]);
    }
  };

  const handleBulkPay = async () => {
    const today = new Date().toISOString().split('T')[0];
    const promises = selectedSalaries.map(id =>
      apiRequest("PATCH", `/api/salaries/${id}`, { status: "Paid", paidDate: today })
    );
    try {
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      toast({
        title: "Bulk Payment Successful",
        description: `${selectedSalaries.length} salaries marked as paid.`,
      });
      setSelectedSalaries([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openAdvanceDialog = (salary: any) => {
    setAdvanceSalary(salary);
    setAdvanceInput("");
    setUseInstalments(false);
    setNumberOfInstalments("");
    setAdvanceDialogOpen(true);
  };

  const handleAdvanceSubmit = () => {
    const amount = Number(advanceInput);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid advance amount.", variant: "destructive" });
      return;
    }
    if (useInstalments) {
      const numInst = Number(numberOfInstalments);
      if (!numInst || numInst < 2) {
        toast({ title: "Invalid Instalments", description: "Number of instalments must be at least 2.", variant: "destructive" });
        return;
      }
    }
    if (advanceSalary) {
      advanceMutation.mutate({
        id: advanceSalary.id,
        amount,
        useInstalments: useInstalments || undefined,
        numberOfInstalments: useInstalments ? Number(numberOfInstalments) : undefined,
      });
    }
  };

  const filteredSalaries = salaries
    .filter(s => {
      if (selectedMonth !== "current" && s.month !== selectedMonth) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.month.includes(q) ||
          s.status.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "staffId") return a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true });
      if (sortBy === "salary") return b.netPayNum - a.netPayNum;
      if (sortBy === "advance") return b.advanceNum - a.advanceNum;
      if (sortBy === "pending") return b.pending - a.pending;
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "month") return b.month.localeCompare(a.month);
      if (sortBy === "dueDate") return (a.dueDate || "").localeCompare(b.dueDate || "");
      return 0;
    });

  const totalPayroll = filteredSalaries.reduce((acc, curr) => acc + curr.netPayNum, 0);
  const paidAmount = filteredSalaries.filter(s => s.status === "Paid").reduce((acc, curr) => acc + curr.netPayNum, 0);
  const pendingAmount = filteredSalaries.filter(s => s.status === "Pending").reduce((acc, curr) => acc + curr.pending, 0);
  const totalAdvance = filteredSalaries.reduce((acc, curr) => acc + curr.advanceNum, 0);

  const months = Array.from(new Set(salaries.map(s => s.month)));

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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-salary-title">Salary Management</h2>
            <p className="text-muted-foreground text-sm md:text-base">Process monthly payroll, record advances, and view payment history.</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, staff ID..."
                className="pl-9 w-full sm:w-[220px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-salary-search"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1 sm:w-[160px]" data-testid="select-salary-month">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">All Months</SelectItem>
                  {months.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 sm:w-[160px]" data-testid="select-salary-sort">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="staffId">Staff ID</SelectItem>
                  <SelectItem value="salary">Salary (High-Low)</SelectItem>
                  <SelectItem value="advance">Advance (High-Low)</SelectItem>
                  <SelectItem value="pending">Net Payable (High-Low)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold" data-testid="text-total-payroll">{cs}{totalPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground hidden md:block">For selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-green-600" data-testid="text-paid-amount">{cs}{paidAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground hidden md:block">{filteredSalaries.filter(s => s.status === "Paid").length} Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-amber-600" data-testid="text-pending-amount">{cs}{pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground hidden md:block">{filteredSalaries.filter(s => s.status === "Pending").length} Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Advance</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-blue-600" data-testid="text-total-advance">{cs}{totalAdvance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground hidden md:block">Advance payments given</p>
            </CardContent>
          </Card>
        </div>

        {selectedSalaries.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary">{selectedSalaries.length} selected</span>
            </div>
            <Button onClick={handleBulkPay} size="sm" className="bg-green-600 hover:bg-green-700" data-testid="button-bulk-pay">
              <DollarSign className="mr-2 h-4 w-4" />
              Mark Selected as Paid
            </Button>
          </div>
        )}

        <div className="block md:hidden space-y-3">
          {filteredSalaries.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No salary records found for this period.
              </CardContent>
            </Card>
          )}
          {filteredSalaries.map((salary) => (
            <Card key={salary.id} data-testid={`card-salary-${salary.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {salary.photo ? (
                      <img src={salary.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
                    <div>
                      <span className="font-medium block">{salary.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{salary.role}</span>
                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">{salary.employeeId}</Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={salary.status === "Paid" ? "default" : "secondary"} className={salary.status === "Paid" ? "bg-green-600 hover:bg-green-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                    {salary.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month</span>
                    <span className="font-mono text-xs">{salary.month}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="font-medium">{cs}{salary.netPayNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advance</span>
                    <span className={salary.advanceNum > 0 ? "font-medium text-blue-600" : "text-muted-foreground"}>{cs}{salary.advanceNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EMI</span>
                    <span className={salary.instalmentDeduction > 0 ? "font-medium text-purple-600" : "text-muted-foreground"}>{cs}{salary.instalmentDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Payable</span>
                    <span className={`font-medium ${salary.pending > 0 ? "text-amber-600" : "text-green-600"}`}>{cs}{salary.pending.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due</span>
                    <span className="text-xs">{salary.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t">
                  {salary.status === "Pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openAdvanceDialog(salary)} className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50" data-testid={`button-advance-m-${salary.id}`}>
                        <Banknote className="mr-1 h-3 w-3" />
                        Advance
                      </Button>
                      <Button size="sm" onClick={() => handlePay(salary.id)} className="bg-green-600 hover:bg-green-700 h-8 px-3" data-testid={`button-pay-m-${salary.id}`}>
                        <DollarSign className="mr-1 h-3 w-3" />
                        Pay
                      </Button>
                    </>
                  )}
                  {salary.status === "Paid" && (
                    <Button variant="outline" size="sm" onClick={() => handleRevert(salary.id)} className="h-8 px-3 text-amber-600 border-amber-200 hover:bg-amber-50" data-testid={`button-revert-m-${salary.id}`}>
                      <Undo className="mr-1 h-3 w-3" />
                      Revert
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" data-testid={`button-delete-salary-m-${salary.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Salary Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the salary record for {salary.name}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(salary.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Payroll List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={filteredSalaries.length > 0 && selectedSalaries.length === filteredSalaries.length}
                      onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                    />
                  </TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Total Salary</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>EMI Deduction</TableHead>
                  <TableHead>Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalaries.map((salary) => (
                  <TableRow key={salary.id} data-testid={`row-salary-${salary.id}`}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedSalaries.includes(salary.id)}
                        onCheckedChange={() => toggleSelect(salary.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{salary.employeeId}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {salary.photo ? (
                          <img src={salary.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted" />
                        )}
                        <div>
                          <span className="font-medium block">{salary.name}</span>
                          <span className="text-xs text-muted-foreground">{salary.role}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{salary.month}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{cs}{salary.netPayNum.toLocaleString()}</TableCell>
                    <TableCell className={salary.advanceNum > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                      {cs}{salary.advanceNum.toLocaleString()}
                    </TableCell>
                    <TableCell className={salary.instalmentDeduction > 0 ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                      {cs}{salary.instalmentDeduction.toLocaleString()}
                    </TableCell>
                    <TableCell className={`font-medium ${salary.pending > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {cs}{salary.pending.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={salary.status === "Paid" ? "default" : "secondary"} className={salary.status === "Paid" ? "bg-green-600 hover:bg-green-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{salary.dueDate}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{salary.paymentDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {salary.status === "Pending" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openAdvanceDialog(salary)} className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50" data-testid={`button-advance-${salary.id}`} title="Record Advance">
                              <Banknote className="mr-1 h-3 w-3" />
                              Advance
                            </Button>
                            <Button size="sm" onClick={() => handlePay(salary.id)} className="bg-green-600 hover:bg-green-700 h-8 px-2" data-testid={`button-pay-${salary.id}`}>
                              <DollarSign className="mr-1 h-3 w-3" />
                              Pay
                            </Button>
                          </>
                        )}
                        {salary.status === "Paid" && (
                          <Button variant="outline" size="sm" onClick={() => handleRevert(salary.id)} className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50" data-testid={`button-revert-${salary.id}`}>
                            <Undo className="mr-1 h-3 w-3" />
                            Revert
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" data-testid={`button-delete-salary-${salary.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Salary Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the salary record for {salary.name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(salary.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSalaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No salary records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </div>
      )}

      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Advance Payment</DialogTitle>
            <DialogDescription>
              Record an advance taken by {advanceSalary?.name} against their {advanceSalary?.month} salary.
            </DialogDescription>
          </DialogHeader>
          {advanceSalary && (() => {
            const activeAdvances = staffAdvancesData.filter((a: any) => a.staffId === advanceSalary.staffId && a.status === "Active");
            const advanceAmt = Number(advanceInput) || 0;
            const numInst = Number(numberOfInstalments) || 0;
            const calculatedInstalment = useInstalments && numInst > 1 ? Math.round((advanceAmt / numInst) * 100) / 100 : 0;
            return (
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Salary</span>
                <span className="font-medium">{cs}{advanceSalary.netPayNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Previous Advance</span>
                <span className="font-medium text-blue-600">{cs}{advanceSalary.advanceNum.toLocaleString()}</span>
              </div>
              {advanceSalary.instalmentDeduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">EMI Deduction</span>
                  <span className="font-medium text-purple-600">{cs}{advanceSalary.instalmentDeduction.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Currently Pending</span>
                <span className="font-bold text-amber-600">{cs}{advanceSalary.pending.toLocaleString()}</span>
              </div>
            </div>

            {activeAdvances.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-md border border-purple-200 space-y-2">
                <p className="text-sm font-medium text-purple-800">Active Advance Instalments</p>
                {activeAdvances.map((adv: any) => (
                  <div key={adv.id} className="text-xs text-purple-700 space-y-1 bg-white/60 p-2 rounded border border-purple-100">
                    <div className="flex justify-between">
                      <span>Total Advance</span>
                      <span className="font-medium">{cs}{Number(adv.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Instalment</span>
                      <span className="font-medium">{cs}{Number(adv.instalmentAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Balance</span>
                      <span className="font-medium">{cs}{Number(adv.remainingBalance).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instalments Remaining</span>
                      <span className="font-medium">{adv.remainingInstalments} of {adv.totalInstalments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Advance Amount <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{cs}</span>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="Enter advance amount" 
                  className="pl-8"
                  value={advanceInput} 
                  onChange={e => setAdvanceInput(e.target.value)} 
                  data-testid="input-advance-amount"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
              <Checkbox
                id="use-instalments"
                checked={useInstalments}
                onCheckedChange={(checked) => {
                  setUseInstalments(checked as boolean);
                  if (!checked) setNumberOfInstalments("");
                }}
                data-testid="checkbox-use-instalments"
              />
              <Label htmlFor="use-instalments" className="text-sm cursor-pointer">
                Repay via monthly instalments
              </Label>
            </div>

            {useInstalments && (
              <div className="space-y-3 pl-2 border-l-2 border-purple-300 ml-2">
                <div className="space-y-2">
                  <Label>Number of Instalments <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    min="2" 
                    max="60"
                    placeholder="e.g. 4" 
                    value={numberOfInstalments} 
                    onChange={e => setNumberOfInstalments(e.target.value)} 
                    data-testid="input-number-of-instalments"
                  />
                </div>
                {advanceAmt > 0 && numInst > 1 && (
                  <div className="bg-purple-50 p-3 rounded-md border border-purple-200 text-sm space-y-1">
                    <div className="flex justify-between text-purple-800">
                      <span>Monthly Instalment</span>
                      <span className="font-bold">{cs}{calculatedInstalment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 text-xs">
                      <span>Deduction Period</span>
                      <span>{numInst} months starting next month</span>
                    </div>
                    <p className="text-purple-600 text-xs mt-1">
                      {cs}{calculatedInstalment.toLocaleString()} will be automatically deducted from salary each month until the full advance of {cs}{advanceAmt.toLocaleString()} is recovered.
                    </p>
                  </div>
                )}
              </div>
            )}

            {advanceAmt > 0 && !useInstalments && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm space-y-1">
                {advanceAmt + advanceSalary.advanceNum >= advanceSalary.netPayNum ? (
                  <>
                    <p className="text-blue-800 font-medium">This will mark the salary as PAID.</p>
                    {advanceAmt + advanceSalary.advanceNum > advanceSalary.netPayNum && (
                      <p className="text-blue-700">
                        Excess of {cs}{(advanceAmt + advanceSalary.advanceNum - advanceSalary.netPayNum).toLocaleString()} will be carried forward as advance to next month's salary.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-blue-700">
                    After this advance, remaining pending salary will be {cs}{(advanceSalary.pending - advanceAmt).toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAdvanceSubmit} 
              disabled={advanceMutation.isPending}
              className={useInstalments ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}
              data-testid="button-submit-advance"
            >
              {advanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {useInstalments ? "Create Advance with Instalments" : "Record Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
