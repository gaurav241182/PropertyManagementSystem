import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState([
    { id: 1, date: "2024-02-16", recordDate: "2024-02-16", category: "Grocery", subCategory: "Vegetables", item: "Onions", qty: "5", price: 10, total: 50, status: "Pending" },
    { id: 2, date: "2024-02-16", recordDate: "2024-02-16", category: "Utility", subCategory: "Cleaning", item: "Floor Cleaner", qty: "2", price: 25, total: 50, status: "Paid" },
    { id: 3, date: "2024-02-15", recordDate: "2024-02-15", category: "Grocery", subCategory: "Dairy", item: "Milk", qty: "10", price: 5, total: 50, status: "Paid" },
    { id: 4, date: "2024-02-15", recordDate: "2024-02-15", category: "Maintenance", subCategory: "Plumbing", item: "Pipe Fixing", qty: "1", price: 150, total: 150, status: "Rejected" },
  ]);

  const CATEGORY_SUBS: Record<string, string[]> = {
    "Grocery": ["Vegetables", "Dairy", "Meat", "Spices", "Grains", "Beverages"],
    "Utility": ["Electricity", "Water", "Internet", "Cleaning", "Gas"],
    "Maintenance": ["Plumbing", "Electrical", "Carpenter", "Painting", "AC Repair"],
    "Staff": ["Salary", "Bonus", "Uniform", "Training", "Transport"],
    "Other": ["Marketing", "Stationery", "Travel", "Miscellaneous"]
  };

  const handleAddRow = () => {
    const newId = Math.max(...expenses.map(e => e.id), 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    setExpenses([
      ...expenses, 
      { id: newId, date: today, recordDate: today, category: "Grocery", subCategory: "Vegetables", item: "", qty: "1", price: 0, total: 0, status: "Pending" }
    ]);
  };

  const handleRemoveRow = (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const updateExpense = (id: number, field: string, value: any) => {
    setExpenses(expenses.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        // Auto-calculate total if price or qty changes
        if (field === 'price' || field === 'qty') {
           // Simple parse for mock calculation, assuming numeric inputs mostly
           const p = field === 'price' ? parseFloat(value) || 0 : e.price;
           const q = field === 'qty' ? parseFloat(value) || 1 : parseFloat(e.qty) || 1; 
           // Note: qty is string "5kg" in mock, so this auto-calc is simplified. 
           // For prototype, we'll just try to parse or leave it. 
           // Let's improve the mock data to use numeric qty if we want calc, or just let user type total.
           // For this "Excel" view, auto-calc is nice.
           updated.total = p * q;
        }
        return updated;
      }
      return e;
    }));
  };

  const handleSaveChanges = () => {
    toast({
      title: "Expenses Saved",
      description: "All changes have been updated successfully.",
    });
  };

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Expenses & Purchases</h2>
              <p className="text-muted-foreground">Manage daily expenditures in a spreadsheet view.</p>
            </div>
            <div className="flex gap-2">
               <Button onClick={handleSaveChanges}>
                 <Save className="mr-2 h-4 w-4" /> Save Daily Sheet
               </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <CardTitle>Daily Expense Sheet</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-muted-foreground">Record Date:</span>
                    <Input 
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]} 
                      className="w-40 h-8 bg-background" 
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Daily Receipts</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <Upload className="mr-2 h-3.5 w-3.5" /> Upload Files
                        </Button>
                        <span className="text-xs text-muted-foreground">0 files attached</span>
                      </div>
                   </div>
                   <div className="h-10 w-px bg-border hidden md:block"></div>
                   <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total Amount</span>
                      <span className="text-2xl font-bold font-serif text-primary">
                        {expenses.reduce((sum, e) => sum + (e.total || 0), 0).toLocaleString()}
                      </span>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2 flex justify-end bg-muted/10 border-b">
                 <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-primary hover:text-primary hover:bg-primary/10">
                   <Plus className="mr-2 h-4 w-4" /> Add Line Item
                 </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[140px]">Category</TableHead>
                      <TableHead className="w-[140px]">Sub-Category</TableHead>
                      <TableHead className="min-w-[200px]">Item Name</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[130px]">Status</TableHead>
                      {role === "owner" && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-muted/10">
                        <TableCell className="p-2">
                          <Select 
                            value={expense.category} 
                            onValueChange={(val) => {
                               updateExpense(expense.id, 'category', val);
                               // Reset subcategory when category changes
                               updateExpense(expense.id, 'subCategory', CATEGORY_SUBS[val]?.[0] || "");
                            }}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(CATEGORY_SUBS).map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Select 
                            value={expense.subCategory} 
                            onValueChange={(val) => updateExpense(expense.id, 'subCategory', val)}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(CATEGORY_SUBS[expense.category] || []).map(sub => (
                                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            value={expense.item} 
                            onChange={(e) => updateExpense(expense.id, 'item', e.target.value)}
                            className="h-8 w-full font-medium"
                            placeholder="Item Description"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            value={expense.qty} 
                            onChange={(e) => updateExpense(expense.id, 'qty', e.target.value)}
                            className="h-8 w-full"
                            placeholder="1"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="relative">
                            <Input 
                              type="number"
                              value={expense.price} 
                              onChange={(e) => updateExpense(expense.id, 'price', e.target.value)}
                              className="h-8 w-full"
                              placeholder="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="relative">
                            <Input 
                              type="number"
                              value={expense.total} 
                              onChange={(e) => updateExpense(expense.id, 'total', parseFloat(e.target.value))}
                              className="h-8 w-full bg-muted/20 font-bold"
                              placeholder="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="p-2">
                          <Select 
                            value={expense.status} 
                            onValueChange={(val) => updateExpense(expense.id, 'status', val)}
                            disabled={role === "manager"}
                          >
                            <SelectTrigger className={`h-8 w-full ${
                              expense.status === 'Paid' ? 'text-green-600 border-green-200 bg-green-50' : 
                              expense.status === 'Pending' ? 'text-amber-600 border-amber-200 bg-amber-50' : ''
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {role === "owner" && (
                          <TableCell className="p-2 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                              onClick={() => handleRemoveRow(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
      </div>
    </AdminLayout>
  );
}