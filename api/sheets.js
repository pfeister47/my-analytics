import { google } from "googleapis";

// ─── Line Item Mappings ───────────────────────────────────────────────────────

const REVENUE_MAP = {
  "Additional Deliverables": "additionalDeliverables",
  "Additional Location":     "additionalDeliverables",
  "Creative Removed":        "other",
  "Deliverables approved":   "deliverablesApproved",
  "Extra Time On Site":      "additionalDeliverables",
  "Fewer Deliverables":      "additionalDeliverables",
  "File":                    "other",
  "Last Minute Reschedule":  "lastMinuteReschedule",
  "Other":                   "other",
  "Project Cancelled":       "other",
  "Project Ordered":         "other",
  "Travel":                  "travel",
};

const EXPENSE_MAP = {
  "Base Amount":              "base",
  "Additional Deliverables":  "additionalDeliverables",
  "Last Minute Reschedule":   "lastMinuteReschedule",
  "Travel":                   "travel",
  "\\N":                      "lastMinuteReschedule",
  "Other":                    "other",
  "Additional Location":      "additionalDeliverables",
  "Extra Time On Site":       "additionalDeliverables",
  "Fewer Deliverables":       "additionalDeliverables",
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set.");
  const creds = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

// ─── Fetch a full tab as array of row objects ─────────────────────────────────

async function fetchTab(sheets, spreadsheetId, tabName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: tabName,
  });
  const [headers, ...rows] = res.data.values || [];
  if (!headers) return [];
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || "").trim(); });
    return obj;
  });
}

// ─── Extract spreadsheet ID from URL ─────────────────────────────────────────

function extractSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Invalid Google Sheets URL.");
  return match[1];
}

// ─── Build YYYY-MM from a date string ────────────────────────────────────────

function toYearMonth(dateStr) {
  if (!dateStr) return null;
  // Handle common formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Try DD/MM/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers so the browser app can call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sheetUrl } = req.body;
    if (!sheetUrl) return res.status(400).json({ error: "sheetUrl is required" });

    const spreadsheetId = extractSheetId(sheetUrl);
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    // ── Fetch both tabs ──────────────────────────────────────────────────────
    const [revenueRows, expenseRows] = await Promise.all([
      fetchTab(sheets, spreadsheetId, "Revenue"),
      fetchTab(sheets, spreadsheetId, "Expenses"),
    ]);

    // ── Index projects by Project Id ─────────────────────────────────────────
    // We build a map: projectId -> project object
    const projects = {};

    const ensureProject = (row, dateStr) => {
      const id = row["Project Id"] || row["Project ID"] || row["project_id"];
      if (!id) return null;
      if (!projects[id]) {
        projects[id] = {
          id,
          partner: row["Partner"] || "",
          product: row["Package"]  || "",
          country: row["Country"]  || "",
          numImages: 0,
          month: toYearMonth(dateStr) || "Unknown",
          revenue: {
            deliverablesApproved:   0,
            additionalDeliverables: 0,
            lastMinuteReschedule:   0,
            travel:                 0,
            other:                  0,
          },
          expenses: {
            base:                   0,
            additionalDeliverables: 0,
            lastMinuteReschedule:   0,
            travel:                 0,
            other:                  0,
          },
        };
      }
      return id;
    };

    // ── Process Revenue rows ─────────────────────────────────────────────────
    for (const row of revenueRows) {
      const dateStr = row["Revenue Date"] || "";
      const id = ensureProject(row, dateStr);
      if (!id) continue;

      // Images
      const imgs = parseFloat(row["Images"] || "0");
      if (!isNaN(imgs) && imgs > projects[id].numImages) projects[id].numImages = imgs;

      // Map line item
      const lineItem = row["Revenue Line Item"] || "";
      const mappedKey = REVENUE_MAP[lineItem];
      if (mappedKey) {
        const amount = parseFloat((row["Revenue Amount"] || "0").replace(/[$,]/g, "")) || 0;
        projects[id].revenue[mappedKey] = (projects[id].revenue[mappedKey] || 0) + amount;
      }
    }

    // ── Process Expense rows ─────────────────────────────────────────────────
    for (const row of expenseRows) {
      const dateStr = row["Expense Date"] || "";
      const id = ensureProject(row, dateStr);
      if (!id) continue;

      // Images (take max across both tabs)
      const imgs = parseFloat(row["Images"] || "0");
      if (!isNaN(imgs) && imgs > projects[id].numImages) projects[id].numImages = imgs;

      // Map line item
      const lineItem = row["Expense Line Item"] || "";
      const mappedKey = EXPENSE_MAP[lineItem] || EXPENSE_MAP[lineItem.trim()];
      if (mappedKey) {
        const amount = parseFloat((row["Expense Amount"] || "0").replace(/[$,]/g, "")) || 0;
        projects[id].expenses[mappedKey] = (projects[id].expenses[mappedKey] || 0) + amount;
      }
    }

    const result = Object.values(projects);
    return res.status(200).json({ projects: result, count: result.length });

  } catch (err) {
    console.error("Sheets API error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch sheet data" });
  }
}
