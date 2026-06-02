// ── Business-card OCR scaffold ────────────────────────────────────────────────
// Uses Google Vision API when GOOGLE_VISION_API_KEY is set.
// Falls back gracefully so manual entry always works.

export function ocrConfigured(): boolean {
  return !!process.env.GOOGLE_VISION_API_KEY;
}

/**
 * Send a base64-encoded image to Google Vision DOCUMENT_TEXT_DETECTION.
 * Returns the full extracted text string.
 * Throws if Vision is not configured or the request fails.
 */
export async function readCard(imageBase64: string): Promise<string> {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) throw new Error("Vision not configured");

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Vision API error ${res.status}: ${msg}`);
  }

  const json = await res.json();
  return (json.responses?.[0]?.fullTextAnnotation?.text ?? "") as string;
}

/**
 * Parse raw OCR text from a business card into structured fields.
 * Never throws — returns best-effort extraction.
 */
export function parseCard(text: string): {
  name?: string;
  company?: string;
  phones: string[];
  emails: string[];
} {
  try {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Extract emails
    const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
    const emails = Array.from(new Set(text.match(emailRe) ?? []));

    // Extract Korean + general phone numbers
    const phoneRe = /(01[016789]|0\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
    const phones = Array.from(new Set(text.match(phoneRe) ?? []));

    // Guess company — look for a line containing common keywords
    const companyRe = /주식회사|Inc\.?|Corp\.?|Ltd\.?|Lab\.?|Studio/i;
    const company = lines.find((l) => companyRe.test(l));

    // Guess name — first non-empty line that isn't a URL, phone, or email
    const urlRe = /https?:|www\./i;
    const name = lines.find(
      (l) =>
        !emailRe.test(l) &&
        !phoneRe.test(l) &&
        !urlRe.test(l) &&
        l.length < 30,
    );

    // Reset regex lastIndex (they are global)
    emailRe.lastIndex = 0;
    phoneRe.lastIndex = 0;

    return { name, company, phones, emails };
  } catch {
    return { phones: [], emails: [] };
  }
}
