"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ name: "", currency: "USD" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [pwMsg, setPwMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      setProfile(d);
      setProfileForm({ name: d.name, currency: d.currency || "USD" });
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profileForm) });
    const data = await res.json();
    setLoading(false);
    setProfileMsg(res.ok ? { text: "✅ Profile updated!", type: "success" } : { text: data.error, type: "error" });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ text: "Passwords do not match", type: "error" }); return; }
    setLoading(true);
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pwForm) });
    const data = await res.json();
    setLoading(false);
    setPwMsg(res.ok ? { text: "✅ Password updated!", type: "success" } : { text: data.error, type: "error" });
    if (res.ok) setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #dde8da", borderRadius: 9, fontFamily: "inherit", fontSize: 13, color: "#2d3a2e" };
  const labelStyle = { display: "block" as const, fontSize: 11, fontWeight: 500 as const, color: "#5a7060", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".05em" as const };

  const msgStyle = (type: string) => ({
    background: type === "success" ? "#e8f8ee" : "#fff0f3",
    border: `1px solid ${type === "success" ? "#A2CB8B" : "#FB9B8F"}`,
    borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13,
    color: type === "success" ? "#3a7a3a" : "#c0446a",
  });

  return (
    <AppShell title="Profile">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Profile */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#C7EABB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#84B179" }}>
              {profile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{profile?.name}</div>
              <div style={{ fontSize: 12, color: "#8aaa90" }}>{profile?.email}</div>
              <span style={{ fontSize: 10, background: "#E8F5BD", color: "#5a7060", padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>{profile?.role}</span>
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Personal Info</div>
          {profileMsg.text && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Full Name</label><input style={inputStyle} required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email</label><input style={{ ...inputStyle, background: "#f5f5f5", color: "#8aaa90" }} value={profile?.email || ""} disabled /></div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Currency</label>
              <select style={inputStyle} value={profileForm.currency} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="PKR">PKR (₨)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "10px" }}>Save Changes</button>
          </form>
        </div>

        {/* Security */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Change Password</div>
          {pwMsg.text && <div style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}
          <form onSubmit={changePassword}>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Current Password</label><input style={inputStyle} type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>New Password</label><input style={inputStyle} type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 6 characters" /></div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Confirm Password</label><input style={inputStyle} type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Re-enter password" /></div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "10px" }}>Update Password</button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5a7060", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Account Info</div>
            <div style={{ fontSize: 12, color: "#8aaa90", lineHeight: 1.8 }}>
              <div>Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</div>
              <div>Role: {profile?.role}</div>
              <div>Status: Active</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
