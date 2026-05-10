"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExport(format: string) {
    setExporting(true);
    setMessage("");
    const params = new URLSearchParams({ startDate, endDate, format });
    const res = await fetch(`/api/reports?${params}`);

    if (format === "csv") {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sprout-report-${startDate}-to-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("✅ Report downloaded!");
    }
    setExporting(false);
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #dde8da", borderRadius: 9, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e" };
  const labelStyle = { display: "block" as const, fontSize: 11, fontWeight: 500 as const, color: "#5a7060", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".05em" as const };

  return (
    <AppShell title="Reports">
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        {/* Generator */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Generate Report</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>From Date</label><input style={inputStyle} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label style={labelStyle}>To Date</label><input style={inputStyle} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>

          {message && (
            <div style={{ background: "#e8f8ee", border: "1px solid #A2CB8B", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#3a7a3a" }}>{message}</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => handleExport("csv")} disabled={exporting} className="btn-primary" style={{ padding: "12px", textAlign: "center", fontSize: 14 }}>
              {exporting ? "Generating..." : "📥 Export as CSV"}
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "#8aaa90" }}>
              All transactions between the selected dates will be included
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ background: "#E8F5BD", border: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3a2e", marginBottom: 8 }}>📊 What's in a CSV report?</div>
            <ul style={{ fontSize: 12, color: "#5a7060", lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Transaction date</li>
              <li>Description & category</li>
              <li>Amount & type (income/expense)</li>
              <li>Notes</li>
            </ul>
          </div>
          <div className="card" style={{ background: "#fff4f7", border: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3a2e", marginBottom: 8 }}>💡 Quick presets</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "This Month", start: firstOfMonth, end: today },
                { label: "Last 3 Months", start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0], end: today },
                { label: "This Year", start: `${new Date().getFullYear()}-01-01`, end: today },
              ].map((p) => (
                <button key={p.label} onClick={() => { setStartDate(p.start); setEndDate(p.end); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #dde8da", background: "#fff", fontFamily: "inherit", fontSize: 13, cursor: "pointer", color: "#5a7060", textAlign: "left" }}>
                  {p.label} ({p.start} → {p.end})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
