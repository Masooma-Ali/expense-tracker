"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export default function AdminPage() {
  const [users, setUsers]         = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingUsers, setLoadingUsers]       = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [msg, setMsg]             = useState({ text: "", type: "" });

  // Broadcast form state
  const [broadcastMsg, setBroadcastMsg]   = useState("");
  const [broadcastType, setBroadcastType] = useState("info");
  const [broadcasting, setBroadcasting]   = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) return;
    const json = await res.json();
    setUsers(json.users || []);
    setLoadingUsers(false);
  }

  async function fetchAnalytics() {
    const res = await fetch("/api/admin/analytics");
    if (!res.ok) return;
    const json = await res.json();
    setAnalytics(json);
    setLoadingAnalytics(false);
  }

  async function fetchBroadcasts() {
    const res = await fetch("/api/admin/notifications");
    if (!res.ok) return;
    const json = await res.json();
    setRecentBroadcasts(json.logs || []);
  }

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
    fetchBroadcasts();
  }, []);

  function showMsg(text: string, type: "success" | "error") {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  }

  async function toggleStatus(userId: string, currentStatus: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: !currentStatus }),
    });
    if (res.ok) { showMsg(`User ${!currentStatus ? "activated" : "suspended"} successfully`, "success"); fetchUsers(); }
    else showMsg("Failed to update status", "error");
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    if (res.ok) { showMsg("User deleted successfully", "success"); fetchUsers(); fetchAnalytics(); }
    else showMsg("Failed to delete user", "error");
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMsg.trim(), type: broadcastType }),
    });
    const data = await res.json();
    setBroadcasting(false);
    if (res.ok) {
      showMsg(`✅ Sent to ${data.sent} users`, "success");
      setBroadcastMsg("");
      fetchBroadcasts();
    } else {
      showMsg(data.error || "Failed to send", "error");
    }
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #dde8da", borderRadius: 9, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e", background: "#fff" };

  return (
    <AppShell title="Admin Dashboard">

      {/* ── System-wide Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total Users"        value={loadingAnalytics ? "..." : String(analytics?.totalUsers || 0)}        badge="Registered"       badgeType="up"      accentColor="#84B179"  />
        <StatCard label="New This Week"      value={loadingAnalytics ? "..." : String(analytics?.newUsersThisWeek || 0)}  badge="Last 7 days"      badgeType="up"      accentColor="#A2CB8B"  />
        <StatCard label="Total Transactions" value={loadingAnalytics ? "..." : String(analytics?.totalTransactions || 0)} badge="All time"          badgeType="neutral" accentColor="#FDC3A1"  />
        <StatCard label="This Month Txns"    value={loadingAnalytics ? "..." : String(analytics?.txThisMonth || 0)}       badge="Current month"    badgeType="up"      accentColor="#C7EABB"  />
      </div>

      {/* Platform money stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card" style={{ background: "#e8f8ee", border: "1px solid #A2CB8B" }}>
          <div style={{ fontSize: 11, color: "#5a7060", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Total Income Tracked (Platform)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#2d6a3f" }}>{formatCurrency(analytics?.totalIncome || 0)}</div>
        </div>
        <div className="card" style={{ background: "#fff0f3", border: "1px solid #FB9B8F" }}>
          <div style={{ fontSize: 11, color: "#8a4060", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Total Expense Tracked (Platform)</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#c0446a" }}>{formatCurrency(analytics?.totalExpense || 0)}</div>
        </div>
      </div>

      {/* Signup trend chart + Top spenders */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>New User Signups — Last 6 Months</div>
          {loadingAnalytics ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#8aaa90" }}>Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={analytics?.signupChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="signups" fill="#A2CB8B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>🏆 Top Active Users</div>
          {loadingAnalytics ? (
            <div style={{ color: "#8aaa90", fontSize: 13 }}>Loading...</div>
          ) : analytics?.topSpenders?.length === 0 ? (
            <div style={{ color: "#8aaa90", fontSize: 13 }}>No data yet</div>
          ) : (
            analytics?.topSpenders?.map((u: any, i: number) => (
              <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                <span style={{ fontSize: 14, width: 20, color: i === 0 ? "#f5c518" : "#8aaa90" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: "#8aaa90" }}>{u.txCount} transactions</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#F57799" }}>{formatCurrency(u.totalSpent)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status message */}
      {msg.text && (
        <div style={{ background: msg.type === "success" ? "#e8f8ee" : "#fff0f3", border: `1px solid ${msg.type === "success" ? "#A2CB8B" : "#FB9B8F"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: msg.type === "success" ? "#3a7a3a" : "#c0446a" }}>
          {msg.text}
        </div>
      )}

      {/* ── User Management ── */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>User Management</div>
        {loadingUsers ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90" }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            No users registered yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#E8F5BD" }}>
                  {["Name", "Email", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#5a7060", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid rgba(0,0,0,.04)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#C7EABB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#84B179" }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#5a7060" }}>{u.email}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: u.isActive ? "#e8f8ee" : "#fff0f3", color: u.isActive ? "#3a9a5c" : "#e05c5c", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#8aaa90" }}>{formatDate(u.createdAt)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => toggleStatus(u._id, u.isActive)}
                          style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${u.isActive ? "#FB9B8F" : "#A2CB8B"}`, borderRadius: 6, background: "none", cursor: "pointer", color: u.isActive ? "#F57799" : "#3a9a5c", fontFamily: "inherit" }}
                        >
                          {u.isActive ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(u._id, u.name)}
                          style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #FB9B8F", borderRadius: 6, background: "#fff0f3", cursor: "pointer", color: "#c0446a", fontFamily: "inherit" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Broadcast Notification ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📢 Broadcast Notification</div>
          <p style={{ fontSize: 12, color: "#8aaa90", marginBottom: 14, lineHeight: 1.5 }}>
            Send a message to all active users. It will appear in their notification bell instantly.
          </p>
          <form onSubmit={sendBroadcast}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Type</label>
              <select style={inputStyle} value={broadcastType} onChange={(e) => setBroadcastType(e.target.value)}>
                <option value="info">📢 Info — General announcement</option>
                <option value="warning">⚠️ Warning — Important notice</option>
                <option value="budget_alert">🎯 Budget Alert — Finance tip</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Message</label>
              <textarea
                required
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="e.g. New feature added: you can now scan receipts!"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={broadcasting || !broadcastMsg.trim()}
              className="btn-primary"
              style={{ width: "100%", padding: "10px", opacity: broadcasting ? 0.7 : 1 }}
            >
              {broadcasting ? "Sending..." : `📤 Send to All Users`}
            </button>
          </form>
        </div>

        {/* Recent broadcasts */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Broadcasts</div>
          {recentBroadcasts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#8aaa90", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              No broadcasts sent yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentBroadcasts.map((log: any) => (
                <div key={log._id} style={{ background: "#f8fdf8", border: "1px solid #C7EABB", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, color: "#2d3a2e", marginBottom: 4, lineHeight: 1.4 }}>
                    {log.details?.message}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8aaa90" }}>
                    <span>Sent to {log.details?.sentTo} users</span>
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </AppShell>
  );
}
