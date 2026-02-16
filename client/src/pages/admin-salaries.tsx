import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, CheckCircle2, Clock, CalendarDays, Filter } from "lucide-react";

export default function AdminSalaries({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [salaries, setSalaries] = useState([
    { id: 1, name: "John Doe", role: "Manager", month: "February 2024", amount: 2500, status: "Paid", paymentDate: "2024-02-28" },
    { id: 2, name: "Jane Smith", role: "Chef", month: "February 2024", amount: 1800, status: "Pending", paymentDate: "-" },
    { id: 3, name: "Mike Johnson", role: "Housekeeping", month: "February 2024", amount: 1200, status: "Pending", paymentDate: "-" },
    { id: 4, name: "Emily Davis", role: "Receptionist", month: "February 2024", amount: 1400, status: "Paid", paymentDate: "2024-02-28" },
  ]);

  const [selectedMonth, setSelectedMonth] = useState("current"); // Default to current or closest

  // Load generated salaries from localStorage on mount
  useEffect(() => {
    const generated = localStorage.getItem("generatedSalaries");
    if (generated) {
      const newRecords = JSON.parse(generated);
      // Determine if we need to merge or replace. For simplicity in mock, let's append unique ones
      setSalaries(prev => {
        const prevIds = new Set(prev.map(p => p.id));
        const uniqueNew = newRecords.filter((nr: any) => !prevIds.has(nr.id));
        return [...prev, ...uniqueNew];
      });
      
      // If we found generated records, try to select that month
      if (newRecords.length > 0) {
        setSelectedMonth(newRecords[0].month);
      }
    }
  }, []);

  const handlePay = (id: number) => {
    setSalaries(salaries.map(s => s.id === id ? { ...s, status: "Paid", paymentDate: new Date().toISOString().split('T')[0] } : s));
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

        <Card>
          <CardHeader>
            <CardTitle>Payroll List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{salary.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{salary.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{salary.role}</TableCell>
                    <TableCell className="font-medium">${salary.amount}</TableCell>
                    <TableCell>
                      <Badge variant={salary.status === "Paid" ? "default" : "secondary"} className={salary.status === "Paid" ? "bg-green-600 hover:bg-green-700" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                        {salary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                       {salary.paymentDate}
                    </TableCell>
                    <TableCell className="text-right">
                      {salary.status === "Pending" ? (
                         <Button size="sm" onClick={() => handlePay(salary.id)} className="bg-green-600 hover:bg-green-700">
                           <DollarSign className="mr-1 h-3 w-3" />
                           Mark Paid
                         </Button>
                      ) : (
                         <Button variant="ghost" size="sm" disabled>
                           <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />
                           Paid
                         </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSalaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No salary records found for this month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}