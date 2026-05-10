"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";

export function AppShell({
  children,
  title,
  isAdmin = false,
}: {
  children: React.ReactNode;
  title: string;
  isAdmin?: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f8ef" }}>
        <div style={{ fontSize: 32 }}>🌱</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,.06)", padding: "14px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "#2d3a2e", flex: 1 }}>{title}</h1>
          {/* Notification bell — hidden for admin pages */}
          {!isAdmin && <NotificationBell />}
        </header>
        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          {children}
        </main>
      </div>
    </div>
  );
}