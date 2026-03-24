import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, FileSpreadsheet, Upload, Download, X, FileText, CheckCheck, Ban, AlertCircle, Clock, Lock, ArrowUpDown } from "lucide-react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.pdf";

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `"${file.name}" exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" is not a supported format. Use PDF, JPEG, PNG, WebP, or GIF.`;
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

function fmtNum(v: string | number) {
  const n = parseFloat(String(v));
  return isNaN(n) ? "" : String(n);
}

function isEmptyRow(e: Expense) {
  return !e.category && !e.item && (parseFloat(String(e.price)) || 0) === 0;
}
function isZeroPriceRow(e: Expense) {
  return !isEmptyRow(e) && (parseFloat(String(e.price)) || 0) === 0;
}

/* ── Status icon button group ── */
function StatusButtons({ status, onChange, disabled }: { status: string; onChange: (s: string) => void; disabled?: boolean }) {
  const btns = [
    { value: "Paid",     icon: CheckCheck, activeClass: "bg-green-500 text-white hover:bg-green-600", idleClass: "text-green-600 hover:bg-green-50", title: "Mark Paid" },
    { value: "Pending",  icon: Clock,      activeClass: "bg-amber-400 text-white hover:bg-amber-500", idleClass: "text-amber-600 hover:bg-amber-50", title: "Mark Pending" },
    { value: "Rejected", icon: Ban,        activeClass: "bg-red-500 text-white hover:bg-red-600",   idleClass: "text-red-600 hover:bg-red-50",   title: "Mark Rejected" },
  ];
  return (
    <div className="flex items-center gap-0.5">
      {btns.map(({ value, icon: Icon, activeClass, idleClass, title }) => (
        <button
          key={value}
          title={title}
          disabled={disabled}
          onClick={() => !disabled && onChange(value)}
          className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${status === value ? activeClass : idleClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          data-testid={`btn-status-${value.toLowerCase()}`}
        >
          <Icon className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

/* ── Delete with inline confirmation ── */
function DeleteButton({ onDelete, disabled }: { onDelete: () => void; disabled: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded px-1 py-0.5">
        <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Sure?</span>
        <button className="text-green-600 hover:text-green-800 p-0.5" onClick={() => { setConfirming(false); onDelete(); }}><CheckCheck className="h-3 w-3" /></button>
        <button className="text-muted-foreground hover:text-foreground p-0.5" onClick={() => setConfirming(false)}><X className="h-3 w-3" /></button>
      </div>
    );
  }
  return (
    <button
      className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-500 rounded"
      onClick={() => setConfirming(true)}
      disabled={disabled}
      title="Delete row"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

/* ── Shared row logic hook ── */
function useRowState(expense: Expense, onUpdate: (id: number, data: Record<string, any>) => void) {
  const [localItem, setLocalItem] = useState(expense.item);
  const [localQty, setLocalQty] = useState(expense.qty);
  const [localPrice, setLocalPrice] = useState(fmtNum(expense.price));
  const [localTotal, setLocalTotal] = useState(fmtNum(expense.total));
  const [uploading, setUploading] = useState(false);

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

  return { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur };
}

/* ─── Desktop table row ─── */
function ExpenseRow({ serialNo, expense, role, onUpdate, onDelete, isDeleting, categorySubs, categoryItems, taxableTypes, isSelected, onSelect }: {
  serialNo: number; expense: Expense; role: string;
  onUpdate: (id: number, data: Record<string, any>) => void;
  onDelete: (id: number) => void; isDeleting: boolean;
  categorySubs: Record<string, string[]>; categoryItems: Record<string, Record<string, string[]>>;
  taxableTypes: Set<string>; isSelected: boolean; onSelect: (id: number, checked: boolean) => void;
}) {
  const { toast } = useToast();
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur } = useRowState(expense, onUpdate);

  const locked = expense.status === "Paid";
  const isTaxable = (cat: string) => taxableTypes.has(cat);
  const hasFile = !!(expense as any).receiptFileName;
  const zeroPriceWarn = isZeroPriceRow(expense);
  const numInput = "h-7 w-full text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast({ title: "File not accepted", description: err, variant: "destructive" }); e.target.value = ""; return; }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      onUpdate(expense.id, { hasReceipt: true, receiptFileName: file.name, receiptFile: base64 });
    } finally { setUploading(false); }
    e.target.value = "";
  };

  const rowBg = locked ? "bg-green-50/40" : zeroPriceWarn ? "bg-amber-50/60" : "";

  return (
    <TableRow className={`hover:bg-muted/10 ${rowBg}`}>
      <TableCell className="p-1 text-center">
        <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(expense.id, !!c)} disabled={locked} />
      </TableCell>
      <TableCell className="p-1 text-center text-xs text-muted-foreground font-medium">
        {locked ? <Lock className="h-3 w-3 mx-auto text-green-500" /> : serialNo}
      </TableCell>
      <TableCell className="p-1">
        <Input type="date" defaultValue={expense.date} onBlur={(e) => { if (!locked && e.target.value !== expense.date) onUpdate(expense.id, { date: e.target.value }); }} className="h-7 w-full text-sm" disabled={locked} />
      </TableCell>
      <TableCell className="p-1">
        <Select value={expense.category || ""} onValueChange={(val) => !locked && onUpdate(expense.id, { category: val, subCategory: categorySubs[val]?.[0] || "" })} disabled={locked}>
          <SelectTrigger className="h-7 w-full text-sm" disabled={locked}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{Object.keys(categorySubs).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-1">
        <Select value={expense.subCategory || ""} onValueChange={(val) => { if (!locked) { setLocalItem(""); onUpdate(expense.id, { subCategory: val, item: "" }); } }} disabled={locked}>
          <SelectTrigger className="h-7 w-full text-sm" disabled={locked}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{(categorySubs[expense.category] || []).map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-1">
        {expense.subCategory === "Others" || !(categoryItems[expense.category]?.[expense.subCategory]?.length) ? (
          <Input value={localItem} onChange={(e) => !locked && setLocalItem(e.target.value)} onBlur={() => !locked && handleBlur('item', localItem)} className="h-7 w-full text-sm font-medium" placeholder="Item" disabled={locked} />
        ) : (
          <Select value={expense.item || ""} onValueChange={(val) => { if (!locked) { setLocalItem(val); onUpdate(expense.id, { item: val }); } }} disabled={locked}>
            <SelectTrigger className="h-7 w-full text-sm font-medium" disabled={locked}><SelectValue placeholder="Select item" /></SelectTrigger>
            <SelectContent>{(categoryItems[expense.category]?.[expense.subCategory] || []).map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="p-1">
        <Input value={localQty} inputMode="numeric" onChange={(e) => !locked && setLocalQty(e.target.value.replace(/[^0-9]/g, ""))} onBlur={() => !locked && handleBlur('qty', localQty)} className={numInput} placeholder="1" disabled={locked} />
      </TableCell>
      <TableCell className="p-1">
        <Input value={localPrice} inputMode="decimal" onChange={(e) => !locked && setLocalPrice(e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d{0,2}).*$/, "$1"))} onBlur={() => !locked && handleBlur('price', localPrice)} className={`${numInput} ${zeroPriceWarn ? "border-amber-400 bg-amber-50" : ""}`} placeholder="0.00" disabled={locked} />
      </TableCell>
      <TableCell className="p-1">
        <Input value={localTotal} readOnly className={`${numInput} bg-muted/20 font-bold`} placeholder="0.00" />
      </TableCell>
      <TableCell className="p-1 text-center">
        <input type="file" ref={rowFileInputRef} className="hidden" accept={ALLOWED_EXTENSIONS} onChange={handleFileChange} />
        {isTaxable(expense.category) && (
          <div className="flex flex-col items-center gap-0.5">
            <button className={`h-7 w-7 flex items-center justify-center rounded ${hasFile ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-primary bg-primary/10 hover:bg-primary/20'}`}
              title={hasFile ? `Download: ${(expense as any).receiptFileName}` : "Upload Tax Invoice"}
              onClick={() => { if (hasFile && (expense as any).receiptFile) downloadBase64File((expense as any).receiptFile, (expense as any).receiptFileName); else rowFileInputRef.current?.click(); }}
              disabled={uploading}>
              {hasFile ? <Download className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            </button>
            {hasFile && (
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] text-green-600 max-w-[50px] truncate leading-tight" title={(expense as any).receiptFileName}>{(expense as any).receiptFileName}</span>
                {!locked && <button className="text-red-400 hover:text-red-600 shrink-0" onClick={() => onUpdate(expense.id, { hasReceipt: false, receiptFileName: null, receiptFile: null })}><X className="h-2.5 w-2.5" /></button>}
              </div>
            )}
            {!hasFile && !locked && <button className="text-[9px] text-muted-foreground underline mt-0.5" onClick={() => rowFileInputRef.current?.click()}>upload</button>}
          </div>
        )}
      </TableCell>
      <TableCell className="p-1">
        <StatusButtons status={expense.status} onChange={(s) => onUpdate(expense.id, { status: s })} disabled={role === "manager" && expense.status === "Paid"} />
      </TableCell>
      <TableCell className="p-1 text-center">
        {!locked && (role === "owner" || (role === "manager" && expense.status === "Pending")) && (
          <DeleteButton onDelete={() => onDelete(expense.id)} disabled={isDeleting} />
        )}
      </TableCell>
    </TableRow>
  );
}

/* ─── Mobile card ─── */
const MOBILE_CARD_BG: Record<string, string> = {
  Paid:     "bg-green-50 border-green-300",
  Pending:  "bg-amber-50 border-amber-300",
  Rejected: "bg-rose-50 border-rose-300",
};

function MobileExpenseCard({ expense, serialNo, role, onUpdate, onDelete, isDeleting, categorySubs, categoryItems, taxableTypes, isSelected, onSelect }: {
  serialNo: number; expense: Expense; role: string;
  onUpdate: (id: number, data: Record<string, any>) => void;
  onDelete: (id: number) => void; isDeleting: boolean;
  categorySubs: Record<string, string[]>; categoryItems: Record<string, Record<string, string[]>>;
  taxableTypes: Set<string>; isSelected: boolean; onSelect: (id: number, checked: boolean) => void;
}) {
  const { toast } = useToast();
  const rowFileInputRef = useRef<HTMLInputElement>(null);
  const { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur } = useRowState(expense, onUpdate);

  const locked = expense.status === "Paid";
  const isTaxable = (cat: string) => taxableTypes.has(cat);
  const hasFile = !!(expense as any).receiptFileName;
  const zeroPriceWarn = isZeroPriceRow(expense);
  const numInput = "h-8 w-full text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const cardBg = MOBILE_CARD_BG[expense.status] || "bg-muted/10 border-border";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast({ title: "File not accepted", description: err, variant: "destructive" }); e.target.value = ""; return; }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      onUpdate(expense.id, { hasReceipt: true, receiptFileName: file.name, receiptFile: base64 });
    } finally { setUploading(false); }
    e.target.value = "";
  };

  return (
    <div className={`border-2 rounded-xl mx-3 mb-3 overflow-hidden ${cardBg}`} data-testid={`card-expense-${expense.id}`}>
      {/* Card header strip */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
        <div className="flex items-center gap-2 min-w-0">
          <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(expense.id, !!c)} disabled={locked} />
          {locked
            ? <Lock className="h-3.5 w-3.5 text-green-600 shrink-0" />
            : <span className="text-xs font-medium text-muted-foreground shrink-0">#{serialNo}</span>
          }
          {expense.category && <span className="text-xs font-bold truncate">{expense.category}{expense.subCategory ? ` · ${expense.subCategory}` : ""}</span>}
          {zeroPriceWarn && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusButtons status={expense.status} onChange={(s) => onUpdate(expense.id, { status: s })} disabled={role === "manager" && locked} />
          {!locked && (role === "owner" || (role === "manager" && expense.status === "Pending")) && (
            <DeleteButton onDelete={() => onDelete(expense.id)} disabled={isDeleting} />
          )}
        </div>
      </div>

      {/* Card body */}
      <div className={`p-3 space-y-2.5 ${locked ? "opacity-70 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Date</label>
            <Input type="date" defaultValue={expense.date} onBlur={(e) => { if (e.target.value !== expense.date) onUpdate(expense.id, { date: e.target.value }); }} className="h-9 w-full text-sm" disabled={locked} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Category</label>
            <Select value={expense.category || ""} onValueChange={(val) => onUpdate(expense.id, { category: val, subCategory: categorySubs[val]?.[0] || "" })} disabled={locked}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{Object.keys(categorySubs).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Sub-Category</label>
            <Select value={expense.subCategory || ""} onValueChange={(val) => { setLocalItem(""); onUpdate(expense.id, { subCategory: val, item: "" }); }} disabled={locked}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{(categorySubs[expense.category] || []).map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Item</label>
            {expense.subCategory === "Others" || !(categoryItems[expense.category]?.[expense.subCategory]?.length) ? (
              <Input value={localItem} onChange={(e) => setLocalItem(e.target.value)} onBlur={() => handleBlur('item', localItem)} className="h-9 w-full text-sm" placeholder="Item description" disabled={locked} />
            ) : (
              <Select value={expense.item || ""} onValueChange={(val) => { setLocalItem(val); onUpdate(expense.id, { item: val }); }} disabled={locked}>
                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(categoryItems[expense.category]?.[expense.subCategory] || []).map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Qty</label>
            <Input value={localQty} inputMode="numeric" onChange={(e) => setLocalQty(e.target.value.replace(/[^0-9]/g, ""))} onBlur={() => handleBlur('qty', localQty)} className={numInput} placeholder="1" disabled={locked} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Price</label>
            <Input value={localPrice} inputMode="decimal" onChange={(e) => setLocalPrice(e.target.value.replace(/[^0-9.]/g, "").replace(/^(\d*\.?\d{0,2}).*$/, "$1"))} onBlur={() => handleBlur('price', localPrice)} className={`${numInput} ${zeroPriceWarn ? "border-amber-400" : ""}`} placeholder="0.00" disabled={locked} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Total</label>
            <Input value={localTotal} readOnly className={`${numInput} bg-white/60 font-bold`} placeholder="0.00" />
          </div>
        </div>

        {isTaxable(expense.category) && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Tax Receipt</label>
            <input type="file" ref={rowFileInputRef} className="hidden" accept={ALLOWED_EXTENSIONS} onChange={handleFileChange} />
            <div className="flex items-center gap-2">
              <button className={`flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium ${hasFile ? "border-green-300 text-green-700 bg-white/70" : "border-border bg-white/50 text-foreground"}`}
                onClick={() => { if (hasFile && (expense as any).receiptFile) downloadBase64File((expense as any).receiptFile, (expense as any).receiptFileName); else rowFileInputRef.current?.click(); }}
                disabled={uploading || locked}>
                {hasFile ? <><Download className="h-3.5 w-3.5" /><span className="max-w-[90px] truncate">{(expense as any).receiptFileName}</span></> : <><Upload className="h-3.5 w-3.5" />Upload Receipt</>}
              </button>
              {hasFile && !locked && <button className="text-red-400 hover:text-red-600" onClick={() => onUpdate(expense.id, { hasReceipt: false, receiptFileName: null, receiptFile: null })}><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sort/Filter bar (shared between mobile and desktop) ─── */
type SortKey = "none" | "date-asc" | "date-desc" | "amount-asc" | "amount-desc";

function FilterSortBar({ filterStatus, setFilterStatus, sortKey, setSortKey }: {
  filterStatus: string; setFilterStatus: (s: string) => void;
  sortKey: SortKey; setSortKey: (s: SortKey) => void;
}) {
  const statusFilters = ["All", "Pending", "Paid", "Rejected"];
  const statusColors: Record<string, string> = {
    All: "bg-primary text-primary-foreground",
    Pending: "bg-amber-400 text-white",
    Paid: "bg-green-500 text-white",
    Rejected: "bg-red-500 text-white",
  };
  const inactiveColors: Record<string, string> = {
    All: "border-border text-foreground hover:bg-muted",
    Pending: "border-amber-200 text-amber-700 hover:bg-amber-50",
    Paid: "border-green-200 text-green-700 hover:bg-green-50",
    Rejected: "border-red-200 text-red-700 hover:bg-red-50",
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-muted/5">
      {/* Status chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {statusFilters.map(s => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            className={`h-6 px-2.5 text-[11px] font-medium rounded-full border transition-colors ${filterStatus === s ? statusColors[s] : inactiveColors[s]}`}
          >{s}</button>
        ))}
      </div>

      {/* Sort */}
      <div className="ml-auto flex items-center gap-1">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs border rounded px-1.5 py-0.5 bg-background text-foreground h-6 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="none">Sort: Default</option>
          <option value="date-asc">Date ↑</option>
          <option value="date-desc">Date ↓</option>
          <option value="amount-asc">Amount ↑</option>
          <option value="amount-desc">Amount ↓</option>
        </select>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [recordDate, setRecordDate] = useState(today);
  const [displayOrder, setDisplayOrder] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("none");
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({ queryKey: ['/api/expenses'] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ['/api/categories'] });
  const { data: dailyFiles = [] } = useQuery<ExpenseDailyFile[]>({
    queryKey: ['/api/expense-daily-files', recordDate],
    queryFn: async () => { const res = await apiRequest('GET', `/api/expense-daily-files?recordDate=${recordDate}`); return res.json(); },
  });

  useEffect(() => {
    setDisplayOrder(prev => {
      const existingIds = new Set(prev);
      const newIds = expenses.map(e => e.id).filter(id => !existingIds.has(id));
      const currentIds = new Set(expenses.map(e => e.id));
      return [...prev.filter(id => currentIds.has(id)), ...newIds];
    });
  }, [expenses]);

  const orderedExpenses = useMemo(() => {
    const map = new Map(expenses.map(e => [e.id, e]));
    return displayOrder.map(id => map.get(id)).filter(Boolean) as Expense[];
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
    mutationFn: async (expense: Omit<Expense, 'id' | 'createdAt'>) => { const res = await apiRequest('POST', '/api/expenses', expense); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: any }) => { const res = await apiRequest('PATCH', `/api/expenses/${id}`, data); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/expenses/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
  const addDailyFileMutation = useMutation({
    mutationFn: async (payload: { recordDate: string; fileName: string; fileType: string; fileData: string }) => { const res = await apiRequest('POST', '/api/expense-daily-files', payload); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expense-daily-files', recordDate] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });
  const deleteDailyFileMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest('DELETE', `/api/expense-daily-files/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expense-daily-files', recordDate] }),
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const baseExpenses = orderedExpenses.filter(e => e.recordDate === recordDate);
  const totalAmount = baseExpenses.reduce((sum, e) => sum + (parseFloat(e.total as string) || 0), 0);

  const visibleExpenses = useMemo(() => {
    let list = filterStatus === "All" ? baseExpenses : baseExpenses.filter(e => e.status === filterStatus);
    if (sortKey === "date-asc") list = [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    else if (sortKey === "date-desc") list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    else if (sortKey === "amount-asc") list = [...list].sort((a, b) => (parseFloat(String(a.total)) || 0) - (parseFloat(String(b.total)) || 0));
    else if (sortKey === "amount-desc") list = [...list].sort((a, b) => (parseFloat(String(b.total)) || 0) - (parseFloat(String(a.total)) || 0));
    return list;
  }, [baseExpenses, filterStatus, sortKey]);

  const handleAddRow = () => {
    addExpenseMutation.mutate({ date: recordDate, recordDate, category: "", subCategory: "", item: "", qty: "1", price: "0", total: "0", status: "Pending", hasReceipt: false });
  };
  const handleUpdate = useCallback((id: number, data: Record<string, any>) => { updateExpenseMutation.mutate({ id, ...data }); }, []);
  const handleDelete = useCallback((id: number) => {
    deleteExpenseMutation.mutate(id);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);
  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => { const next = new Set(prev); checked ? next.add(id) : next.delete(id); return next; });
  }, []);
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(visibleExpenses.filter(e => e.status !== "Paid").map(e => e.id)) : new Set());
  };
  const handleBulkStatus = async (status: string) => {
    const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && e.status !== "Paid").map(e => e.id);
    await Promise.all(ids.map(id => updateExpenseMutation.mutateAsync({ id, status })));
    toast({ title: `${ids.length} row(s) marked as ${status}` });
    setSelectedIds(new Set());
  };
  const handleBulkDelete = async () => {
    const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && e.status !== "Paid").map(e => e.id);
    await Promise.all(ids.map(id => deleteExpenseMutation.mutateAsync(id)));
    toast({ title: `${ids.length} row(s) deleted` });
    setSelectedIds(new Set());
  };
  const handleSave = async () => {
    const empty = baseExpenses.filter(isEmptyRow);
    const zeroPrice = baseExpenses.filter(isZeroPriceRow);
    if (empty.length > 0) {
      await Promise.all(empty.map(e => deleteExpenseMutation.mutateAsync(e.id)));
      toast({ title: `${empty.length} empty row(s) removed` });
    }
    if (zeroPrice.length > 0) {
      toast({ title: "Price missing on some rows", description: `${zeroPrice.length} row(s) have zero price. Please enter the cost.`, variant: "destructive" });
      return;
    }
    toast({ title: "Sheet Saved", description: "All changes saved successfully." });
  };
  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const errors: string[] = [], validFiles: File[] = [];
    for (const file of files) { const err = validateFile(file); if (err) errors.push(err); else validFiles.push(file); }
    if (errors.length > 0) toast({ title: "Some files rejected", description: errors.join(" "), variant: "destructive" });
    for (const file of validFiles) {
      const base64 = await fileToBase64(file);
      await addDailyFileMutation.mutateAsync({ recordDate, fileName: file.name, fileType: file.type || "application/octet-stream", fileData: base64 });
    }
    if (validFiles.length > 0) toast({ title: "Files Uploaded", description: `${validFiles.length} file(s) saved.` });
    e.target.value = "";
  };

  if (expensesLoading) {
    return <AdminLayout role={role}><div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading expenses…</div></div></AdminLayout>;
  }

  const selectableExpenses = visibleExpenses.filter(e => e.status !== "Paid");
  const allSelected = selectableExpenses.length > 0 && selectableExpenses.every(e => selectedIds.has(e.id));
  const someSelected = selectedIds.size > 0;
  const sharedRowProps = { role, onUpdate: handleUpdate, onDelete: handleDelete, isDeleting: deleteExpenseMutation.isPending, categorySubs, categoryItems, taxableTypes };

  return (
    <AdminLayout role={role}>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-expenses-title">Expenses & Purchases</h2>
            <p className="text-sm text-muted-foreground">Manage daily expenditures.</p>
          </div>
          <Button onClick={handleSave} data-testid="button-save-expenses" className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save Daily Sheet
          </Button>
        </div>

        <Card>
          {/* ── Card header ── */}
          <CardHeader className="pb-0 border-b bg-muted/20 px-3 sm:px-5 pt-3">
            {/* Row 1: title + total */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600 shrink-0" />
                <CardTitle className="text-base">Daily Expense Sheet</CardTitle>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Total</span>
                <span className="text-xl font-bold font-serif text-primary" data-testid="text-total-amount">{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Row 2: Record Date + Upload Files (side by side on all screens) */}
            <div className="flex flex-wrap items-center gap-3 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Record Date:</span>
                <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-36 h-8 bg-background" data-testid="input-record-date" />
              </div>
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <input type="file" ref={bulkFileInputRef} className="hidden" accept={ALLOWED_EXTENSIONS} multiple onChange={handleBulkFileChange} />
                <Button variant="outline" size="sm" className="h-8" onClick={() => bulkFileInputRef.current?.click()} disabled={addDailyFileMutation.isPending} data-testid="button-upload-files">
                  <Upload className="mr-1.5 h-3.5 w-3.5" />{addDailyFileMutation.isPending ? "Uploading…" : "Upload Files"}
                </Button>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{dailyFiles.length > 0 ? `${dailyFiles.length} file(s)` : "No files"}</span>
              </div>
            </div>

            {/* Uploaded files list */}
            {dailyFiles.length > 0 && (
              <div className="pb-3 border-t pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Uploaded for {recordDate}</p>
                <div className="flex flex-wrap gap-1.5">
                  {dailyFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1">
                      <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="max-w-[110px] truncate text-xs" title={file.fileName}>{file.fileName}</span>
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => downloadBase64File(file.fileData, file.fileName)}><Download className="h-3 w-3" /></button>
                      {role === "owner" && <button className="text-red-400 hover:text-red-600" onClick={() => deleteDailyFileMutation.mutate(file.id)}><X className="h-3 w-3" /></button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/10 border-b gap-2 flex-wrap">
              {someSelected ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">{selectedIds.size} selected</span>
                  {role === "owner" && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleBulkStatus("Paid")}><CheckCheck className="mr-1 h-3.5 w-3.5" />Approve</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleBulkStatus("Rejected")}><Ban className="mr-1 h-3.5 w-3.5" />Reject</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50" onClick={handleBulkDelete}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                    </>
                  )}
                  <button className="text-xs text-muted-foreground underline" onClick={() => setSelectedIds(new Set())}>Clear</button>
                </div>
              ) : <div />}
              <Button onClick={handleAddRow} disabled={addExpenseMutation.isPending} className="h-8 text-sm font-semibold shadow-sm" data-testid="button-add-expense">
                <Plus className="mr-1.5 h-4 w-4" /> Add Line Item
              </Button>
            </div>

            {/* ── Filter / Sort bar (both views) ── */}
            <FilterSortBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} sortKey={sortKey} setSortKey={setSortKey} />

            {/* ── Mobile card view ── */}
            <div className="block md:hidden py-2">
              {visibleExpenses.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 text-sm">
                  {filterStatus !== "All" ? `No ${filterStatus} expenses on ${recordDate}.` : `No expenses on ${recordDate}. Tap Add Line Item to start.`}
                </div>
              ) : (
                visibleExpenses.map((expense, index) => (
                  <MobileExpenseCard key={expense.id} serialNo={index + 1} expense={expense} isSelected={selectedIds.has(expense.id)} onSelect={handleSelect} {...sharedRowProps} />
                ))
              )}
            </div>

            {/* ── Desktop table view ── */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="table-fixed w-full">
                <colgroup>
                  <col style={{width:"30px"}} />
                  <col style={{width:"28px"}} />
                  <col style={{width:"120px"}} />
                  <col style={{width:"128px"}} />
                  <col style={{width:"120px"}} />
                  <col style={{minWidth:"155px"}} />
                  <col style={{width:"58px"}} />
                  <col style={{width:"78px"}} />
                  <col style={{width:"78px"}} />
                  <col style={{width:"76px"}} />
                  <col style={{width:"90px"}} />
                  <col style={{width:"36px"}} />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="p-1 text-center"><Checkbox checked={allSelected} onCheckedChange={handleSelectAll} data-testid="checkbox-select-all" /></TableHead>
                    <TableHead className="p-1 text-center text-xs">#</TableHead>
                    <TableHead className="p-1 text-xs">Date</TableHead>
                    <TableHead className="p-1 text-xs">Category</TableHead>
                    <TableHead className="p-1 text-xs">Sub-Cat</TableHead>
                    <TableHead className="p-1 text-xs">Item</TableHead>
                    <TableHead className="p-1 text-xs">Qty</TableHead>
                    <TableHead className="p-1 text-xs">Price</TableHead>
                    <TableHead className="p-1 text-xs">Total</TableHead>
                    <TableHead className="p-1 text-xs text-center">Receipt</TableHead>
                    <TableHead className="p-1 text-xs">Status</TableHead>
                    <TableHead className="p-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExpenses.map((expense, index) => (
                    <ExpenseRow key={expense.id} serialNo={index + 1} expense={expense} isSelected={selectedIds.has(expense.id)} onSelect={handleSelect} {...sharedRowProps} />
                  ))}
                  {visibleExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                        {filterStatus !== "All" ? `No ${filterStatus} expenses on ${recordDate}.` : <>No expenses on {recordDate}. Click <strong>Add Line Item</strong> to start.</>}
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
