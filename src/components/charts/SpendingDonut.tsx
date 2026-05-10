"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORY_COLORS } from "@/lib/utils";

interface Props {
  data: { _id: string; total: number }[];
}

export function SpendingDonut({ data }: Props) {
  if (!data.length) return <div style={{ textAlign: "center", padding: "40px 0", color: "#8aaa90", fontSize: 13 }}>No spending data yet</div>;

  const total = data.reduce((a, d) => a + d.total, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="_id" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry._id} fill={CATEGORY_COLORS[entry._id] || "#b0b0b0"} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, ""]} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {data.map((d) => (
          <div key={d._id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#5a7060" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[d._id] || "#b0b0b0", display: "inline-block" }} />
            {d._id} {Math.round((d.total / total) * 100)}%
          </div>
        ))}
      </div>
    </div>
  );
}
