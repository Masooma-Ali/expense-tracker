// Simple linear regression to predict next month's spending per category
// No external library needed — pure math

interface MonthData {
  month: number; // 1-12
  year: number;
  total: number;
}

interface ForecastResult {
  category: string;
  history: { name: string; actual: number }[];
  predicted: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Linear regression: given [x] points, predict next value
function linearRegression(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  const x = values.map((_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next point (index = n)
  const predicted = slope * n + intercept;
  return Math.max(0, Math.round(predicted * 100) / 100);
}

export function buildForecast(
  rawData: { _id: { year: number; month: number; category: string }; total: number }[]
): ForecastResult[] {
  // Group by category
  const categoryMap: Record<string, MonthData[]> = {};

  rawData.forEach((d) => {
    const cat = d._id.category;
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push({ month: d._id.month, year: d._id.year, total: d.total });
  });

  const results: ForecastResult[] = [];

  Object.entries(categoryMap).forEach(([category, months]) => {
    // Sort by date ascending
    months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

    const values = months.map((m) => m.total);
    const predicted = linearRegression(values);

    const lastActual = values[values.length - 1] || 0;
    const changePercent = lastActual > 0 ? Math.round(((predicted - lastActual) / lastActual) * 100) : 0;

    const trend: "up" | "down" | "stable" =
      changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable";

    const history = months.map((m) => ({
      name: `${MONTH_NAMES[m.month]} ${m.year}`,
      actual: m.total,
    }));

    // Add predicted point
    const lastMonth = months[months.length - 1];
    const nextMonth = lastMonth.month === 12 ? 1 : lastMonth.month + 1;
    const nextYear = lastMonth.month === 12 ? lastMonth.year + 1 : lastMonth.year;

    results.push({
      category,
      history: [
        ...history,
        { name: `${MONTH_NAMES[nextMonth]} ${nextYear} (forecast)`, actual: predicted },
      ],
      predicted,
      trend,
      changePercent: Math.abs(changePercent),
    });
  });

  // Sort by predicted amount descending
  return results.sort((a, b) => b.predicted - a.predicted);
}
