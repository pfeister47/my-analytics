import { google } from "googleapis";

// ─── Line Item Mappings (all keys lowercased for case-insensitive matching) ───

const REVENUE_MAP = {
  "additional deliverables": "additionalDeliverables",
  "additional location":     "additionalDeliverables",
  "creative removed":        "other",
  "deliverables approved":   "deliverablesApproved",
  "extra time on site":      "additionalDeliverables",
  "fewer deliverables":      "additionalDeliverables",
  "file":                    "other",
  "last minute reschedule":  "lastMinuteReschedule",
  "other":                   "other",
  "project cancelled":       "other",
  "project ordered":         "deliverablesApproved",
  "travel":                  "travel",
};

const EXPENSE_MAP = {
  "base amount":             "base",
  "additional deliverables": "additionalDeliverables",
  "last minute reschedule":  "lastMinuteReschedule",
  "travel":                  "travel",
  "\\n":                     "lastMinuteReschedule",
  "other":                   "other",
  "additional location":     "additionalDeliverables",
  "extra time on site":      "additionalDeliverables",
  "fewer deliverables":      "additionalDeliverables",
};

// ─── Country normalisation ────────────────────────────────────────────────────
const COUNTRY_MAP = {
  "us": "USA", "usa": "USA", "united states": "USA",
  "au": "Australia", "australia": "Australia",
  "uk": "UK", "gb": "UK", "united kingdom": "UK",
  "ca": "Canada", "canada": "Canada",
  "nz": "New Zealand", "new zealand": "New Zealand",
  "de": "Germany", "germany": "Germany",
  "fr": "France", "france": "France",
  "sg": "Singapore", "singapore": "Singapore",
  "ie": "Ireland", "ireland": "Ireland",
};
const normalizeCountry = raw => {
  if (!raw) return raw;
  return COUNTRY_MAP[raw.trim().toLowerCase()] || raw.trim();
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
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: tabName });
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
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const parts = dateStr.split("/");
    if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
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

    const [revenueRows, expenseRows] = await Promise.all([
      fetchTab(sheets, spreadsheetId, "Revenue"),
      fetchTab(sheets, spreadsheetId, "Expenses"),
    ]);

    const projects = {};

    const ensureProject = (row, dateStr) => {
      const id = row["Project Id"] || row["Project ID"] || row["project_id"];
      if (!id) return null;
      if (!projects[id]) {
        projects[id] = {
          id,
          partner:   row["Partner"] || "",
          product:   row["Package"] || "",
          country:   normalizeCountry(row["Country"] || ""),
          numImages: 0,
          month:     toYearMonth(dateStr) || "Unknown",
          revenue:   { deliverablesApproved:0, additionalDeliverables:0, lastMinuteReschedule:0, travel:0, other:0 },
          expenses:  { base:0, additionalDeliverables:0, lastMinuteReschedule:0, travel:0, other:0 },
        };
      }
      return id;
    };

    for (const row of revenueRows) {
      const id = ensureProject(row, row["Revenue Date"] || "");
      if (!id) continue;
      const imgs = parseFloat(row["Images"] || "0");
      if (!isNaN(imgs) && imgs > projects[id].numImages) projects[id].numImages = imgs;
      const lineItem = (row["Revenue Line Item"] || "").trim().toLowerCase();
      const mappedKey = REVENUE_MAP[lineItem];
      if (mappedKey) {
        const amount = parseFloat((row["Revenue Amount"] || "0").replace(/[$,]/g, "")) || 0;
        projects[id].revenue[mappedKey] += amount;
      }
    }

    for (const row of expenseRows) {
      const id = ensureProject(row, row["Expense Date"] || "");
      if (!id) continue;
      const imgs = parseFloat(row["Images"] || "0");
      if (!isNaN(imgs) && imgs > projects[id].numImages) projects[id].numImages = imgs;
      const lineItem = (row["Expense Line Item"] || "").trim().toLowerCase();
      const mappedKey = EXPENSE_MAP[lineItem];
      if (mappedKey) {
        const amount = parseFloat((row["Expense Amount"] || "0").replace(/[$,]/g, "")) || 0;
        projects[id].expenses[mappedKey] += amount;
      }
    }

    const result = Object.values(projects);
    return res.status(200).json({ projects: result, count: result.length });

  } catch (err) {
    console.error("Sheets API error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch sheet data" });
  }
}
