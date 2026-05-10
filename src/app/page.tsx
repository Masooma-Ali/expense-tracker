import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #E8F5BD 0%, #C7EABB 40%, #f0f8ef 100%)" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#84B179", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌱</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#2d3a2e" }}>Sprout</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #84B179", color: "#84B179", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            Sign In
          </Link>
          <Link href="/register" style={{ padding: "8px 20px", borderRadius: 8, background: "#84B179", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#C7EABB", color: "#3a6a35", padding: "4px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, marginBottom: 24 }}>
          Free · Open Source · Privacy First
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: "#2d3a2e", lineHeight: 1.15, marginBottom: 20 }}>
          A Finance Tracker<br />
          <span style={{ color: "#84B179" }}>Built For You</span>
        </h1>
        <p style={{ fontSize: 18, color: "#5a7060", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Track expenses, set budgets, and gain powerful insights into your spending — all in one beautiful dashboard.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{ padding: "14px 32px", borderRadius: 10, background: "#84B179", color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 600 }}>
            Start Tracking Free →
          </Link>
          <Link href="/login" style={{ padding: "14px 32px", borderRadius: 10, border: "1.5px solid #84B179", color: "#84B179", textDecoration: "none", fontSize: 16, fontWeight: 500 }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {[
          { icon: "📊", title: "Smart Dashboard", desc: "Real-time overview of all your spending and income in one place." },
          { icon: "🎯", title: "Budget Alerts", desc: "Get notified before you overspend on any category." },
          { icon: "📈", title: "Powerful Analytics", desc: "Visualize trends with beautiful charts and insights." },
          { icon: "📤", title: "Export Reports", desc: "Download your data as CSV or PDF anytime." },
        ].map((f) => (
          <div key={f.title} style={{ background: "rgba(255,255,255,0.75)", borderRadius: 16, padding: "24px 20px", backdropFilter: "blur(6px)", border: "1px solid rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "#2d3a2e" }}>{f.title}</div>
            <div style={{ fontSize: 13, color: "#5a7060", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </section>

      <footer style={{ textAlign: "center", padding: "20px", color: "#8aaa90", fontSize: 13, borderTop: "1px solid rgba(0,0,0,.06)" }}>
        Built with Next.js · MongoDB · Vercel
      </footer>
    </main>
  );
}
