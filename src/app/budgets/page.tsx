"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, DEFAULT_CATEGORIES, CATEGORY_ICONS } from "@/lib/utils";

function BudgetForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ category: "Groceries", limit: "", period: "monthly", startDate: new Date().toISOString().split("T")[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #dde8da", borderRadius: 9, fontFamily: "inherit", fontSize: 13 };
  const labelStyle = { display: "block" as const, fontSize: 11, fontWeight: 500 as const, color: "#5a7060", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: ".05em" as const };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, limit: parseFloat(form.limit) }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: "#fff0f3", border: "1px solid #FB9B8F", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13, color: "#c0446a" }}>{error}</div>}
      <div style={{ marginBottom: 12 }}><label style={labelStyle}>Category</label>
        <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div><label style={labelStyle}>Limit ($)</label><input style={inputStyle} type="number" min="1" step="0.01" required value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="e.g. 500" /></div>
        <div><label style={labelStyle}>Period</label>
          <select style={inputStyle} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
            <option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "#E8F5BD", color: "#5a7060", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Cancel</button>
        <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, borderRadius: 9, border: "none", background: "#84B179", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          {loading ? "Saving..." : "Save Budget"}
        </button>
      </div>
    </form>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchBudgets() {
    const res = await fetch("/api/budgets");
    const data = await res.json();
    setBudgets(data);
    setLoading(false);
  }

  useEffect(() => { fetchBudgets(); }, []);

  async function deleteBudget(id: string) {
    if (!confirm("Delete this budget?")) return;
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    fetchBudgets();
  }

  return (
    <AppShell title="Budgets">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Set Budget</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8aaa90" }}>Loading...</div>
      ) : budgets.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No budgets set yet</div>
          <div style={{ fontSize: 13, color: "#8aaa90", marginBottom: 20 }}>Set a budget per category to track your spending</div>
          <button onClick={() => setShowModal(true)} className="btn-primary">Set First Budget</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {budgets.map((b) => {
            const pct = Math.min(b.percentage, 100);
            const color = b.percentage > 100 ? "#F57799" : b.percentage > 80 ? "#FB9B8F" : "#84B179";
            return (
              <div key={b._id} className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[b.category] || "💳"}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{b.category}</div>
                      <div style={{ fontSize: 11, color: "#8aaa90", textTransform: "capitalize" }}>{b.period}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteBudget(b._id)} style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #FB9B8F", borderRadius: 6, background: "none", cursor: "pointer", color: "#F57799" }}>Remove</button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: b.percentage > 100 ? "#F57799" : "#2d3a2e" }}>{formatCurrency(b.spent)} spent</span>
                  <span style={{ fontSize: 12, color: "#8aaa90" }}>of {formatCurrency(b.limit)}</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 8 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div style={{ fontSize: 11, color: b.percentage > 100 ? "#F57799" : "#8aaa90" }}>
                  {b.percentage > 100 ? `⚠️ Over by ${formatCurrency(b.spent - b.limit)}` : `${formatCurrency(b.limit - b.spent)} remaining (${b.percentage}% used)`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Set Budget">
        <BudgetForm onSuccess={() => { setShowModal(false); fetchBudgets(); }} onCancel={() => setShowModal(false)} />
      </Modal>
    </AppShell>
  );
}
