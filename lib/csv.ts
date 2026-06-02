// ── Bank CSV parser ───────────────────────────────────────────────────────────
// Converts a pasted bank CSV (Korean or English headers) into TxInput[].
// Defensive: skips blank/garbage rows, never throws on a single bad row.

import type { TxInput } from "./finance-store";

/** Minimal CSV row split: handles basic quoted fields, trims cells. */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/** Normalise a date string to YYYY-MM-DD (handles . and / separators, strips time). */
function normaliseDate(raw: string): string {
  // Take first 10 chars; then replace . or / with -
  return raw.slice(0, 10).replace(/[./]/g, "-");
}

/** Strip ₩, commas, spaces and parse to number. Returns 0 if unparseable. */
function parseAmount(raw: string): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[₩,\s]/g, ""));
  return isFinite(n) ? n : 0;
}

/** Header aliases → canonical field names. */
const DATE_KEYS = ["거래일시", "거래일자", "거래일", "날짜", "date"];
const COUNTERPARTY_KEYS = ["적요", "내용", "거래처", "비고", "가맹점", "counterparty"];
const WITHDRAWAL_KEYS = ["출금", "출금액", "지급", "withdrawal"];
const DEPOSIT_KEYS = ["입금", "입금액", "입금액(원)", "deposit"];
const BALANCE_KEYS = ["잔액", "balance"];

function findColIndex(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex(
      (h) => h.replace(/\s/g, "").toLowerCase() === alias.toLowerCase(),
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseBankCsv(text: string): TxInput[] {
  const rawLines = text.split(/\r?\n/);
  if (rawLines.length < 2) return [];

  // Find the header row: first row that contains at least one known date or amount column alias.
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
    const cells = splitRow(rawLines[i]);
    const cellsLower = cells.map((c) => c.replace(/\s/g, "").toLowerCase());
    const allAliases = [
      ...DATE_KEYS,
      ...COUNTERPARTY_KEYS,
      ...WITHDRAWAL_KEYS,
      ...DEPOSIT_KEYS,
      ...BALANCE_KEYS,
    ].map((a) => a.toLowerCase());
    if (cellsLower.some((c) => allAliases.includes(c))) {
      headerIdx = i;
      headers = cells;
      break;
    }
  }

  if (headerIdx === -1) {
    // No recognisable header — try treating the first non-empty line as header.
    headerIdx = 0;
    headers = splitRow(rawLines[0]);
  }

  const dateCol = findColIndex(headers, DATE_KEYS);
  const cpCol = findColIndex(headers, COUNTERPARTY_KEYS);
  const outCol = findColIndex(headers, WITHDRAWAL_KEYS);
  const inCol = findColIndex(headers, DEPOSIT_KEYS);
  const balCol = findColIndex(headers, BALANCE_KEYS);

  const results: TxInput[] = [];

  for (let i = headerIdx + 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    try {
      const cells = splitRow(line);
      // Skip rows that are clearly not data (all empty, summary rows, etc.)
      if (cells.every((c) => !c)) continue;

      const rawDate = dateCol !== -1 ? cells[dateCol] ?? "" : "";
      if (!rawDate) continue; // No date = not a data row

      const date = normaliseDate(rawDate);
      // Basic YYYY-MM-DD validation
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

      const counterparty = cpCol !== -1 ? cells[cpCol]?.trim() || "—" : "—";
      const outAmt = outCol !== -1 ? parseAmount(cells[outCol] ?? "") : 0;
      const inAmt = inCol !== -1 ? parseAmount(cells[inCol] ?? "") : 0;
      const balance = balCol !== -1 ? parseAmount(cells[balCol] ?? "") : undefined;

      // Skip rows with no amount at all
      if (outAmt === 0 && inAmt === 0) continue;

      const direction = outAmt > 0 ? "out" : "in";
      const amount = outAmt > 0 ? outAmt : inAmt;

      results.push({
        date,
        direction,
        counterparty,
        amount,
        balance: balance !== undefined && balance > 0 ? balance : undefined,
        source: "csv",
      });
    } catch {
      // Skip bad row silently
    }
  }

  return results;
}
