"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { InsightsPanel } from "@/components/ui/InsightsPanel";          // ← NEW
import { formatCurrency, formatDate, CATEGORY_ICONS } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function fetchData() {
    const res = await fetch("/api/analytics");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <AppShell title="Dashboard">
      {/* Add expense button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Expense</button>
      </div>

      {/* Budget alert */}
      {data?.budgets?.filter((b: any) => b.percentage > 100).length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#FB9B8F,#F57799)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: 13, color: "#fff", flex: 1 }}>
            <strong>Budget Alert:</strong> {data.budgets.filter((b: any) => b.percentage > 100).map((b: any) => b.category).join(", ")} exceeded budget!
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <StatCard label="Monthly Spent" value={loading ? "..." : formatCurrency(data?.summary?.expense || 0)} sub={`of ${formatCurrency(data?.totalBudget || 0)} budget`} badge={`${data?.budgetPercentage || 0}% used`} badgeType={data?.budgetPercentage > 90 ? "down" : "up"} accentColor="#84B179" />
        <StatCard label="Remaining" value={loading ? "..." : formatCurrency((data?.totalBudget || 0) - (data?.summary?.expense || 0))} sub="budget remaining" accentColor="#FB9B8F" />
        <StatCard label="Transactions" value={loading ? "..." : String(data?.summary?.txCount || 0)} sub="this month" badge="↑ this month" badgeType="up" accentColor="#FDC3A1" />
      </div>

      {/* AI Insights Panel — full width */}
      <InsightsPanel />

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        {/* Left: categories + progress */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#5a7060" }}>Category Spending</span>
            <a href="/budgets" style={{ fontSize: 11, color: "#84B179" }}>View budgets →</a>
          </div>

          {/* Overall progress */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#8aaa90" }}>Monthly budget</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#84B179" }}>{data?.budgetPercentage || 0}% used</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(data?.budgetPercentage || 0, 100)}%`, background: (data?.budgetPercentage || 0) > 90 ? "#F57799" : "#84B179" }} />
            </div>
          </div>

          {data?.categoryBreakdown?.slice(0, 5).map((cat: any) => {
            const budget = data.budgets?.find((b: any) => b.category === cat._id);
            const pct = budget ? Math.round((cat.total / budget.limit) * 100) : null;
            return (
              <div key={cat._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#e8f5e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{CATEGORY_ICONS[cat._id] || "💳"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{cat._id}</div>
                  <div style={{ fontSize: 10, color: "#8aaa90" }}>{cat.count} transactions</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: pct && pct > 100 ? "#F57799" : "#2d3a2e" }}>{formatCurrency(cat.total)}</div>
                  {budget && <div style={{ fontSize: 10, color: "#8aaa90" }}>of {formatCurrency(budget.limit)}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: donut */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: "#5a7060", marginBottom: 14 }}>Spending Split</div>
          <SpendingDonut data={data?.categoryBreakdown || []} />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#5a7060" }}>Recent Transactions</span>
          <a href="/transactions" style={{ fontSize: 11, color: "#84B179" }}>See all →</a>
        </div>
        {data?.recentTransactions?.map((tx: any) => (
          <div key={tx._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#e8f5e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{CATEGORY_ICONS[tx.category] || "💳"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{tx.description}</div>
              <div style={{ fontSize: 10, color: "#8aaa90" }}>{formatDate(tx.date)} · {tx.category}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: tx.type === "expense" ? "#e05c5c" : "#3a9a5c" }}>
              {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Transaction">
        <TransactionForm onSuccess={() => { setShowModal(false); fetchData(); }} onCancel={() => setShowModal(false)} />
      </Modal>
    </AppShell>
  );
}
