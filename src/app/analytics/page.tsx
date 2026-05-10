"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SpendingDonut } from "@/components/charts/SpendingDonut";
import { TrendLine } from "@/components/charts/TrendLine";
import { ForecastChart } from "@/components/charts/ForecastChart";     // ← NEW
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <AppShell title="Analytics">
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <StatCard label="Total Income" value={loading ? "..." : formatCurrency(data?.summary?.income || 0)} badge="↑ this month" badgeType="up" accentColor="#3a9a5c" />
        <StatCard label="Total Expense" value={loading ? "..." : formatCurrency(data?.summary?.expense || 0)} badge={`${data?.budgetPercentage || 0}% of budget`} badgeType={data?.budgetPercentage > 90 ? "down" : "neutral"} accentColor="#F57799" />
        <StatCard label="Net Balance" value={loading ? "..." : formatCurrency((data?.summary?.income || 0) - (data?.summary?.expense || 0))} badgeType={(data?.summary?.income || 0) > (data?.summary?.expense || 0) ? "up" : "down"} badge={(data?.summary?.income || 0) > (data?.summary?.expense || 0) ? "Positive" : "Negative"} accentColor="#84B179" />
      </div>

      {/* Trend chart */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, color: "#5a7060", marginBottom: 16 }}>Spending Trend — Last 6 Months</div>
        {loading ? (
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#8aaa90" }}>Loading chart...</div>
        ) : (
          <TrendLine data={data?.monthlyTrend || []} />
        )}
      </div>

      {/* ── NEW: Predictive Forecast Section ── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>🔮</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3a2e" }}>Predictive Spending Forecast</span>
          <span style={{ fontSize: 10, background: "#E8F5BD", color: "#3a7a3a", padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>AI-powered</span>
        </div>
        {loading ? (
          <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#8aaa90" }}>Calculating forecast...</div>
        ) : (
          <ForecastChart data={data?.forecast || []} />
        )}
      </div>

      {/* Category breakdown + period comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: "#5a7060", marginBottom: 14 }}>Category Breakdown</div>
          <SpendingDonut data={data?.categoryBreakdown || []} />
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: "#5a7060", marginBottom: 14 }}>Budget vs Actual</div>
          {data?.budgets?.map((b: any) => (
            <div key={b.category} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{b.category}</span>
                <span style={{ fontSize: 11, color: b.percentage > 100 ? "#F57799" : "#8aaa90" }}>
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(b.percentage, 100)}%`, background: b.percentage > 100 ? "#F57799" : b.percentage > 80 ? "#FB9B8F" : "#84B179" }} />
              </div>
            </div>
          ))}
          {!data?.budgets?.length && <div style={{ fontSize: 12, color: "#8aaa90" }}>Set budgets to see comparison</div>}
        </div>
      </div>

      {/* Top spending categories table */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, color: "#5a7060", marginBottom: 14 }}>Top Spending Categories</div>
        {data?.categoryBreakdown?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#8aaa90", fontSize: 13 }}>No expense data this month</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#E8F5BD" }}>
                {["Category", "Transactions", "Amount", "% of Total"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#5a7060", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.categoryBreakdown?.map((cat: any) => {
                const total = data.summary?.expense || 1;
                return (
                  <tr key={cat._id} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{cat._id}</td>
                    <td style={{ padding: "10px 12px", color: "#8aaa90" }}>{cat.count}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{formatCurrency(cat.total)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#eef5ec" }}>
                          <div style={{ height: "100%", borderRadius: 4, background: "#84B179", width: `${Math.round((cat.total / total) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#8aaa90", minWidth: 30 }}>{Math.round((cat.total / total) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
