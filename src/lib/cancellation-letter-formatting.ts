import {
  cancellationFontOptions,
  type CancellationFontName,
} from "@/lib/cancellation-form-settings";

export type CancellationLetterFormatRun = {
  start: number;
  end: number;
  font: CancellationFontName;
  fontSize: number;
};

export type CancellationLetterFormatting = Record<string, CancellationLetterFormatRun[]>;

type LetterDraft = {
  FirstName?: string | null;
  LastName?: string | null;
  FullName?: string | null;
  FatherName?: string | null;
  TarikhTavalod?: string | null;
  ShomareShenasnameh?: string | null;
  CodeMelli?: string | null;
  TarikhEblagh?: string | null;
  ModatEblagKhedmat?: number | null;
  PostOnvan?: string | null;
  TarikhPayan?: string | null;
  RequesterFullName?: string | null;
  RequesterPostTitle?: string | null;
};

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export function buildCancellationLetterBlocks(draft: LetterDraft, reasons: string[]) {
  const fullName = draft.FullName || [draft.FirstName, draft.LastName].filter(Boolean).join(" ") || "—";
  const visibleReasons = reasons.map((reason) => reason.trim()).filter(Boolean).slice(0, 10);
  let body = "";
  const bodyFields: Array<{ start: number; end: number }> = [];
  const append = (value: string) => { body += value; };
  const appendField = (value: string | number | null | undefined) => {
    const start = body.length;
    body += display(value);
    bodyFields.push({ start, end: body.length });
  };

  append("با سلام و احترام، پیرو مذاکره قبلی جنابعالی، برادر: ");
  appendField(fullName);
  append(" فرزند: ");
  appendField(draft.FatherName);
  append(" شماره شناسنامه: ");
  appendField(draft.ShomareShenasnameh);
  append(" با کد ملی: ");
  appendField(draft.CodeMelli);
  append(" متولد: ");
  appendField(draft.TarikhTavalod);
  append(" که از تاریخ ");
  appendField(draft.TarikhEblagh);
  append(" به مدت ");
  appendField(draft.ModatEblagKhedmat);
  append(" ماه به عنوان ");
  appendField(draft.PostOnvan);
  append(" مشغول خدمت بوده و ابلاغ مسئولیت وی در تاریخ ");
  appendField(draft.TarikhPayan);
  append(" به اتمام می‌رسد ☑ به دلایل زیر تقاضای لغو ابلاغ ☑ نامبرده را دارم؛ خواهشمند است دستورات لازم صادر فرمایید.");

  return {
    title: "پیشنهاد لغو ابلاغ مسئولیت",
    recipient: "جناب آقای دکتر صادقی مقدم\nمعاون محترم اجرایی و امور انتخابات",
    body,
    bodyFields,
    reasonsTitle: "دلایل:",
    reasons: visibleReasons,
    signer: `${display(draft.RequesterPostTitle || "مدیرکل - رئیس")}\n${display(draft.RequesterFullName)}\nتاریخ و امضاء`,
    copy: "رونوشت: دفتر محترم بازرسی",
  };
}

const allowedFonts = new Set<string>(cancellationFontOptions.map((item) => item.value));

export function normalizeCancellationLetterFormatting(
  value: unknown,
  blocks: ReturnType<typeof buildCancellationLetterBlocks>,
): CancellationLetterFormatting {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const blockTexts: Record<string, string> = {
    title: blocks.title,
    recipient: blocks.recipient,
    body: blocks.body,
    "reasons-title": blocks.reasonsTitle,
    signer: blocks.signer,
    copy: blocks.copy,
  };
  blocks.reasons.forEach((reason, index) => { blockTexts[`reason-${index}`] = reason; });

  const result: CancellationLetterFormatting = {};
  let totalRuns = 0;
  for (const [blockId, rawRuns] of Object.entries(value as Record<string, unknown>)) {
    const text = blockTexts[blockId];
    if (text === undefined || !Array.isArray(rawRuns)) continue;
    const runs: CancellationLetterFormatRun[] = [];
    for (const rawRun of rawRuns) {
      if (totalRuns >= 100 || !rawRun || typeof rawRun !== "object" || Array.isArray(rawRun)) break;
      const item = rawRun as Record<string, unknown>;
      const start = Number(item.start);
      const end = Number(item.end);
      const font = item.font;
      const fontSize = Number(item.fontSize);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > text.length) continue;
      if (typeof font !== "string" || !allowedFonts.has(font)) continue;
      if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 72) continue;
      runs.push({ start, end, font: font as CancellationFontName, fontSize: Math.round(fontSize) });
      totalRuns += 1;
    }
    if (runs.length) result[blockId] = runs.sort((a, b) => a.start - b.start || a.end - b.end);
  }
  return result;
}
