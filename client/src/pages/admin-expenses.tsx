import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense, Category } from "@shared/schema";

const FALLBACK_CATEGORY_SUBS: Record<string, string[]> = {
  "Grocery": ["Vegetables", "Dairy", "Meat", "Spices", "Grains", "Beverages"],
  "Utility": ["Electricity", "Water", "Internet", "Cleaning", "Gas"],
  "Maintenance": ["Plumbing", "Electrical", "Carpenter", "Painting", "AC Repair"],
  "Staff": ["Salary", "Bonus", "Uniform", "Training", "Transport"],
  "Asset": ["Electronics", "Furniture", "Appliances", "Machinery"],
  "Other": ["Marketing", "Stationery", "Travel", "Miscellaneous"]
};

function ExpenseRow({ expense, role, onUpdate, onDelete, isDeleting, categorySubs, taxableTypes }: {
  expense: Expense;
  role: string;
  onUpdate: (id: number, data: Record<string, any>) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  categorySubs: Record<string, string[]>;
  taxableTypes: Set<string>;
}) {
  const isTaxableCategory = (cat: string) => taxableTypes.has(cat);
  const [localItem, setLocalItem] = useState(expense.item);
  const [localQty, setLocalQty] = useState(expense.qty);
  const [localPrice, setLocalPrice] = useState(String(expense.price));
  const [localTotal, setLocalTotal] = useState(String(expense.total));

  useEffect(() => {
    setLocalItem(expense.item);
    setLocalQty(expense.qty);
    setLocalPrice(String(expense.price));
    setLocalTotal(String(expense.total));
  }, [expense.item, expense.qty, expense.price, expense.total]);

  const handleBlur = (field: string, value: string) => {
    const currentVal = field === 'item' ? expense.item
      : field === 'qty' ? expense.qty
      : field === 'price' ? String(expense.price)
      : String(expense.total);

    if (value === currentVal) return;

    const updateData: Record<string, any> = { [field]: value };
    if (field === 'price' || field === 'qty') {
      const p = field === 'price' ? parseFloat(value) || 0 : parseFloat(String(expense.price)) || 0;
      const q = field === 'qty' ? parseFloat(value) || 1 : parseFloat(expense.qty) || 1;
      const newTotal = String(p * q);
      updateData.total = newTotal;
      setLocalTotal(newTotal);
    }
    onUpdate(expense.id, updateData);
  };

  return (
    <TableRow className="hover:bg-muted/10">
      <TableCell className="p-2">
        <Input
          type="date"
          defaultValue={expense.date}
          onBlur={(e) => {
            if (e.target.value !== expense.date) {
              onUpdate(expense.id, { date: e.target.value });
            }
          }}
          className="h-8 w-full"
          data-testid={`input-date-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Select
          value={expense.category}
          onValueChange={(val) => {
            onUpdate(expense.id, { category: val, subCategory: categorySubs[val]?.[0] || "" });
          }}
        >
          <SelectTrigger className="h-8 w-full" data-testid={`select-category-${expense.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categorySubs).map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2">
        <Select
          value={expense.subCategory}
          onValueChange={(val) => onUpdate(expense.id, { subCategory: val })}
        >
          <SelectTrigger className="h-8 w-full" data-testid={`select-subcategory-${expense.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(categorySubs[expense.category] || []).map(sub => (
              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={localItem}
          onChange={(e) => setLocalItem(e.target.value)}
          onBlur={() => handleBlur('item', localItem)}
          className="h-8 w-full font-medium"
          placeholder="Item Description"
          data-testid={`input-item-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={localQty}
          onChange={(e) => setLocalQty(e.target.value)}
          onBlur={() => handleBlur('qty', localQty)}
          className="h-8 w-full"
          placeholder="1"
          data-testid={`input-qty-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="number"
          value={localPrice}
          onChange={(e) => setLocalPrice(e.target.value)}
          onBlur={() => handleBlur('price', localPrice)}
          className="h-8 w-full"
          placeholder="0"
          data-testid={`input-price-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="number"
          value={localTotal}
          onChange={(e) => setLocalTotal(e.target.value)}
          onBlur={() => handleBlur('total', localTotal)}
          className="h-8 w-full bg-muted/20 font-bold"
          placeholder="0"
          readOnly
          data-testid={`input-total-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2 text-center">
        {isTaxableCategory(expense.category) && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-primary/10 hover:bg-primary/20" title="Upload Tax Invoice" data-testid={`button-upload-receipt-${expense.id}`}>
            <Upload className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
      <TableCell className="p-2">
        <Select
          value={expense.status}
          onValueChange={(val) => onUpdate(expense.id, { status: val })}
          disabled={role === "manager"}
        >
          <SelectTrigger className={`h-8 w-full ${
            expense.status === 'Paid' ? 'text-green-600 border-green-200 bg-green-50' :
            expense.status === 'Pending' ? 'text-amber-600 border-amber-200 bg-amber-50' : ''
          }`} data-testid={`select-status-${expense.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2 text-center">
        {(role === "owner" || (role === "manager" && expense.status === "Pending")) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(expense.id)}
            disabled={isDeleting}
            data-testid={`button-delete-expense-${expense.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const categorySubs = useMemo(() => {
    if (categories.length === 0) return FALLBACK_CATEGORY_SUBS;
    const map: Record<string, string[]> = {};
    categories.forEach((cat: any) => {
      if (!map[cat.type]) map[cat.type] = [];
      if (cat.subtype && !map[cat.type].includes(cat.subtype)) {
        map[cat.type].push(cat.subtype);
      }
    });
    return map;
  }, [categories]);

  const taxableTypes = useMemo(() => {
    if (categories.length === 0) return new Set(["Asset"]);
    const set = new Set<string>();
    categories.forEach((cat: any) => {
      if (cat.taxable) set.add(cat.type);
    });
    return set;
  }, [categories]);

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/expenses', expense);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      const res = await apiRequest('PATCH', `/api/expenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const visibleExpenses = role === "owner"
    ? expenses
    : expenses.filter(e => e.recordDate === filterDate);

  const totalAmount = visibleExpenses.reduce((sum, e) => sum + (parseFloat(e.total as string) || 0), 0);

  const handleAddRow = () => {
    const dateToUse = role === "owner" ? new Date().toISOString().split('T')[0] : filterDate;

    addExpenseMutation.mutate({
      date: dateToUse,
      recordDate: dateToUse,
      category: Object.keys(categorySubs)[0] || "Grocery",
      subCategory: categorySubs[Object.keys(categorySubs)[0]]?.[0] || "",
      item: "",
      qty: "1",
      price: "0",
      total: "0",
      status: "Pending",
      hasReceipt: false,
    });
  };

  const handleUpdate = useCallback((id: number, data: Record<string, any>) => {
    updateExpenseMutation.mutate({ id, ...data });
  }, []);

  const handleDelete = useCallback((id: number) => {
    deleteExpenseMutation.mutate(id);
  }, []);

  if (expensesLoading) {
    return (
      <AdminLayout role={role}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading expenses...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role={role}>
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-expenses-title">Expenses & Purchases</h2>
              <p className="text-muted-foreground">Manage daily expenditures in a spreadsheet view.</p>
            </div>
            <div className="flex gap-2">
               <Button onClick={() => toast({ title: "Expenses Saved", description: "All changes have been updated successfully." })} data-testid="button-save-expenses">
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
                      data-testid="input-record-date"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium text-muted-foreground">Daily Receipts</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8" data-testid="button-upload-files">
                          <Upload className="mr-2 h-3.5 w-3.5" /> Upload Files
                        </Button>
                        <span className="text-xs text-muted-foreground">0 files attached</span>
                      </div>
                   </div>
                   <div className="h-10 w-px bg-border hidden md:block"></div>
                   <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total Amount</span>
                      <span className="text-2xl font-bold font-serif text-primary" data-testid="text-total-amount">
                        {totalAmount.toLocaleString()}
                      </span>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2 flex justify-end bg-muted/10 border-b">
                 <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-primary hover:text-primary hover:bg-primary/10" disabled={addExpenseMutation.isPending} data-testid="button-add-expense">
                   <Plus className="mr-2 h-4 w-4" /> Add Line Item
                 </Button>
              </div>
              <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[130px]">Purchase Date</TableHead>
                      <TableHead className="w-[140px]">Category</TableHead>
                      <TableHead className="w-[140px]">Sub-Category</TableHead>
                      <TableHead className="min-w-[200px]">Item Name</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[80px]">Receipt</TableHead>
                      <TableHead className="w-[130px]">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        role={role}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        isDeleting={deleteExpenseMutation.isPending}
                        categorySubs={categorySubs}
                        taxableTypes={taxableTypes}
                      />
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
