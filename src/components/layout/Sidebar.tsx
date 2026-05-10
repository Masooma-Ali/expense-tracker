"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",    icon: "▦" },
  { href: "/transactions", label: "Transactions", icon: "≡" },
  { href: "/budgets",      label: "Budgets",      icon: "◎" },
  { href: "/analytics",    label: "Analytics",    icon: "↗" },
  { href: "/reports",      label: "Reports",      icon: "☰" },
];

const adminNavItems = [
  { href: "/admin",      label: "Dashboard",  icon: "▦" },
  { href: "/admin/logs", label: "Audit Trail", icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <aside style={{ width: 220, background: "#84B179", display: "flex", flexDirection: "column", padding: "24px 0", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {isAdmin ? "⭐" : "🌱"}
        </div>
        <div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#fff", fontWeight: 700, display: "block" }}>Sprout</span>
          {isAdmin && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.65)", letterSpacing: ".05em", textTransform: "uppercase" }}>Admin Panel</span>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "0 12px", flex: 1 }}>
        {isAdmin ? (
          <>
            <div style={{ fontSize: 10, letterSpacing: ".08em", color: "rgba(255,255,255,.5)", padding: "0 8px", marginBottom: 6, textTransform: "uppercase" }}>Admin Menu</div>
            {adminNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 2, textDecoration: "none", background: active ? "rgba(255,255,255,.2)" : "transparent", transition: "background .15s" }}
                >
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,.9)" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: active ? "#fff" : "rgba(255,255,255,.8)", fontWeight: active ? 500 : 400 }}>{item.label}</span>
                </Link>
              );
            })}
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: ".08em", color: "rgba(255,255,255,.5)", padding: "0 8px", marginBottom: 6, textTransform: "uppercase" }}>Main</div>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 2, textDecoration: "none", background: active ? "rgba(255,255,255,.2)" : "transparent", transition: "background .15s" }}
                >
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,.9)" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: active ? "#fff" : "rgba(255,255,255,.8)", fontWeight: active ? 500 : 400 }}>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom: user info + sign out */}
      <div style={{ padding: "0 12px" }}>
        {/* Only show profile link for regular users */}
        {!isAdmin && (
          <Link
            href="/profile"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.12)", borderRadius: 10, textDecoration: "none", marginBottom: 8 }}
          >
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C7EABB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#84B179", flexShrink: 0 }}>
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", textTransform: "capitalize" }}>{(session?.user as any)?.role}</div>
            </div>
          </Link>
        )}

        {/* Admin: show name card without profile link */}
        {isAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.12)", borderRadius: 10, marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#C7EABB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#84B179", flexShrink: 0 }}>
              {session?.user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session?.user?.name}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>Administrator</div>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,.3)", background: "transparent", color: "rgba(255,255,255,.75)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}