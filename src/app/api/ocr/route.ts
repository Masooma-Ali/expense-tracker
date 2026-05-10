import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("receipt") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP images are allowed" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB allowed." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const base64Image = `data:${file.type};base64,${base64}`;

    const ocrFormData = new FormData();
    ocrFormData.append("base64Image", base64Image);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    ocrFormData.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: process.env.OCR_API_KEY as string },
      body: ocrFormData,
    });

    if (!ocrResponse.ok) throw new Error("OCR API call failed");

    const ocrData = await ocrResponse.json();

    if (ocrData.IsErroredOnProcessing) {
      throw new Error(ocrData.ErrorMessage || "OCR processing failed");
    }

    const extractedText = ocrData.ParsedResults?.[0]?.ParsedText || "";

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "Could not read text from image. Try a clearer photo." },
        { status: 422 }
      );
    }

    console.log("OCR Raw Text:\n", extractedText);

    const parsed = parseReceiptText(extractedText);

    return NextResponse.json({ success: true, rawText: extractedText, parsed });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "Failed to process receipt. Please try again." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const VALID_TYPES       = ["expense", "income"] as const;
const VALID_CATEGORIES  = [
  "Groceries", "Shopping", "Dining", "Entertainment",
  "Transport", "Health", "Utilities", "Other",
] as const;

type TxType     = typeof VALID_TYPES[number];
type TxCategory = typeof VALID_CATEGORIES[number];

interface ParsedReceipt {
  amount:      number | null;
  date:        string | null;
  description: string | null;
  type:        TxType;
  category:    TxCategory;
  notes:       string | null;
}

// Keywords that map raw text → our categories
const CATEGORY_KEYWORDS: Record<TxCategory, string[]> = {
  Groceries:     ["grocery","groceries","supermarket","mart","carrefour","imtiaz","metro","hyperstar","food","vegetable","fruit","produce","bakery","dairy"],
  Dining:        ["restaurant","cafe","coffee","pizza","burger","biryani","dine","dining","kitchen","grill","eat","bbq","shawarma","mcdonalds","kfc","subway","starbucks","tea"],
  Transport:     ["uber","careem","taxi","cab","petrol","fuel","gas station","parking","toll","fare","ride","transport","lyft","bus","train","metro"],
  Shopping:      ["mall","store","shop","clothing","fashion","h&m","zara","amazon","electronics","retail","boutique","outlet","purchase"],
  Health:        ["pharmacy","hospital","clinic","doctor","medical","medicine","lab","test","health","dental","optical","chemist","drugstore"],
  Entertainment: ["cinema","netflix","movie","game","sport","park","ticket","concert","event","netflix","disney","youtube","streaming"],
  Utilities:     ["electricity","internet","phone","bill","water","gas","utility","utilities","telecom","wifi","broadband","ptcl","sui"],
  Other:         [],
};

// Keywords that hint at income
const INCOME_KEYWORDS = [
  "salary","income","payment received","credit","deposit","refund",
  "reimbursement","transfer in","received","earning",
];

// ─────────────────────────────────────────────
// Detect if receipt is structured (labeled fields) or messy (raw)
// ─────────────────────────────────────────────
function isStructuredReceipt(text: string): boolean {
  const lower = text.toLowerCase();
  // If it has at least 2 of these explicit labels it's structured
  const structuredLabels = ["amount","description","category","type","notes","date"];
  const found = structuredLabels.filter((l) => lower.includes(l));
  return found.length >= 2;
}

// ─────────────────────────────────────────────
// STRATEGY 1: Structured receipt parser
// Reads labeled fields line by line e.g. "AMOUNT\n$22.75"
// ─────────────────────────────────────────────
function parseStructured(text: string): ParsedReceipt {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let amount:      number | null = null;
  let date:        string | null = null;
  let description: string | null = null;
  let rawType:     string | null = null;
  let rawCategory: string | null = null;
  let notes:       string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].toLowerCase().replace(/[:\s]/g, "");
    const next  = lines[i + 1] || "";

    if (label === "amount") {
      const m = next.match(/[\$£€Rs]?\s*([\d,]+\.?\d{0,2})/);
      if (m) { amount = parseFloat(m[1].replace(",", "")); i++; }
    }

    if (label === "date") {
      const parsed = tryParseDate(next);
      if (parsed) { date = parsed; i++; }
    }

    if (label === "description") {
      // grab up to 2 lines as description (avoid picking up another label)
      const parts: string[] = [];
      let j = i + 1;
      while (j < lines.length && j <= i + 2) {
        const candidate = lines[j].toLowerCase().replace(/[:\s]/g, "");
        const isLabel = ["type","category","notes","amount","date","recurring"].includes(candidate);
        if (isLabel) break;
        parts.push(lines[j]);
        j++;
      }
      if (parts.length) { description = parts.join(" "); i = j - 1; }
    }

    if (label === "type") {
      rawType = next.toLowerCase().trim();
      i++;
    }

    if (label === "category") {
      rawCategory = next.trim();
      i++;
    }

    if (label === "notes" || label === "notes(optional)") {
      const parts: string[] = [];
      let j = i + 1;
      while (j < lines.length && j <= i + 3) {
        const candidate = lines[j].toLowerCase().replace(/[:\s]/g, "");
        const isLabel = ["type","category","description","amount","date"].includes(candidate);
        if (isLabel) break;
        // Stop at the summary box (lines that repeat Amount: $xx)
        if (/^amount:/i.test(lines[j])) break;
        parts.push(lines[j]);
        j++;
      }
      if (parts.length) { notes = parts.join(" "); i = j - 1; }
    }

    // Also catch inline patterns like "Amount: $22.75" inside summary boxes
    const inlineAmount = lines[i].match(/^amount:\s*[\$£€Rs]?([\d,]+\.?\d{0,2})/i);
    if (inlineAmount && !amount) {
      amount = parseFloat(inlineAmount[1].replace(",", ""));
    }

    const inlineDate = lines[i].match(/^date:\s*(.+)/i);
    if (inlineDate && !date) {
      date = tryParseDate(inlineDate[1].trim());
    }

    const inlineDesc = lines[i].match(/^description:\s*(.+)/i);
    if (inlineDesc && !description) {
      description = inlineDesc[1].trim();
    }

    const inlineType = lines[i].match(/^type:\s*(.+)/i);
    if (inlineType && !rawType) {
      rawType = inlineType[1].trim().toLowerCase();
    }

    const inlineCat = lines[i].match(/^category:\s*(.+)/i);
    if (inlineCat && !rawCategory) {
      rawCategory = inlineCat[1].trim();
    }

    const inlineNotes = lines[i].match(/^notes:\s*(.+)/i);
    if (inlineNotes && !notes) {
      notes = inlineNotes[1].trim();
    }
  }

  // Resolve type
  const type: TxType = rawType === "income" ? "income" : "expense";

  // Resolve category — first try exact match, then keyword match on all text
  const category = resolveCategory(rawCategory, text);

  return { amount, date, description, type, category, notes };
}

// ─────────────────────────────────────────────
// STRATEGY 2: Messy receipt parser
// Works on unstructured grocery-slip style text
// ─────────────────────────────────────────────
function parseMessy(text: string): ParsedReceipt {
  // ── Amount: look for TOTAL / GRAND TOTAL / largest currency value
  let amount: number | null = null;
  const amountPatterns = [
    /(?:grand\s*total|total\s*amount|net\s*total|total)[^\d]*?([\d,]+\.?\d{0,2})/i,
    /(?:subtotal|sub-total)[^\d]*?([\d,]+\.?\d{0,2})/i,
    /[\$£€Rs]\s*([\d,]+\.\d{2})/g,
    /([\d,]+\.\d{2})\s*(?:USD|PKR|EUR|GBP)/i,
  ];

  for (const pattern of amountPatterns) {
    if (pattern instanceof RegExp && pattern.flags.includes("g")) {
      // pick the largest currency value found
      const matches = [...text.matchAll(pattern)];
      if (matches.length) {
        const values = matches.map((m) => parseFloat(m[1].replace(",", "")));
        amount = Math.max(...values);
        break;
      }
    } else {
      const match = text.match(pattern as RegExp);
      if (match) { amount = parseFloat(match[1].replace(",", "")); break; }
    }
  }

  // ── Date
  const date = extractDate(text);

  // ── Merchant / description — first meaningful line that isn't a number
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let description: string | null = null;
  for (const line of lines) {
    // skip lines that are purely numbers, currency, or very short
    if (/^[\d\s\$£€.,\-:\/]+$/.test(line)) continue;
    if (line.length < 3) continue;
    // skip common receipt noise
    if (/^(receipt|invoice|bill|tax|vat|total|subtotal|thank|welcome|date|time|cashier|ref|no\.|#)/i.test(line)) continue;
    description = line;
    break;
  }

  // ── Type: income hints
  const lower = text.toLowerCase();
  const type: TxType = INCOME_KEYWORDS.some((k) => lower.includes(k)) ? "income" : "expense";

  // ── Category from keywords
  const category = resolveCategory(null, text);

  // ── Notes: look for any "note" / "memo" / "remark" line
  let notes: string | null = null;
  const notesMatch = text.match(/(?:note|memo|remark|comment)[s]?[:\-]?\s*(.+)/i);
  if (notesMatch) notes = notesMatch[1].trim();

  return { amount, date, description, type, category, notes };
}

// ─────────────────────────────────────────────
// Main entry — picks strategy automatically
// ─────────────────────────────────────────────
function parseReceiptText(text: string): ParsedReceipt {
  if (isStructuredReceipt(text)) {
    const result = parseStructured(text);
    // Fill any gaps using messy parser as fallback
    const fallback = parseMessy(text);
    return {
      amount:      result.amount      ?? fallback.amount,
      date:        result.date        ?? fallback.date,
      description: result.description ?? fallback.description,
      type:        result.type        ?? fallback.type,
      category:    result.category    !== "Other" ? result.category : fallback.category,
      notes:       result.notes       ?? fallback.notes,
    };
  }
  return parseMessy(text);
}

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

function tryParseDate(str: string): string | null {
  if (!str) return null;
  // Common formats: MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, "Jan 5, 2026", etc.
  const patterns = [
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
  ];
  for (const p of patterns) {
    const m = str.match(p);
    if (m) {
      try {
        const d = new Date(m[0]);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      } catch { /* skip */ }
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  return tryParseDate(text);
}

function resolveCategory(rawCategory: string | null, fullText: string): TxCategory {
  // 1. Try exact match against our list
  if (rawCategory) {
    const exact = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === rawCategory.toLowerCase()
    );
    if (exact) return exact;
  }

  // 2. Try keyword match on full text (+ rawCategory)
  const haystack = (fullText + " " + (rawCategory || "")).toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TxCategory, string[]][]) {
    if (cat === "Other") continue;
    if (keywords.some((kw) => haystack.includes(kw))) return cat;
  }

  return "Other";
}