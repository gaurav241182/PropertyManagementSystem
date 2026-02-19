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
import { DollarSign, CheckCircle2, Clock, CalendarDays, Filter, Undo, Trash2, Loader2, Banknote } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$", JPY: "¥", CNY: "¥", AED: "د.إ", SGD: "S$",
};

function getEndOfMonth(monthStr: string): string {
  if (!monthStr) return "-";
  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return "-";
  const lastDay = new Date(year, month, 0);
  return lastDay.toISOString().split("T")[0];
}

export default function AdminSalaries({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: salariesData = [], isLoading: salariesLoading } = useQuery<any[]>({ queryKey: ['/api/salaries'] });
  const { data: staffData = [], isLoading: staffLoading } = useQuery<any[]>({ queryKey: ['/api/staff'] });
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });
  const currency = (settingsData as Record<string, string>)?.currency || "USD";
  const cs = CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency || "$";

  const staffMap = new Map(staffData.map((s: any) => [s.id, s]));

  const salaries = salariesData.map((s: any) => {
    const staffMember = staffMap.get(s.staffId);
    const netPay = Number(s.netPay) || 0;
    const advanceAmount = Number(s.advanceAmount) || 0;
    const pending = s.status === "Paid" ? 0 : Math.max(0, netPay - advanceAmount);
    const dueDate = s.dueDate || getEndOfMonth(s.month);
    return {
      ...s,
      name: staffMember?.name || `Staff #${s.staffId}`,
      role: staffMember?.role || "Unknown",
      photo: staffMember?.photo || null,
      netPayNum: netPay,
      advanceNum: advanceAmount,
      pending,
      dueDate,
      paymentDate: s.paidDate || "-",
    };
  });

  const isLoading = salariesLoading || staffLoading;

  const [selectedMonth, setSelectedMonth] = useState("current");
  const [selectedSalaries, setSelectedSalaries] = useState<number[]>([]);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceSalary, setAdvanceSalary] = useState<any>(null);
  const [advanceInput, setAdvanceInput] = useState("");

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
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      apiRequest("POST", `/api/salaries/${id}/advance`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
      toast({ title: "Advance Recorded", description: "Advance payment has been applied to the salary." });
      setAdvanceDialogOpen(false);
      setAdvanceInput("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePay = (id: number) => {
    updateSalaryMutation.mutate({
      id,
      data: { status: "Paid", paidDate: new Date().toISOString().split('T')[0] }
    }, {
      onSuccess: () => {
        toast({ title: "Salary Paid", description: "Employee salary has been marked as paid." });
      }
    });
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
    setAdvanceDialogOpen(true);
  };

  const handleAdvanceSubmit = () => {
    const amount = Number(advanceInput);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid advance amount.", variant: "destructive" });
      return;
    }
    if (advanceSalary) {
      advanceMutation.mutate({ id: advanceSalary.id, amount });
    }
  };

  const filteredSalaries = salaries.filter(s => {
    if (selectedMonth === "current") return true;
    return s.month === selectedMonth;
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
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-salary-title">Salary Management</h2>
            <p className="text-muted-foreground">Process monthly payroll, record advances, and view payment history.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]" data-testid="select-salary-month">
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
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-payroll">{cs}{totalPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">For selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-paid-amount">{cs}{paidAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredSalaries.filter(s => s.status === "Paid").length} Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-amount">{cs}{pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredSalaries.filter(s => s.status === "Pending").length} Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Advance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-total-advance">{cs}{totalAdvance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Advance payments given</p>
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
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Total Salary</TableHead>
                  <TableHead>Advance</TableHead>
                  <TableHead>Pending</TableHead>
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
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No salary records found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      )}

      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Advance Payment</DialogTitle>
            <DialogDescription>
              Record an advance taken by {advanceSalary?.name} against their {advanceSalary?.month} salary.
            </DialogDescription>
          </DialogHeader>
          {advanceSalary && (
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
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Currently Pending</span>
                <span className="font-bold text-amber-600">{cs}{advanceSalary.pending.toLocaleString()}</span>
              </div>
            </div>

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

            {Number(advanceInput) > 0 && (
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm space-y-1">
                {Number(advanceInput) + advanceSalary.advanceNum >= advanceSalary.netPayNum ? (
                  <>
                    <p className="text-blue-800 font-medium">This will mark the salary as PAID.</p>
                    {Number(advanceInput) + advanceSalary.advanceNum > advanceSalary.netPayNum && (
                      <p className="text-blue-700">
                        Excess of {cs}{(Number(advanceInput) + advanceSalary.advanceNum - advanceSalary.netPayNum).toLocaleString()} will be carried forward as advance to next month's salary.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-blue-700">
                    After this advance, remaining pending salary will be {cs}{(advanceSalary.pending - Number(advanceInput)).toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAdvanceSubmit} 
              disabled={advanceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-submit-advance"
            >
              {advanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
