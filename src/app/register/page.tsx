"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Always send role as 'user' (no admin signup)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role: "user" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#E8F5BD,#C7EABB,#f0f8ef)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 40px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "#2d3a2e", marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: 14, color: "#8aaa90" }}>Start tracking your expenses for free</p>
        </div>

        {error && (
          <div style={{ background: "#fff0f3", border: "1px solid #FB9B8F", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#c0446a" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Full Name
            </label>
            <input
              className="form-input"
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Email
            </label>
            <input
              className="form-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#5a7060", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Password
            </label>
            <input
              className="form-input"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
            />
          </div>

          {/* No role selection - always user */}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#8aaa90" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#84B179", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}