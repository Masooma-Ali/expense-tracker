"use client";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ForecastResult {
  category: string;
  history: { name: string; actual: number }[];
  predicted: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

interface Props {
  data: ForecastResult[];
}

const trendColors = {
  up: "#F57799",
  down: "#A2CB8B",
  stable: "#FDC3A1",
};

const trendIcons = {
  up: "📈",
  down: "📉",
  stable: "➡️",
};

const trendLabels = {
  up: "Spending likely to increase",
  down: "Spending likely to decrease",
  stable: "Spending likely to stay stable",
};

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isForecast = label?.includes("forecast");
  return (
    <div style={{ background: "#fff", border: "1px solid #dde8da", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: isForecast ? "#F57799" : "#2d3a2e" }}>
        {label} {isForecast ? "🔮" : ""}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

export function ForecastChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90", fontSize: 13 }}>
        Not enough data to forecast. Add at least 2 months of transactions.
      </div>
    );
  }

  // Show top 3 categories only
  const topCategories = data.slice(0, 3);

  return (
    <div>
      {/* Forecast summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        {topCategories.map((cat) => (
          <div
            key={cat.category}
            style={{ background: "#f8fdf8", border: `1px solid ${trendColors[cat.trend]}`, borderRadius: 10, padding: "12px 14px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3a2e" }}>{cat.category}</span>
              <span style={{ fontSize: 16 }}>{trendIcons[cat.trend]}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: trendColors[cat.trend], marginBottom: 2 }}>
              {formatCurrency(cat.predicted)}
            </div>
            <div style={{ fontSize: 10, color: "#8aaa90" }}>
              {trendLabels[cat.trend]} ({cat.changePercent}% {cat.trend === "up" ? "more" : cat.trend === "down" ? "less" : ""})
            </div>
          </div>
        ))}
      </div>

      {/* Chart for top category */}
      {topCategories[0] && (
        <div>
          <div style={{ fontSize: 12, color: "#8aaa90", marginBottom: 8 }}>
            📊 Showing trend for <strong>{topCategories[0].category}</strong> — last bar is the forecast
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={topCategories[0].history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="actual"
                name="Spending"
                fill="#A2CB8B"
                radius={[4, 4, 0, 0]}
                // Last bar (forecast) styled differently via cell
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Trend"
                stroke="#84B179"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
              <ReferenceLine
                x={topCategories[0].history[topCategories[0].history.length - 1].name}
                stroke="#F57799"
                strokeDasharray="4 4"
                label={{ value: "Forecast", position: "top", fontSize: 10, fill: "#F57799" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
