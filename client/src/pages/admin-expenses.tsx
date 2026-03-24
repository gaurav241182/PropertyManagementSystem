import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, FileSpreadsheet, Upload, Paperclip, Download, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense, Category, ExpenseDailyFile } from "@shared/schema";

const FALLBACK_CATEGORY_SUBS: Record<string, string[]> = {
  "Grocery": ["Vegetables", "Dairy", "Meat", "Spices", "Grains", "Beverages"],
  "Utility": ["Electricity", "Water", "Internet", "Cleaning", "Gas"],
  "Maintenance": ["Plumbing", "Electrical", "Carpenter", "Painting", "AC Repair"],
  "Staff": ["Salary", "Bonus", "Uniform", "Training", "Transport"],
  "Asset": ["Electronics", "Furniture", "Appliances", "Machinery"],
  "Other": ["Marketing", "Stationery", "Travel", "Miscellaneous"]
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.pdf";

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported format. Please use PDF, JPEG, PNG, WebP, or GIF.`;
  }
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadBase64File(fileData: string, fileName: string) {
  const a = document.createElement("a");
  a.href = fileData;
  a.download = fileName;
  a.click();
}

function ExpenseRow({ serialNo, expense, role, onUpdate, onDelete, isDeleting, categorySubs, categoryItems, taxableTypes }: {
  serialNo: number;
  expense: Expense;
  role: string;
  onUpdate: (id: number, data: Record<string, any>) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  categorySubs: Record<string, string[]>;
  categoryItems: Record<string, Record<string, string[]>>;
  taxableTypes: Set<string>;
}) {
  const { toast } = useToast();
  const isTaxableCategory = (cat: string) => taxableTypes.has(cat);
  const fmtNum = (v: string | number) => {
    const n = parseFloat(String(v));
    return isNaN(n) ? "" : String(n);
  };

  const [localItem, setLocalItem] = useState(expense.item);
  const [localQty, setLocalQty] = useState(expense.qty);
  const [localPrice, setLocalPrice] = useState(fmtNum(expense.price));
  const [localTotal, setLocalTotal] = useState(fmtNum(expense.total));
  const [uploading, setUploading] = useState(false);
  const rowFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalItem(expense.item);
    setLocalQty(expense.qty);
    setLocalPrice(fmtNum(expense.price));
    setLocalTotal(fmtNum(expense.total));
  }, [expense.item, expense.qty, expense.price, expense.total]);

  const handleBlur = (field: string, value: string) => {
    const currentVal = field === 'item' ? expense.item
      : field === 'qty' ? expense.qty
      : field === 'price' ? fmtNum(expense.price)
      : fmtNum(expense.total);
    if (value === currentVal) return;
    const cleanVal = (field === 'price' || field === 'qty') ? fmtNum(value) || "0" : value;
    const updateData: Record<string, any> = { [field]: cleanVal };
    if (field === 'price' || field === 'qty') {
      const p = field === 'price' ? parseFloat(cleanVal) || 0 : parseFloat(fmtNum(expense.price)) || 0;
      const q = field === 'qty' ? parseFloat(cleanVal) || 1 : parseFloat(expense.qty) || 1;
      const newTotal = fmtNum(p * q);
      updateData.total = newTotal;
      setLocalTotal(newTotal);
      if (field === 'price') setLocalPrice(cleanVal);
      if (field === 'qty') setLocalQty(cleanVal);
    }
    onUpdate(expense.id, updateData);
  };

  const handleRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      toast({ title: "File not accepted", description: err, variant: "destructive" });
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      onUpdate(expense.id, { hasReceipt: true, receiptFileName: file.name, receiptFile: base64 });
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const hasFile = !!(expense as any).receiptFileName;

  return (
    <TableRow className="hover:bg-muted/10">
      <TableCell className="p-2 text-center text-xs text-muted-foreground font-medium w-10">
        {serialNo}
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="date"
          defaultValue={expense.date}
          onBlur={(e) => { if (e.target.value !== expense.date) onUpdate(expense.id, { date: e.target.value }); }}
          className="h-8 w-full"
          data-testid={`input-date-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Select value={expense.category || ""} onValueChange={(val) => onUpdate(expense.id, { category: val, subCategory: categorySubs[val]?.[0] || "" })}>
          <SelectTrigger className="h-8 w-full" data-testid={`select-category-${expense.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categorySubs).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2">
        <Select value={expense.subCategory || ""} onValueChange={(val) => { setLocalItem(""); onUpdate(expense.id, { subCategory: val, item: "" }); }}>
          <SelectTrigger className="h-8 w-full" data-testid={`select-subcategory-${expense.id}`}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(categorySubs[expense.category] || []).map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-2">
        {expense.subCategory === "Others" || !(categoryItems[expense.category]?.[expense.subCategory]?.length) ? (
          <Input value={localItem} onChange={(e) => setLocalItem(e.target.value)} onBlur={() => handleBlur('item', localItem)} className="h-8 w-full font-medium" placeholder="Item Description" data-testid={`input-item-${expense.id}`} />
        ) : (
          <Select value={expense.item || ""} onValueChange={(val) => { setLocalItem(val); onUpdate(expense.id, { item: val }); }}>
            <SelectTrigger className="h-8 w-full font-medium" data-testid={`select-item-${expense.id}`}>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {(categoryItems[expense.category]?.[expense.subCategory] || []).map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={localQty}
          inputMode="numeric"
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "");
            setLocalQty(v);
          }}
          onBlur={() => handleBlur('qty', localQty)}
          className="h-8 w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="1"
          data-testid={`input-qty-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={localPrice}
          inputMode="decimal"
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d{0,2}).*$/, "$1");
            setLocalPrice(v);
          }}
          onBlur={() => handleBlur('price', localPrice)}
          className="h-8 w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="0.00"
          data-testid={`input-price-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={localTotal}
          readOnly
          className="h-8 w-full bg-muted/20 font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="0.00"
          data-testid={`input-total-${expense.id}`}
        />
      </TableCell>
      <TableCell className="p-2 text-center">
        <input type="file" ref={rowFileInputRef} className="hidden" accept={ALLOWED_EXTENSIONS} onChange={handleRowFileChange} />
        {isTaxableCategory(expense.category) && (
          <div className="flex flex-col items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${hasFile ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-primary bg-primary/10 hover:bg-primary/20'}`}
              title={hasFile ? `Download: ${(expense as any).receiptFileName}` : "Upload Tax Invoice"}
              onClick={() => {
                if (hasFile && (expense as any).receiptFile) {
                  downloadBase64File((expense as any).receiptFile, (expense as any).receiptFileName);
                } else {
                  rowFileInputRef.current?.click();
                }
              }}
              disabled={uploading}
              data-testid={`button-upload-receipt-${expense.id}`}
            >
              {hasFile ? <Download className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </Button>
            {hasFile && (
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] text-green-600 max-w-[50px] truncate leading-tight" title={(expense as any).receiptFileName}>
                  {(expense as any).receiptFileName}
                </span>
                <button
                  className="text-red-400 hover:text-red-600 shrink-0"
                  title="Remove file"
                  onClick={() => onUpdate(expense.id, { hasReceipt: false, receiptFileName: null, receiptFile: null })}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            {!hasFile && (
              <button
                className="text-[9px] text-muted-foreground underline mt-0.5"
                onClick={() => rowFileInputRef.current?.click()}
              >
                upload
              </button>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="p-2">
        <Select value={expense.status} onValueChange={(val) => onUpdate(expense.id, { status: val })} disabled={role === "manager"}>
          <SelectTrigger className={`h-8 w-full ${expense.status === 'Paid' ? 'text-green-600 border-green-200 bg-green-50' : expense.status === 'Pending' ? 'text-amber-600 border-amber-200 bg-amber-50' : ''}`} data-testid={`select-status-${expense.id}`}>
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => onDelete(expense.id)} disabled={isDeleting} data-testid={`button-delete-expense-${expense.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [recordDate, setRecordDate] = useState(today);
  const [displayOrder, setDisplayOrder] = useState<number[]>([]);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: dailyFiles = [], refetch: refetchDailyFiles } = useQuery<ExpenseDailyFile[]>({
    queryKey: ['/api/expense-daily-files', recordDate],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/expense-daily-files?recordDate=${recordDate}`);
      return res.json();
    },
  });

  useEffect(() => {
    setDisplayOrder(prev => {
      const existingIds = new Set(prev);
      const newIds = expenses.map(e => e.id).filter(id => !existingIds.has(id));
      const currentIds = new Set(expenses.map(e => e.id));
      const filtered = prev.filter(id => currentIds.has(id));
      return [...filtered, ...newIds];
    });
  }, [expenses]);

  const orderedExpenses = useMemo(() => {
    const expenseMap = new Map(expenses.map(e => [e.id, e]));
    return displayOrder.map(id => expenseMap.get(id)).filter(Boolean) as Expense[];
  }, [displayOrder, expenses]);

  const categorySubs = useMemo(() => {
    if (categories.length === 0) return FALLBACK_CATEGORY_SUBS;
    const map: Record<string, string[]> = {};
    categories.forEach((cat: any) => {
      if (!map[cat.type]) map[cat.type] = [];
      if (cat.subtype && !map[cat.type].includes(cat.subtype)) map[cat.type].push(cat.subtype);
    });
    Object.keys(map).forEach(type => { if (!map[type].includes("Others")) map[type].push("Others"); });
    return map;
  }, [categories]);

  const categoryItems = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {};
    categories.forEach((cat: any) => {
      if (!map[cat.type]) map[cat.type] = {};
      if (!map[cat.type][cat.subtype]) map[cat.type][cat.subtype] = [];
      if (cat.item && !map[cat.type][cat.subtype].includes(cat.item)) map[cat.type][cat.subtype].push(cat.item);
    });
    return map;
  }, [categories]);

  const taxableTypes = useMemo(() => {
    if (categories.length === 0) return new Set(["Asset"]);
    const set = new Set<string>();
    categories.forEach((cat: any) => { if (cat.taxable) set.add(cat.type); });
    return set;
  }, [categories]);

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/expenses', expense);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => {
      const res = await apiRequest('PATCH', `/api/expenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/expenses/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const addDailyFileMutation = useMutation({
    mutationFn: async (payload: { recordDate: string; fileName: string; fileType: string; fileData: string }) => {
      const res = await apiRequest('POST', '/api/expense-daily-files', payload);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expense-daily-files', recordDate] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteDailyFileMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/expense-daily-files/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expense-daily-files', recordDate] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const visibleExpenses = orderedExpenses.filter(e => e.recordDate === recordDate);
  const totalAmount = visibleExpenses.reduce((sum, e) => sum + (parseFloat(e.total as string) || 0), 0);

  const handleAddRow = () => {
    addExpenseMutation.mutate({
      date: recordDate,
      recordDate: recordDate,
      category: "",
      subCategory: "",
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

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const errors: string[] = [];
    const validFiles: File[] = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) errors.push(err);
      else validFiles.push(file);
    }
    if (errors.length > 0) {
      toast({ title: "Some files were rejected", description: errors.join(" "), variant: "destructive" });
    }
    for (const file of validFiles) {
      const base64 = await fileToBase64(file);
      await addDailyFileMutation.mutateAsync({ recordDate, fileName: file.name, fileType: file.type || "application/octet-stream", fileData: base64 });
    }
    if (validFiles.length > 0) {
      toast({ title: "Files Uploaded", description: `${validFiles.length} file(s) saved for ${recordDate}.` });
    }
    e.target.value = "";
  };

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
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-40 h-8 bg-background"
                    data-testid="input-record-date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-muted-foreground">Daily Receipts</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={bulkFileInputRef}
                      className="hidden"
                      accept={ALLOWED_EXTENSIONS}
                      multiple
                      onChange={handleBulkFileChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => bulkFileInputRef.current?.click()}
                      disabled={addDailyFileMutation.isPending}
                      data-testid="button-upload-files"
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {addDailyFileMutation.isPending ? "Uploading..." : "Upload Files"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {dailyFiles.length > 0 ? `${dailyFiles.length} file(s)` : "0 files"}
                    </span>
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

            {dailyFiles.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Uploaded Files for {recordDate}</p>
                <div className="flex flex-wrap gap-2">
                  {dailyFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1 text-sm">
                      <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="max-w-[140px] truncate text-xs" title={file.fileName}>{file.fileName}</span>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                        onClick={() => downloadBase64File(file.fileData, file.fileName)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {role === "owner" && (
                        <button
                          className="text-red-400 hover:text-red-600"
                          title="Remove"
                          onClick={() => deleteDailyFileMutation.mutate(file.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-2 flex justify-end bg-muted/10 border-b">
              <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-primary hover:text-primary hover:bg-primary/10" disabled={addExpenseMutation.isPending} data-testid="button-add-expense">
                <Plus className="mr-2 h-4 w-4" /> Add Line Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <colgroup>
                  <col className="w-[40px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[140px]" />
                  <col style={{minWidth: "180px"}} />
                  <col className="w-[110px]" />
                  <col className="w-[140px]" />
                  <col className="w-[140px]" />
                  <col className="w-[90px]" />
                  <col className="w-[130px]" />
                  <col className="w-[50px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExpenses.map((expense, index) => (
                    <ExpenseRow
                      key={expense.id}
                      serialNo={index + 1}
                      expense={expense}
                      role={role}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      isDeleting={deleteExpenseMutation.isPending}
                      categorySubs={categorySubs}
                      categoryItems={categoryItems}
                      taxableTypes={taxableTypes}
                    />
                  ))}
                  {visibleExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        No expenses recorded on {recordDate}. Click "Add Line Item" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
