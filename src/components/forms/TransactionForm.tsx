"use client";
import { useState } from "react";
import { DEFAULT_CATEGORIES } from "@/lib/utils";
import { ReceiptUploader } from "./ReceiptUploader";       // ← NEW

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initial?: any;
}

export function TransactionForm({ onSuccess, onCancel, initial }: TransactionFormProps) {
  const [form, setForm] = useState({
    description: initial?.description || "",
    amount: initial?.amount || "",
    type: initial?.type || "expense",
    category: initial?.category || "Groceries",
    date: initial?.date
      ? new Date(initial.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    isRecurring: initial?.isRecurring || false,
    recurringFrequency: initial?.recurringFrequency || "monthly",
    notes: initial?.notes || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);    // ← NEW

  // Called when OCR extracts data from receipt
  function handleReceiptData(data: {
    amount: number | null;
    date: string | null;
    description: string | null;
    category: string;
  }) {
    setForm((prev) => ({
      ...prev,
      amount: data.amount ? String(data.amount) : prev.amount,
      date: data.date || prev.date,
      description: data.description || prev.description,
      category: data.category || prev.category,
    }));
    setShowScanner(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = initial ? `/api/transactions/${initial._id}` : "/api/transactions";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });

    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onSuccess();
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #dde8da",
    borderRadius: 9, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e", background: "#fff",
  };
  const labelStyle = {
    display: "block" as const, fontSize: 11, fontWeight: 500 as const, color: "#5a7060",
    marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: ".05em",
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: "#fff0f3", border: "1px solid #FB9B8F", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#c0446a" }}>
          {error}
        </div>
      )}

      {/* ── NEW: Receipt Scanner Toggle ── */}
      {!initial && (
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            style={{
              width: "100%", padding: "9px", borderRadius: 9,
              border: "1.5px dashed #A2CB8B", background: showScanner ? "#f0fbf4" : "transparent",
              fontFamily: "inherit", fontSize: 13, color: "#84B179", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <span>🧾</span>
            {showScanner ? "Hide Scanner" : "Scan a Receipt (auto-fill form)"}
          </button>

          {showScanner && (
            <div style={{ marginTop: 10 }}>
              <ReceiptUploader onDataExtracted={handleReceiptData} />
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {!initial && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "#eef5ec" }} />
          <span style={{ fontSize: 11, color: "#8aaa90" }}>or fill manually</span>
          <div style={{ flex: 1, height: 1, background: "#eef5ec" }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Amount</label>
          <input style={inputStyle} type="number" step="0.01" min="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What did you spend on?" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, textTransform: "none", fontSize: 13 }}>
          <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
          Recurring transaction
        </label>
      </div>

      {form.isRecurring && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Frequency</label>
          <select style={inputStyle} value={form.recurringFrequency} onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional details..." />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "#E8F5BD", color: "#5a7060", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "#84B179", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving..." : initial ? "Update" : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}
