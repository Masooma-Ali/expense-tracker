"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      // Fetch session to get user role
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = (sessionData?.user as any)?.role;
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#E8F5BD,#C7EABB,#f0f8ef)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 4px 40px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "#2d3a2e", marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "#8aaa90" }}>Sign in to your Sprout account</p>
        </div>

        {error && (
          <div style={{ background: "#fff0f3", border: "1px solid #FB9B8F", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#c0446a" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Password</label>
            <input className="form-input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#8aaa90" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#84B179", fontWeight: 500, textDecoration: "none" }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
