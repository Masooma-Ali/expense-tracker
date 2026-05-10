interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeType?: "up" | "down" | "neutral";
  accentColor?: string;
}

export function StatCard({ label, value, sub, badge, badgeType = "neutral", accentColor = "#84B179" }: StatCardProps) {
  const badgeStyle = {
    up: { background: "#e8f8ee", color: "#3a9a5c" },
    down: { background: "#fff0f3", color: "#F57799" },
    neutral: { background: "#f0f0f0", color: "#666" },
  }[badgeType];

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -8, top: -8, width: 56, height: 56, borderRadius: "50%", background: accentColor, opacity: 0.12 }} />
      <div style={{ fontSize: 11, color: "#8aaa90", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#2d3a2e", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#8aaa90", marginTop: 4 }}>{sub}</div>}
      {badge && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, padding: "2px 8px", borderRadius: 20, marginTop: 6, fontWeight: 500, ...badgeStyle }}>
          {badge}
        </div>
      )}
    </div>
  );
}
