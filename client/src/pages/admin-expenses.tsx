import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, FileText, Check, X } from "lucide-react";

export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const [expenses] = useState([
    { id: 1, date: "2024-02-16", category: "Grocery", subCategory: "Vegetables", item: "Onions", qty: "5kg", price: 10, total: 50, hasBill: true, status: "Pending" },
    { id: 2, date: "2024-02-16", category: "Utility", subCategory: "Cleaning", item: "Floor Cleaner", qty: "2L", price: 25, total: 50, hasBill: false, status: "Paid" },
    { id: 3, date: "2024-02-15", category: "Grocery", subCategory: "Dairy", item: "Milk", qty: "10L", price: 5, total: 50, hasBill: true, status: "Paid" },
    { id: 4, date: "2024-02-15", category: "Maintenance", subCategory: "Plumbing", item: "Pipe Fixing", qty: "1", price: 150, total: 150, hasBill: true, status: "Rejected" },
  ]);

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Expenses & Purchases</h2>
            <p className="text-muted-foreground">Track daily expenditures, upload bills, and manage payments.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Daily Purchase</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grocery">Grocery</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="staff">Staff Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-category">Sub Category</Label>
                    <Input id="sub-category" placeholder="e.g. Vegetables" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="item">Item Name</Label>
                  <Input id="item" placeholder="e.g. Onions" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty">Qty/Unit</Label>
                    <Input id="qty" placeholder="5 kg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Unit Price</Label>
                    <Input id="price" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total">Total</Label>
                    <Input id="total" type="number" placeholder="0.00" readOnly className="bg-muted" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Bill Upload</Label>
                  <div className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Click to upload bill image (PDF/JPG)</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Save Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Expense Log</CardTitle>
            <CardDescription>Review and approve expenses submitted by staff.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Item Details</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-mono text-xs">{expense.date}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.category}</span>
                        <span className="text-xs text-muted-foreground">{expense.subCategory}</span>
                      </div>
                    </TableCell>
                    <TableCell>{expense.item}</TableCell>
                    <TableCell>{expense.qty}</TableCell>
                    <TableCell className="font-bold">${expense.total.toFixed(2)}</TableCell>
                    <TableCell>
                      {expense.hasBill ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        expense.status === "Paid" ? "border-green-500 text-green-700 bg-green-50" :
                        expense.status === "Pending" ? "border-amber-500 text-amber-700 bg-amber-50" :
                        "border-red-500 text-red-700 bg-red-50"
                      }>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Only show approval actions for owner or if manager is allowed to approve (usually higher role). 
                            Assuming manager CAN approve daily expenses or at least mark them. 
                            Let's keep it for both for now or restrict. 
                            Prompt didn't restrict manager from managing expenses, just said "Create expense list".
                            I will leave actions visible for now. */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X className="h-4 w-4" />
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