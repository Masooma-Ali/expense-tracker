"use client";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatDate } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  ACTIVATE_USER:          { label: "Activated User",       emoji: "✅", color: "#3a9a5c"  },
  SUSPEND_USER:           { label: "Suspended User",       emoji: "🚫", color: "#e05c5c"  },
  DELETE_USER:            { label: "Deleted User",         emoji: "🗑️", color: "#c0446a"  },
  BROADCAST_NOTIFICATION: { label: "Broadcast Sent",       emoji: "📢", color: "#84B179"  },
  CREATE_TRANSACTION:     { label: "Transaction Created",  emoji: "💳", color: "#5a7060"  },
  DELETE_TRANSACTION:     { label: "Transaction Deleted",  emoji: "❌", color: "#e05c5c"  },
};

export default function AuditLogsPage() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("action", filter);
    const res = await fetch(`/api/admin/logs?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setLogs(data.logs || []);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function formatDetails(log: any): string {
    if (!log.details) return "";
    const d = log.details;
    if (d.targetEmail)  return `→ ${d.targetEmail}`;
    if (d.deletedEmail) return `→ ${d.deletedEmail}`;
    if (d.message)      return `"${d.message.slice(0, 50)}${d.message.length > 50 ? "..." : ""}"`;
    return JSON.stringify(d).slice(0, 60);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const selectStyle = { padding: "8px 12px", border: "1px solid #dde8da", borderRadius: 8, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e", background: "#fff" };

  return (
    <AppShell title="Audit Trail">

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select
          style={selectStyle}
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions</option>
          <option value="ACTIVATE_USER">Activate User</option>
          <option value="SUSPEND_USER">Suspend User</option>
          <option value="DELETE_USER">Delete User</option>
          <option value="BROADCAST_NOTIFICATION">Broadcast</option>
        </select>
        <button onClick={fetchLogs} className="btn-outline" style={{ padding: "8px 16px", fontSize: 13 }}>
          🔄 Refresh
        </button>
        <span style={{ fontSize: 12, color: "#8aaa90", marginLeft: "auto" }}>
          {pagination ? `${pagination.total} total entries` : ""}
        </span>
      </div>

      {/* Logs table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90" }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8aaa90" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No audit logs yet</div>
            <div style={{ fontSize: 12 }}>Actions like suspending users or sending notifications will appear here</div>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#E8F5BD" }}>
                  {["Time", "Action", "Performed By", "Details"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#5a7060", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const meta = ACTION_LABELS[log.action] || { label: log.action, emoji: "📝", color: "#5a7060" };
                  return (
                    <tr key={log._id} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                      <td style={{ padding: "10px 12px", color: "#8aaa90", whiteSpace: "nowrap" }}>
                        {formatTime(log.createdAt)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${meta.color}18`, color: meta.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#C7EABB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#84B179" }}>
                            {log.userId?.name?.[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{log.userId?.name || "Admin"}</div>
                            <div style={{ fontSize: 10, color: "#8aaa90" }}>{log.userId?.email || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#5a7060", fontSize: 12 }}>
                        {formatDetails(log)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-outline" style={{ padding: "6px 14px", fontSize: 12 }}>← Prev</button>
                <span style={{ padding: "6px 12px", fontSize: 12, color: "#8aaa90" }}>Page {page} of {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline" style={{ padding: "6px 14px", fontSize: 12 }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
