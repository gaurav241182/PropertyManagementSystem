import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Trash2, Save, FileSpreadsheet, Upload, Download, X, FileText,
  CheckCheck, Ban, AlertCircle, Clock, Lock, ArrowUpDown, SendHorizonal, SquareCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense, Category, ExpenseDailyFile } from "@shared/schema";

/* ─── Constants ─── */
const FALLBACK_CATEGORY_SUBS: Record<string, string[]> = {
  "Grocery": ["Vegetables", "Dairy", "Meat", "Spices", "Grains", "Beverages"],
  "Utility": ["Electricity", "Water", "Internet", "Cleaning", "Gas"],
  "Maintenance": ["Plumbing", "Electrical", "Carpenter", "Painting", "AC Repair"],
  "Staff": ["Salary", "Bonus", "Uniform", "Training", "Transport"],
  "Asset": ["Electronics", "Furniture", "Appliances", "Machinery"],
  "Other": ["Marketing", "Stationery", "Travel", "Miscellaneous"],
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.pdf";

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Pending:   { bg: "bg-amber-100",  text: "text-amber-700",  label: "Pending" },
  Submitted: { bg: "bg-blue-100",   text: "text-blue-700",   label: "Submitted" },
  Paid:      { bg: "bg-green-100",  text: "text-green-700",  label: "Paid" },
  Rejected:  { bg: "bg-red-100",    text: "text-red-700",    label: "Rejected" },
};

const MOBILE_CARD_BG: Record<string, string> = {
  Pending:   "bg-amber-50  border-amber-300",
  Submitted: "bg-blue-50   border-blue-300",
  Paid:      "bg-green-50  border-green-300",
  Rejected:  "bg-rose-50   border-rose-300",
};

/* ─── Helpers ─── */
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `"${file.name}" exceeds 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" must be PDF, JPEG, PNG, WebP, or GIF.`;
  return null;
}
function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
}
function downloadBase64File(data: string, name: string) {
  const a = document.createElement("a"); a.href = data; a.download = name; a.click();
}
function fmtNum(v: string | number) { const n = parseFloat(String(v)); return isNaN(n) ? "" : String(n); }
function isEmptyRow(e: Expense)     { return !e.category && !e.item && (parseFloat(String(e.price)) || 0) === 0; }
function isZeroPriceRow(e: Expense) { return !isEmptyRow(e) && (parseFloat(String(e.price)) || 0) === 0; }

/* ─── Status Badge (read-only display) ─── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] || { bg: "bg-muted", text: "text-muted-foreground", label: status };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

/* ─── Owner approve/reject buttons (shown only for Submitted rows) ─── */
function OwnerStatusButtons({ onChange }: { onChange: (s: string) => void }) {
  return (
    <div className="flex items-center gap-0.5" title="Approve or Reject">
      <button onClick={() => onChange("Paid")} title="Approve — Mark Paid"
        className="h-6 w-6 rounded flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
        <CheckCheck className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => onChange("Rejected")} title="Reject"
        className="h-6 w-6 rounded flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
        <Ban className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Delete with inline confirmation ─── */
function DeleteButton({ onDelete, disabled }: { onDelete: () => void; disabled: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <div className="flex items-center gap-0.5 bg-red-50 border border-red-200 rounded px-1 py-0.5">
      <span className="text-[10px] text-red-700 font-medium whitespace-nowrap">Sure?</span>
      <button className="text-green-600 hover:text-green-800 p-0.5" onClick={() => { setConfirming(false); onDelete(); }}><CheckCheck className="h-3 w-3" /></button>
      <button className="text-muted-foreground p-0.5" onClick={() => setConfirming(false)}><X className="h-3 w-3" /></button>
    </div>
  );
  return (
    <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-500 rounded"
      onClick={() => setConfirming(true)} disabled={disabled} title="Delete row">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─── Shared row state hook ─── */
function useRowState(expense: Expense, onUpdate: (id: number, d: Record<string, any>) => void) {
  const [localItem,  setLocalItem]  = useState(expense.item);
  const [localQty,   setLocalQty]   = useState(expense.qty);
  const [localPrice, setLocalPrice] = useState(fmtNum(expense.price));
  const [localTotal, setLocalTotal] = useState(fmtNum(expense.total));
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    setLocalItem(fmtNum(expense.item) === "" ? expense.item : expense.item);
    setLocalQty(expense.qty);
    setLocalPrice(fmtNum(expense.price));
    setLocalTotal(fmtNum(expense.total));
  }, [expense.item, expense.qty, expense.price, expense.total]);

  const handleBlur = (field: string, value: string) => {
    const cur = field === "item" ? expense.item : field === "qty" ? expense.qty : field === "price" ? fmtNum(expense.price) : fmtNum(expense.total);
    if (value === cur) return;
    const clean = (field === "price" || field === "qty") ? fmtNum(value) || "0" : value;
    const upd: Record<string, any> = { [field]: clean };
    if (field === "price" || field === "qty") {
      const p = field === "price" ? parseFloat(clean) || 0 : parseFloat(fmtNum(expense.price)) || 0;
      const q = field === "qty"   ? parseFloat(clean) || 1 : parseFloat(expense.qty)            || 1;
      const t = fmtNum(p * q);
      upd.total = t; setLocalTotal(t);
      if (field === "price") setLocalPrice(clean);
      if (field === "qty")   setLocalQty(clean);
    }
    onUpdate(expense.id, upd);
  };
  return { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur };
}

/* ─── Approval Summary Dialog ─── */
function ApprovalSummaryDialog({ expenses, recordDate, onConfirm, onClose }: {
  expenses: Expense[]; recordDate: string; onConfirm: () => void; onClose: () => void;
}) {
  const toSubmit = expenses.filter(e => e.status === "Pending" && !isEmptyRow(e));
  const zeroPriceItems = toSubmit.filter(isZeroPriceRow);
  const totalAmount = toSubmit.reduce((s, e) => s + (parseFloat(String(e.total)) || 0), 0);
  const catBreakdown = toSubmit.reduce((acc, e) => {
    const c = e.category || "Uncategorized";
    if (!acc[c]) acc[c] = { count: 0, total: 0 };
    acc[c].count++; acc[c].total += parseFloat(String(e.total)) || 0;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <SendHorizonal className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Submit for Approval</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Summary banner */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Record Date</p>
              <p className="text-sm font-semibold">{recordDate}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{toSubmit.length} item{toSubmit.length !== 1 ? "s" : ""}</p>
              <p className="text-2xl font-bold text-primary">{totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Zero price warning */}
          {zeroPriceItems.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700">Missing prices</p>
                <p className="text-xs text-amber-600">{zeroPriceItems.length} item(s) have a zero price. Please go back and fill in the cost before submitting.</p>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category Breakdown</p>
            {Object.keys(catBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground">No items ready to submit.</p>
            ) : (
              <div className="divide-y rounded-lg border overflow-hidden">
                {Object.entries(catBreakdown).map(([cat, { count, total }]) => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 bg-background">
                    <div>
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="text-xs text-muted-foreground ml-2">{count} item{count !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-sm font-bold">{total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Once submitted, all items will be locked for editing. The owner will review and approve or reject them.</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={toSubmit.length === 0 || zeroPriceItems.length > 0}
            onClick={onConfirm}
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            Submit {toSubmit.length} Item{toSubmit.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop table row ─── */
function ExpenseRow({ serialNo, expense, role, onUpdate, onDelete, isDeleting, categorySubs, categoryItems, taxableTypes, isSelected, onSelect }: {
  serialNo: number; expense: Expense; role: string;
  onUpdate: (id: number, d: Record<string, any>) => void;
  onDelete: (id: number) => void; isDeleting: boolean;
  categorySubs: Record<string, string[]>; categoryItems: Record<string, Record<string, string[]>>;
  taxableTypes: Set<string>; isSelected: boolean; onSelect: (id: number, c: boolean) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur } = useRowState(expense, onUpdate);

  const locked   = expense.status !== "Pending";
  const isTax    = (cat: string) => taxableTypes.has(cat);
  const hasFile  = !!(expense as any).receiptFileName;
  const zeroPWarn = isZeroPriceRow(expense);
  const num = "h-7 w-full text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const err = validateFile(f);
    if (err) { toast({ title: "File rejected", description: err, variant: "destructive" }); e.target.value = ""; return; }
    setUploading(true);
    try { onUpdate(expense.id, { hasReceipt: true, receiptFileName: f.name, receiptFile: await fileToBase64(f) }); }
    finally { setUploading(false); }
    e.target.value = "";
  };

  const rowBg = expense.status === "Paid" ? "bg-green-50/30"
    : expense.status === "Submitted" ? "bg-blue-50/30"
    : expense.status === "Rejected"  ? "bg-red-50/20"
    : zeroPWarn ? "bg-amber-50/60" : "";

  return (
    <TableRow className={`hover:bg-muted/10 ${rowBg}`}>
      <TableCell className="p-1 text-center">
        <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(expense.id, !!c)} disabled={locked} />
      </TableCell>
      <TableCell className="p-1 text-center text-xs text-muted-foreground font-medium">
        {locked ? <Lock className="h-3 w-3 mx-auto text-muted-foreground" /> : serialNo}
      </TableCell>
      <TableCell className="p-1"><Input type="date" defaultValue={expense.date} onBlur={(e) => { if (!locked && e.target.value !== expense.date) onUpdate(expense.id, { date: e.target.value }); }} className="h-7 w-full text-sm" disabled={locked} /></TableCell>
      <TableCell className="p-1">
        <Select value={expense.category || ""} onValueChange={(v) => !locked && onUpdate(expense.id, { category: v, subCategory: categorySubs[v]?.[0] || "" })} disabled={locked}>
          <SelectTrigger className="h-7 w-full text-sm" disabled={locked}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{Object.keys(categorySubs).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-1">
        <Select value={expense.subCategory || ""} onValueChange={(v) => { if (!locked) { setLocalItem(""); onUpdate(expense.id, { subCategory: v, item: "" }); } }} disabled={locked}>
          <SelectTrigger className="h-7 w-full text-sm" disabled={locked}><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{(categorySubs[expense.category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-1">
        {expense.subCategory === "Others" || !(categoryItems[expense.category]?.[expense.subCategory]?.length) ? (
          <Input value={localItem} onChange={(e) => !locked && setLocalItem(e.target.value)} onBlur={() => !locked && handleBlur("item", localItem)} className="h-7 w-full text-sm" placeholder="Item" disabled={locked} />
        ) : (
          <Select value={expense.item || ""} onValueChange={(v) => { if (!locked) { setLocalItem(v); onUpdate(expense.id, { item: v }); } }} disabled={locked}>
            <SelectTrigger className="h-7 w-full text-sm" disabled={locked}><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{(categoryItems[expense.category]?.[expense.subCategory] || []).map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="p-1"><Input value={localQty} inputMode="numeric" onChange={(e) => !locked && setLocalQty(e.target.value.replace(/[^0-9]/g,""))} onBlur={() => !locked && handleBlur("qty", localQty)} className={num} placeholder="1" disabled={locked} /></TableCell>
      <TableCell className="p-1"><Input value={localPrice} inputMode="decimal" onChange={(e) => !locked && setLocalPrice(e.target.value.replace(/[^0-9.]/g,"").replace(/^(\d*\.?\d{0,2}).*$/,"$1"))} onBlur={() => !locked && handleBlur("price", localPrice)} className={`${num} ${zeroPWarn ? "border-amber-400 bg-amber-50" : ""}`} placeholder="0.00" disabled={locked} /></TableCell>
      <TableCell className="p-1"><Input value={localTotal} readOnly className={`${num} bg-muted/20 font-bold`} placeholder="0.00" /></TableCell>
      <TableCell className="p-1 text-center">
        <input type="file" ref={fileRef} className="hidden" accept={ALLOWED_EXTENSIONS} onChange={onFile} />
        {isTax(expense.category) && (
          <div className="flex flex-col items-center gap-0.5">
            <button className={`h-7 w-7 flex items-center justify-center rounded ${hasFile ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-primary bg-primary/10 hover:bg-primary/20"}`}
              title={hasFile ? `Download ${(expense as any).receiptFileName}` : "Upload receipt"}
              onClick={() => { if (hasFile && (expense as any).receiptFile) downloadBase64File((expense as any).receiptFile, (expense as any).receiptFileName); else fileRef.current?.click(); }}
              disabled={uploading}>
              {hasFile ? <Download className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            </button>
            {hasFile && <div className="flex items-center gap-0.5">
              <span className="text-[9px] text-green-600 max-w-[50px] truncate" title={(expense as any).receiptFileName}>{(expense as any).receiptFileName}</span>
              {!locked && <button className="text-red-400 hover:text-red-600" onClick={() => onUpdate(expense.id, { hasReceipt: false, receiptFileName: null, receiptFile: null })}><X className="h-2.5 w-2.5" /></button>}
            </div>}
          </div>
        )}
      </TableCell>
      {/* Status column */}
      <TableCell className="p-1">
        {role === "owner" && expense.status === "Submitted"
          ? <OwnerStatusButtons onChange={(s) => onUpdate(expense.id, { status: s })} />
          : <StatusBadge status={expense.status} />
        }
      </TableCell>
      <TableCell className="p-1 text-center">
        {!locked && (role === "owner" || role === "manager") && (
          <DeleteButton onDelete={() => onDelete(expense.id)} disabled={isDeleting} />
        )}
      </TableCell>
    </TableRow>
  );
}

/* ─── Mobile card ─── */
function MobileExpenseCard({ expense, serialNo, role, onUpdate, onDelete, isDeleting, categorySubs, categoryItems, taxableTypes, isSelected, onSelect }: {
  serialNo: number; expense: Expense; role: string;
  onUpdate: (id: number, d: Record<string, any>) => void;
  onDelete: (id: number) => void; isDeleting: boolean;
  categorySubs: Record<string, string[]>; categoryItems: Record<string, Record<string, string[]>>;
  taxableTypes: Set<string>; isSelected: boolean; onSelect: (id: number, c: boolean) => void;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { localItem, setLocalItem, localQty, setLocalQty, localPrice, setLocalPrice, localTotal, uploading, setUploading, handleBlur } = useRowState(expense, onUpdate);

  const locked   = expense.status !== "Pending";
  const isTax    = (cat: string) => taxableTypes.has(cat);
  const hasFile  = !!(expense as any).receiptFileName;
  const zeroPWarn = isZeroPriceRow(expense);
  const num = "h-9 w-full text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const cardBg = MOBILE_CARD_BG[expense.status] || "bg-muted/10 border-border";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const err = validateFile(f);
    if (err) { toast({ title: "File rejected", description: err, variant: "destructive" }); e.target.value = ""; return; }
    setUploading(true);
    try { onUpdate(expense.id, { hasReceipt: true, receiptFileName: f.name, receiptFile: await fileToBase64(f) }); }
    finally { setUploading(false); }
    e.target.value = "";
  };

  return (
    <div className={`border-2 rounded-xl mx-3 mb-3 overflow-hidden ${cardBg}`} data-testid={`card-expense-${expense.id}`}>
      {/* Header strip */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!locked && <Checkbox checked={isSelected} onCheckedChange={(c) => onSelect(expense.id, !!c)} />}
          {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <span className="text-xs font-medium text-muted-foreground shrink-0">#{serialNo}</span>}
          {expense.category && <span className="text-xs font-bold truncate">{expense.category}{expense.subCategory ? ` · ${expense.subCategory}` : ""}</span>}
          {zeroPWarn && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {role === "owner" && expense.status === "Submitted"
            ? <OwnerStatusButtons onChange={(s) => onUpdate(expense.id, { status: s })} />
            : <StatusBadge status={expense.status} />
          }
          {!locked && (role === "owner" || role === "manager") && (
            <DeleteButton onDelete={() => onDelete(expense.id)} disabled={isDeleting} />
          )}
        </div>
      </div>

      {/* Body */}
      <div className={`p-3 space-y-2.5 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Date</label>
            <Input type="date" defaultValue={expense.date} onBlur={(e) => { if (e.target.value !== expense.date) onUpdate(expense.id, { date: e.target.value }); }} className="h-9 w-full text-sm" disabled={locked} />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Category</label>
            <Select value={expense.category || ""} onValueChange={(v) => onUpdate(expense.id, { category: v, subCategory: categorySubs[v]?.[0] || "" })} disabled={locked}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{Object.keys(categorySubs).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Sub-Category</label>
            <Select value={expense.subCategory || ""} onValueChange={(v) => { setLocalItem(""); onUpdate(expense.id, { subCategory: v, item: "" }); }} disabled={locked}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{(categorySubs[expense.category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Item</label>
            {expense.subCategory === "Others" || !(categoryItems[expense.category]?.[expense.subCategory]?.length) ? (
              <Input value={localItem} onChange={(e) => setLocalItem(e.target.value)} onBlur={() => handleBlur("item", localItem)} className="h-9 w-full text-sm" placeholder="Item" disabled={locked} />
            ) : (
              <Select value={expense.item || ""} onValueChange={(v) => { setLocalItem(v); onUpdate(expense.id, { item: v }); }} disabled={locked}>
                <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(categoryItems[expense.category]?.[expense.subCategory] || []).map(it => <SelectItem key={it} value={it}>{it}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Qty</label><Input value={localQty} inputMode="numeric" onChange={(e) => setLocalQty(e.target.value.replace(/[^0-9]/g,""))} onBlur={() => handleBlur("qty", localQty)} className={num} placeholder="1" disabled={locked} /></div>
          <div><label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Price</label><Input value={localPrice} inputMode="decimal" onChange={(e) => setLocalPrice(e.target.value.replace(/[^0-9.]/g,"").replace(/^(\d*\.?\d{0,2}).*$/,"$1"))} onBlur={() => handleBlur("price", localPrice)} className={`${num} ${zeroPWarn ? "border-amber-400" : ""}`} placeholder="0.00" disabled={locked} /></div>
          <div><label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Total</label><Input value={localTotal} readOnly className={`${num} bg-white/60 font-bold`} placeholder="0.00" /></div>
        </div>
        {isTax(expense.category) && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Tax Receipt</label>
            <input type="file" ref={fileRef} className="hidden" accept={ALLOWED_EXTENSIONS} onChange={onFile} />
            <div className="flex items-center gap-2">
              <button className={`flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium ${hasFile ? "border-green-300 text-green-700 bg-white/70" : "border-border bg-white/50"}`}
                onClick={() => { if (hasFile && (expense as any).receiptFile) downloadBase64File((expense as any).receiptFile, (expense as any).receiptFileName); else fileRef.current?.click(); }}
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

/* ─── Filter/Sort bar ─── */
type SortKey = "none" | "date-asc" | "date-desc" | "amount-asc" | "amount-desc";

function FilterSortBar({ filterStatus, setFilterStatus, sortKey, setSortKey }: {
  filterStatus: string; setFilterStatus: (s: string) => void;
  sortKey: SortKey; setSortKey: (s: SortKey) => void;
}) {
  const chips = [
    { label: "All",       active: "bg-primary text-primary-foreground",    idle: "border-border text-foreground hover:bg-muted" },
    { label: "Pending",   active: "bg-amber-400 text-white",               idle: "border-amber-200 text-amber-700 hover:bg-amber-50" },
    { label: "Submitted", active: "bg-blue-500 text-white",                idle: "border-blue-200 text-blue-700 hover:bg-blue-50" },
    { label: "Paid",      active: "bg-green-500 text-white",               idle: "border-green-200 text-green-700 hover:bg-green-50" },
    { label: "Rejected",  active: "bg-red-500 text-white",                 idle: "border-red-200 text-red-700 hover:bg-red-50" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b bg-muted/5">
      <div className="flex items-center gap-1 flex-wrap">
        {chips.map(({ label, active, idle }) => (
          <button key={label} onClick={() => setFilterStatus(label)}
            className={`h-6 px-2.5 text-[11px] font-medium rounded-full border transition-colors ${filterStatus === label ? active : idle}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs border rounded px-1.5 py-0.5 bg-background h-6 focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="none">Default</option>
          <option value="date-asc">Date ↑</option>
          <option value="date-desc">Date ↓</option>
          <option value="amount-asc">Amount ↑</option>
          <option value="amount-desc">Amount ↓</option>
        </select>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function AdminExpenses({ role = "owner" }: { role?: "owner" | "manager" }) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [recordDate, setRecordDate]     = useState(today);
  const [displayOrder, setDisplayOrder] = useState<number[]>([]);
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortKey, setSortKey]           = useState<SortKey>("none");
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: categories = [] }          = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: dailyFiles = [] }          = useQuery<ExpenseDailyFile[]>({
    queryKey: ["/api/expense-daily-files", recordDate],
    queryFn: async () => { const r = await apiRequest("GET", `/api/expense-daily-files?recordDate=${recordDate}`); return r.json(); },
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
    if (!categories.length) return FALLBACK_CATEGORY_SUBS;
    const map: Record<string, string[]> = {};
    categories.forEach((c: any) => {
      if (!map[c.type]) map[c.type] = [];
      if (c.subtype && !map[c.type].includes(c.subtype)) map[c.type].push(c.subtype);
    });
    Object.keys(map).forEach(t => { if (!map[t].includes("Others")) map[t].push("Others"); });
    return map;
  }, [categories]);

  const categoryItems = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {};
    categories.forEach((c: any) => {
      if (!map[c.type]) map[c.type] = {};
      if (!map[c.type][c.subtype]) map[c.type][c.subtype] = [];
      if (c.item && !map[c.type][c.subtype].includes(c.item)) map[c.type][c.subtype].push(c.item);
    });
    return map;
  }, [categories]);

  const taxableTypes = useMemo(() => {
    if (!categories.length) return new Set(["Asset"]);
    const s = new Set<string>();
    categories.forEach((c: any) => { if (c.taxable) s.add(c.type); });
    return s;
  }, [categories]);

  /* Mutations */
  const addExp    = useMutation({ mutationFn: async (d: any) => { const r = await apiRequest("POST", "/api/expenses", d); return r.json(); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const updateExp = useMutation({ mutationFn: async ({ id, ...d }: any) => { const r = await apiRequest("PATCH", `/api/expenses/${id}`, d); return r.json(); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const deleteExp = useMutation({ mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/expenses/${id}`); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const addFile   = useMutation({ mutationFn: async (d: any) => { const r = await apiRequest("POST", "/api/expense-daily-files", d); return r.json(); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expense-daily-files", recordDate] }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });
  const delFile   = useMutation({ mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/expense-daily-files/${id}`); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/expense-daily-files", recordDate] }), onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }) });

  /* Derived */
  const baseExpenses = orderedExpenses.filter(e => e.recordDate === recordDate);
  const totalAmount  = baseExpenses.reduce((s, e) => s + (parseFloat(String(e.total)) || 0), 0);
  const pendingCount = baseExpenses.filter(e => e.status === "Pending" && !isEmptyRow(e)).length;

  const visibleExpenses = useMemo(() => {
    let list = filterStatus === "All" ? baseExpenses : baseExpenses.filter(e => e.status === filterStatus);
    if (sortKey === "date-asc")    list = [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (sortKey === "date-desc")   list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (sortKey === "amount-asc")  list = [...list].sort((a, b) => (parseFloat(String(a.total)) || 0) - (parseFloat(String(b.total)) || 0));
    if (sortKey === "amount-desc") list = [...list].sort((a, b) => (parseFloat(String(b.total)) || 0) - (parseFloat(String(a.total)) || 0));
    return list;
  }, [baseExpenses, filterStatus, sortKey]);

  /* Handlers */
  const handleAddRow   = () => addExp.mutate({ date: recordDate, recordDate, category: "", subCategory: "", item: "", qty: "1", price: "0", total: "0", status: "Pending", hasReceipt: false });
  const handleUpdate   = useCallback((id: number, d: Record<string, any>) => updateExp.mutate({ id, ...d }), []);
  const handleDelete   = useCallback((id: number) => { deleteExp.mutate(id); setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }, []);
  const handleSelect   = useCallback((id: number, c: boolean) => { setSelectedIds(prev => { const n = new Set(prev); c ? n.add(id) : n.delete(id); return n; }); }, []);

  const selectableMobile = visibleExpenses.filter(e => e.status === "Pending");
  const allMobileSelected = selectableMobile.length > 0 && selectableMobile.every(e => selectedIds.has(e.id));
  const handleSelectAllMobile = () => {
    if (allMobileSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableMobile.map(e => e.id)));
  };

  const selectableDesktop = visibleExpenses.filter(e => e.status === "Pending");
  const allDesktopSelected = selectableDesktop.length > 0 && selectableDesktop.every(e => selectedIds.has(e.id));
  const handleSelectAllDesktop = (c: boolean) => {
    setSelectedIds(c ? new Set(selectableDesktop.map(e => e.id)) : new Set());
  };

  const handleBulkStatus = async (status: string) => {
    const targetStatus = status === "Paid" ? "Submitted" : "Submitted";
    const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && (role === "owner" ? e.status === "Submitted" : e.status === "Pending")).map(e => e.id);
    await Promise.all(ids.map(id => updateExp.mutateAsync({ id, status })));
    toast({ title: `${ids.length} row(s) marked as ${status}` });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && e.status === "Pending").map(e => e.id);
    await Promise.all(ids.map(id => deleteExp.mutateAsync(id)));
    toast({ title: `${ids.length} row(s) deleted` }); setSelectedIds(new Set());
  };

  const handleSave = async () => {
    const empty = baseExpenses.filter(isEmptyRow);
    if (empty.length > 0) {
      await Promise.all(empty.map(e => deleteExp.mutateAsync(e.id)));
      toast({ title: `${empty.length} empty row(s) removed` });
    } else {
      toast({ title: "Saved", description: "All pending entries saved." });
    }
  };

  const handleSubmitApproval = async () => {
    const toSubmit = baseExpenses.filter(e => e.status === "Pending" && !isEmptyRow(e));
    if (toSubmit.length === 0) { toast({ title: "Nothing to submit", description: "Add some entries first.", variant: "destructive" }); return; }
    if (toSubmit.some(isZeroPriceRow)) { setShowApprovalDialog(true); return; }
    setShowApprovalDialog(true);
  };

  const confirmSubmitApproval = async () => {
    const toSubmit = baseExpenses.filter(e => e.status === "Pending" && !isEmptyRow(e));
    setShowApprovalDialog(false);
    await Promise.all(toSubmit.map(e => updateExp.mutateAsync({ id: e.id, status: "Submitted" })));
    toast({ title: "Submitted for Approval", description: `${toSubmit.length} item(s) sent for owner review.` });
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    const errs: string[] = [], valid: File[] = [];
    for (const f of files) { const err = validateFile(f); err ? errs.push(err) : valid.push(f); }
    if (errs.length) toast({ title: "Files rejected", description: errs.join(" "), variant: "destructive" });
    for (const f of valid) {
      const b64 = await fileToBase64(f);
      await addFile.mutateAsync({ recordDate, fileName: f.name, fileType: f.type || "application/octet-stream", fileData: b64 });
    }
    if (valid.length) toast({ title: "Files uploaded", description: `${valid.length} file(s) saved.` });
    e.target.value = "";
  };

  if (isLoading) return <AdminLayout role={role}><div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div></AdminLayout>;

  const someSelected = selectedIds.size > 0;
  const sharedProps = { role, onUpdate: handleUpdate, onDelete: handleDelete, isDeleting: deleteExp.isPending, categorySubs, categoryItems, taxableTypes };

  return (
    <AdminLayout role={role}>
      {showApprovalDialog && (
        <ApprovalSummaryDialog
          expenses={baseExpenses}
          recordDate={recordDate}
          onConfirm={confirmSubmitApproval}
          onClose={() => setShowApprovalDialog(false)}
        />
      )}

      <div className="space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-primary" data-testid="text-expenses-title">Expenses & Purchases</h2>
            <p className="text-sm text-muted-foreground">Manage daily expenditures.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button variant="outline" onClick={handleSave} data-testid="button-save-expenses" className="flex-1 sm:flex-none">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            {role === "manager" && (
              <Button onClick={handleSubmitApproval} disabled={pendingCount === 0} className="flex-1 sm:flex-none font-semibold" data-testid="button-submit-approval">
                <SendHorizonal className="mr-2 h-4 w-4" />
                Submit for Approval {pendingCount > 0 && `(${pendingCount})`}
              </Button>
            )}
          </div>
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
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Total</p>
                <p className="text-xl font-bold font-serif text-primary" data-testid="text-total-amount">{totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Row 2: Record Date */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Record Date:</span>
              <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)}
                className="h-8 bg-background flex-1 sm:flex-none sm:w-40" data-testid="input-record-date" />
            </div>

            {/* Row 3: Upload Files */}
            <div className="flex items-center gap-2 mb-3">
              <input type="file" ref={bulkFileRef} className="hidden" accept={ALLOWED_EXTENSIONS} multiple onChange={handleBulkFileChange} />
              <Button variant="outline" size="sm" className="h-8" onClick={() => bulkFileRef.current?.click()} disabled={addFile.isPending} data-testid="button-upload-files">
                <Upload className="mr-1.5 h-3.5 w-3.5" />{addFile.isPending ? "Uploading…" : "Upload Daily Receipts"}
              </Button>
              <span className="text-xs text-muted-foreground">{dailyFiles.length > 0 ? `${dailyFiles.length} file(s)` : "No files"}</span>
            </div>

            {/* Uploaded files list */}
            {dailyFiles.length > 0 && (
              <div className="pb-3 border-t pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Uploaded for {recordDate}</p>
                <div className="flex flex-wrap gap-1.5">
                  {dailyFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1">
                      <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="max-w-[110px] truncate text-xs" title={f.fileName}>{f.fileName}</span>
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => downloadBase64File(f.fileData, f.fileName)}><Download className="h-3 w-3" /></button>
                      {role === "owner" && <button className="text-red-400 hover:text-red-600" onClick={() => delFile.mutate(f.id)}><X className="h-3 w-3" /></button>}
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
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => { const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && e.status === "Submitted").map(e => e.id); Promise.all(ids.map(id => updateExp.mutateAsync({ id, status: "Paid" }))).then(() => { toast({ title: `${ids.length} row(s) approved` }); setSelectedIds(new Set()); }); }}>
                        <CheckCheck className="mr-1 h-3.5 w-3.5" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => { const ids = visibleExpenses.filter(e => selectedIds.has(e.id) && e.status === "Submitted").map(e => e.id); Promise.all(ids.map(id => updateExp.mutateAsync({ id, status: "Rejected" }))).then(() => { toast({ title: `${ids.length} row(s) rejected` }); setSelectedIds(new Set()); }); }}>
                        <Ban className="mr-1 h-3.5 w-3.5" />Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50" onClick={handleBulkDelete}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                  <button className="text-xs text-muted-foreground underline" onClick={() => setSelectedIds(new Set())}>Clear</button>
                </div>
              ) : <div />}
              <Button onClick={handleAddRow} disabled={addExp.isPending} className="h-8 text-sm font-semibold shadow-sm" data-testid="button-add-expense">
                <Plus className="mr-1.5 h-4 w-4" /> Add Line Item
              </Button>
            </div>

            {/* ── Filter/Sort bar ── */}
            <FilterSortBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} sortKey={sortKey} setSortKey={setSortKey} />

            {/* ── Mobile card view ── */}
            <div className="block md:hidden">
              {/* Mobile select-all bar */}
              {selectableMobile.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10">
                  <button onClick={handleSelectAllMobile} className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <SquareCheck className="h-4 w-4" />
                    {allMobileSelected ? "Deselect All" : `Select All Pending (${selectableMobile.length})`}
                  </button>
                  {someSelected && <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>}
                </div>
              )}

              <div className="py-2">
                {visibleExpenses.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10 text-sm">
                    {filterStatus !== "All" ? `No ${filterStatus} expenses on ${recordDate}.` : `No expenses for ${recordDate}. Tap Add Line Item to start.`}
                  </div>
                ) : (
                  visibleExpenses.map((expense, index) => (
                    <MobileExpenseCard key={expense.id} serialNo={index + 1} expense={expense}
                      isSelected={selectedIds.has(expense.id)} onSelect={handleSelect} {...sharedProps} />
                  ))
                )}
              </div>
            </div>

            {/* ── Desktop table view ── */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="table-fixed w-full">
                <colgroup>
                  <col style={{width:"30px"}} />
                  <col style={{width:"28px"}} />
                  <col style={{width:"118px"}} />
                  <col style={{width:"122px"}} />
                  <col style={{width:"118px"}} />
                  <col style={{minWidth:"150px"}} />
                  <col style={{width:"56px"}} />
                  <col style={{width:"76px"}} />
                  <col style={{width:"76px"}} />
                  <col style={{width:"74px"}} />
                  <col style={{width:"88px"}} />
                  <col style={{width:"36px"}} />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="p-1 text-center"><Checkbox checked={allDesktopSelected} onCheckedChange={handleSelectAllDesktop} data-testid="checkbox-select-all" /></TableHead>
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
                    <ExpenseRow key={expense.id} serialNo={index + 1} expense={expense}
                      isSelected={selectedIds.has(expense.id)} onSelect={handleSelect} {...sharedProps} />
                  ))}
                  {visibleExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-10">
                        {filterStatus !== "All" ? `No ${filterStatus} expenses on ${recordDate}.` : <>No expenses on {recordDate}. Click <strong>Add Line Item</strong>.</>}
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
