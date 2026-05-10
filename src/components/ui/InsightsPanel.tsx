"use client";
import { useEffect, useState } from "react";

interface Insight {
  type: "warning" | "success" | "tip" | "alert";
  title: string;
  message: string;
  emoji: string;
}

const typeStyles = {
  warning: { background: "#fff8ec", border: "#FDC3A1", color: "#a0622a" },
  alert:   { background: "#fff0f3", border: "#FB9B8F", color: "#c0446a" },
  success: { background: "#e8f8ee", border: "#A2CB8B", color: "#2d6a3f" },
  tip:     { background: "#f0f8ef", border: "#C7EABB", color: "#3a6a35" },
};

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/ai/insights")
      .then((r) => r.json())
      .then((d) => {
        setInsights(d.insights || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3a2e" }}>AI Spending Insights</span>
          <span style={{ fontSize: 10, background: "#E8F5BD", color: "#3a7a3a", padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>Powered by Claude</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 11, color: "#84B179", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          {expanded ? "Show less ↑" : "Show all ↓"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 64, borderRadius: 10, background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* Insights */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(expanded ? insights : insights.slice(0, 2)).map((insight, i) => {
            const s = typeStyles[insight.type] || typeStyles.tip;
            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, background: s.background, border: `1px solid ${s.border}`, borderRadius: 10, padding: "10px 12px" }}
              >
                <span style={{ fontSize: 20, lineHeight: 1.3, flexShrink: 0 }}>{insight.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#2d3a2e", marginBottom: 2 }}>{insight.title}</div>
                  <div style={{ fontSize: 12, color: "#5a7060", lineHeight: 1.5 }}>{insight.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && insights.length === 0 && (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#8aaa90", fontSize: 13 }}>
          Add transactions to get AI insights 💡
        </div>
      )}
    </div>
  );
}
