// Email utility using Resend (free: 100 emails/day, no credit card needed)
// Sign up at resend.com, get API key, add to .env.local as RESEND_API_KEY

interface WeeklySummaryData {
  userName: string;
  userEmail: string;
  totalSpent: number;
  totalIncome: number;
  topCategories: { category: string; amount: number }[];
  budgetAlerts: { category: string; spent: number; limit: number; percentage: number }[];
  weekStart: string;
  weekEnd: string;
  currency: string;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Build a clean HTML email
function buildEmailHTML(data: WeeklySummaryData): string {
  const savingsRate = data.totalIncome > 0
    ? (((data.totalIncome - data.totalSpent) / data.totalIncome) * 100).toFixed(1)
    : "0";

  const alertsHTML = data.budgetAlerts.length > 0
    ? `
      <div style="background:#fff4f7;border:1px solid #FB9B8F;border-radius:10px;padding:14px 16px;margin:16px 0">
        <p style="margin:0 0 10px;font-weight:600;color:#c0446a;font-size:14px">⚠️ Budget Alerts</p>
        ${data.budgetAlerts.map((a) => `
          <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid rgba(0,0,0,.05)">
            <span>${a.category}</span>
            <span style="color:${a.percentage > 100 ? "#c0446a" : "#e08020"};font-weight:500">
              ${formatCurrency(a.spent, data.currency)} / ${formatCurrency(a.limit, data.currency)} (${a.percentage}%)
            </span>
          </div>
        `).join("")}
      </div>
    `
    : `<div style="background:#e8f8ee;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:13px;color:#2d6a3f">✅ All budgets on track this week!</div>`;

  const categoriesHTML = data.topCategories.slice(0, 5).map((c) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#2d3a2e">${c.category}</td>
      <td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right;color:#2d3a2e">${formatCurrency(c.amount, data.currency)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f0f8ef;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#84B179,#A2CB8B);padding:28px 32px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">🌱</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Weekly Spending Report</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">${data.weekStart} — ${data.weekEnd}</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 32px">
      <p style="margin:0 0 20px;font-size:14px;color:#5a7060">Hi <strong>${data.userName}</strong>, here's your weekly financial summary 👇</p>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:#f0f8ef;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:11px;color:#8aaa90;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Spent</div>
          <div style="font-size:18px;font-weight:700;color:#F57799">${formatCurrency(data.totalSpent, data.currency)}</div>
        </div>
        <div style="background:#f0f8ef;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:11px;color:#8aaa90;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Income</div>
          <div style="font-size:18px;font-weight:700;color:#3a9a5c">${formatCurrency(data.totalIncome, data.currency)}</div>
        </div>
        <div style="background:#f0f8ef;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:11px;color:#8aaa90;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Saved</div>
          <div style="font-size:18px;font-weight:700;color:#84B179">${savingsRate}%</div>
        </div>
      </div>

      <!-- Budget alerts -->
      ${alertsHTML}

      <!-- Top categories -->
      <div style="margin-top:20px">
        <p style="margin:0 0 10px;font-weight:600;font-size:14px;color:#2d3a2e">📊 Top Spending Categories</p>
        <table style="width:100%;border-collapse:collapse">
          ${categoriesHTML}
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px">
        <a href="${process.env.NEXTAUTH_URL}/dashboard"
           style="display:inline-block;background:#84B179;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
          View Full Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fdf8;padding:16px 32px;text-align:center;border-top:1px solid #eef5ec">
      <p style="margin:0;font-size:11px;color:#8aaa90">Sprout Expense Tracker · You're receiving this because you have an account</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Send email via Resend API
export async function sendWeeklySummaryEmail(data: WeeklySummaryData): Promise<boolean> {
  try {
    const html = buildEmailHTML(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sprout <onboarding@resend.dev>",  // Use resend.dev for testing; replace with your domain later
        to: data.userEmail,
        subject: `🌱 Your Weekly Spending Summary — ${data.weekStart}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Resend API error:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("sendWeeklySummaryEmail error:", error);
    return false;
  }
}
