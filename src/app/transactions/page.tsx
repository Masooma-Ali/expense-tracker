"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { formatCurrency, formatDate, CATEGORY_ICONS, DEFAULT_CATEGORIES } from "@/lib/utils";

export default function TransactionsPage() {
  const [data, setData] = useState<{ transactions: any[]; pagination: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", category: "", type: "", startDate: "", endDate: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    const res = await fetch(`/api/transactions?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteTransaction(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchData();
  }

  const inputStyle = { padding: "8px 12px", border: "1px solid #dde8da", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e", background: "#fff" };

  return (
    <AppShell title="Transactions">
      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Search transactions..." value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} />
        <select style={inputStyle} value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
          <option value="">All Categories</option>
          {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select style={inputStyle} value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
          <option value="">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input style={inputStyle} type="date" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
        <input style={inputStyle} type="date" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add</button>
      </div>

      {/* Transactions list */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90" }}>Loading...</div>
        ) : data?.transactions?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>No transactions found</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 80px", gap: 12, padding: "6px 4px 10px", borderBottom: "1px solid rgba(0,0,0,.08)", fontSize: 11, fontWeight: 500, color: "#8aaa90", textTransform: "uppercase", letterSpacing: ".05em" }}>
              <span>Description</span><span>Category</span><span>Date</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "right" }}>Actions</span>
            </div>
            {data?.transactions.map((tx: any) => (
              <div key={tx._id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 80px 80px", gap: 12, padding: "10px 4px", borderBottom: "1px solid rgba(0,0,0,.04)", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[tx.category] || "💳"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                    {tx.isRecurring && <span style={{ fontSize: 9, background: "#E8F5BD", color: "#5a7060", padding: "1px 5px", borderRadius: 4 }}>Recurring</span>}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#5a7060" }}>{tx.category}</span>
                <span style={{ fontSize: 12, color: "#8aaa90" }}>{formatDate(tx.date)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: tx.type === "expense" ? "#e05c5c" : "#3a9a5c" }}>
                  {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount)}
                </span>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => { setEditItem(tx); setShowModal(true); }} style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #dde8da", borderRadius: 6, background: "none", cursor: "pointer", color: "#5a7060" }}>Edit</button>
                  <button onClick={() => deleteTransaction(tx._id)} style={{ fontSize: 11, padding: "3px 8px", border: "1px solid #FB9B8F", borderRadius: 6, background: "none", cursor: "pointer", color: "#F57799" }}>Del</button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline" style={{ padding: "6px 14px", fontSize: 12 }}>← Prev</button>
                <span style={{ padding: "6px 12px", fontSize: 12, color: "#8aaa90" }}>Page {page} of {data.pagination.totalPages}</span>
                <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline" style={{ padding: "6px 14px", fontSize: 12 }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Transaction" : "Add Transaction"}>
        <TransactionForm
          initial={editItem}
          onSuccess={() => { setShowModal(false); setEditItem(null); fetchData(); }}
          onCancel={() => { setShowModal(false); setEditItem(null); }}
        />
      </Modal>
    </AppShell>
  );
}
