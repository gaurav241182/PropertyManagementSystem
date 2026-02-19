import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, CheckCircle2, Clock, CalendarDays, Filter, Undo, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminSalaries({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const { data: salariesData = [], isLoading: salariesLoading } = useQuery<any[]>({ queryKey: ['/api/salaries'] });
  const { data: staffData = [], isLoading: staffLoading } = useQuery<any[]>({ queryKey: ['/api/staff'] });

  const staffMap = new Map(staffData.map((s: any) => [s.id, s]));

  const salaries = salariesData.map((s: any) => {
    const staffMember = staffMap.get(s.staffId);
    const amount = Number(s.netPay) || 0;
    const deductions = Number(s.deductions) || 0;
    return {
      ...s,
      name: staffMember?.name || `Staff #${s.staffId}`,
      role: staffMember?.role || "Unknown",
      amount,
      advance: deductions,
      pending: s.status === "Paid" ? 0 : amount - deductions,
      paymentDate: s.paidDate || "-",
      dueDate: "-",
    };
  });

  const isLoading = salariesLoading || staffLoading;

  const [selectedMonth, setSelectedMonth] = useState("current");
  const [selectedSalaries, setSelectedSalaries] = useState<number[]>([]);

  const updateSalaryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/salaries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salaries'] });
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
      toast({
        title: "Record Deleted",
        description: "Salary record has been permanently removed.",
      });
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

  const filteredSalaries = salaries.filter(s => {
    if (selectedMonth === "current") return true; // Show all or default logic
    return s.month === selectedMonth;
  });

  // Calculate totals for the filtered view
  const totalPayroll = filteredSalaries.reduce((acc, curr) => acc + curr.amount, 0);
  const paidAmount = filteredSalaries.filter(s => s.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = filteredSalaries.filter(s => s.status === "Pending").reduce((acc, curr) => acc + curr.amount, 0);

  // Get unique months for filter
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
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Salary Management</h2>
            <p className="text-muted-foreground">Process monthly payroll and view payment history.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                {!months.includes("February 2024") && <SelectItem value="February 2024">February 2024</SelectItem>}
              </SelectContent>
            </Select>
            <Button variant="outline">
               <Filter className="mr-2 h-4 w-4" />
               Filter
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">For Selected Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredSalaries.filter(s => s.status === "Paid").length} Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{filteredSalaries.filter(s => s.status === "Pending").length} Employees</p>
            </CardContent>
          </Card>
        </div>

        {selectedSalaries.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary">{selectedSalaries.length} selected</span>
            </div>
            <Button onClick={handleBulkPay} size="sm" className="bg-green-600 hover:bg-green-700">
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
                  <TableHead>Role</TableHead>
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
                  <TableRow key={salary.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedSalaries.includes(salary.id)}
                        onCheckedChange={() => toggleSelect(salary.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{salary.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{salary.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{salary.role}</TableCell>
                    <TableCell className="font-medium">${salary.amount}</TableCell>
                    <TableCell className="text-muted-foreground">${salary.advance || 0}</TableCell>
                    <TableCell className="font-medium text-amber-600">${salary.pending !== undefined ? salary.pending : (salary.status === 'Paid' ? 0 : salary.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={salary.status === "Paid" ? "default" : "secondary"} className={salary.status === "Paid" ? "bg-green-600 hover:bg-green-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{salary.dueDate || "2024-03-05"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                       {salary.paymentDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {salary.status === "Pending" ? (
                           <Button size="sm" onClick={() => handlePay(salary.id)} className="bg-green-600 hover:bg-green-700 h-8 px-2">
                             <DollarSign className="mr-1 h-3 w-3" />
                             Pay
                           </Button>
                        ) : (
                           <Button variant="outline" size="sm" onClick={() => handleRevert(salary.id)} className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50">
                             <Undo className="mr-1 h-3 w-3" />
                             Revert
                           </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
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
                      No salary records found for this month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      )}
    </AdminLayout>
  );
}