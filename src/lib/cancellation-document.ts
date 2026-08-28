import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cancellationFontFamily,
  type CancellationFontName,
  type CancellationFormSettings,
} from "@/lib/cancellation-form-settings";
import {
  buildCancellationLetterBlocks,
  normalizeCancellationLetterFormatting,
  type CancellationLetterFormatRun,
  type CancellationLetterFormatting,
} from "@/lib/cancellation-letter-formatting";
import type { CancellationProposalDraft } from "@/lib/cancellation-proposals-db";

type FontFile = { path: string[]; mime: string; format: string };

const fontFiles: Record<CancellationFontName, FontFile> = {
  IranNastaliq: { path: ["Nastaliq", "IranNastaliq.woff"], mime: "font/woff", format: "woff" },
  titr: { path: ["Titr", "BTitr.ttf"], mime: "font/ttf", format: "truetype" },
  MitraBold: { path: ["BMitra", "BMitraBold.ttf"], mime: "font/ttf", format: "truetype" },
  bnaznin: { path: ["BNaznin", "BNAZANIN.TTF"], mime: "font/ttf", format: "truetype" },
  PeydaFaNum_Regular: { path: ["Peyda", "PeydaFaNum_Regular.ttf"], mime: "font/ttf", format: "truetype" },
  IRANSansXMedium: { path: ["IranSanse", "IRANSansX-MediumD4.woff"], mime: "font/woff", format: "woff" },
  Shabnam: { path: ["Shabnam", "Shabnam-Light-FD.woff2"], mime: "font/woff2", format: "woff2" },
};

const fontCache = new Map<CancellationFontName, string | null>();

function embeddedFontFace(fontName: CancellationFontName) {
  if (fontCache.has(fontName)) return fontCache.get(fontName) ?? "";
  try {
    const file = fontFiles[fontName];
    const bytes = readFileSync(join(process.cwd(), "Styles", "Fonts", ...file.path));
    const face = `@font-face{font-family:${fontName};src:url(data:${file.mime};base64,${bytes.toString("base64")}) format('${file.format}');}`;
    fontCache.set(fontName, face);
    return face;
  } catch {
    fontCache.set(fontName, null);
    return "";
  }
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function persianNumber(value: number) {
  return String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function formattedText(
  text: string,
  runs: CancellationLetterFormatRun[] | undefined,
  scale: number,
) {
  if (!runs?.length) return escapeHtml(text).replaceAll("\n", "<br/>");
  const parts: string[] = [];
  let cursor = 0;
  for (const run of runs) {
    const start = Math.max(cursor, run.start);
    const end = Math.max(start, run.end);
    if (start > cursor) parts.push(escapeHtml(text.slice(cursor, start)).replaceAll("\n", "<br/>"));
    if (end > start) {
      parts.push(`<span style="font-family:${cancellationFontFamily(run.font)};font-size:${run.fontSize * scale}px">${escapeHtml(text.slice(start, end)).replaceAll("\n", "<br/>")}</span>`);
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < text.length) parts.push(escapeHtml(text.slice(cursor)).replaceAll("\n", "<br/>"));
  return parts.join("");
}

function formattedBodyText(
  text: string,
  fields: Array<{ start: number; end: number }>,
  runs: CancellationLetterFormatRun[] | undefined,
  scale: number,
) {
  const slice = (start: number, end: number) => formattedText(
    text.slice(start, end),
    runs?.flatMap((run) => {
      const clippedStart = Math.max(start, run.start);
      const clippedEnd = Math.min(end, run.end);
      return clippedEnd > clippedStart ? [{ ...run, start: clippedStart - start, end: clippedEnd - start }] : [];
    }),
    scale,
  );
  const parts: string[] = [];
  let cursor = 0;
  fields.forEach((field) => {
    if (field.start > cursor) parts.push(slice(cursor, field.start));
    parts.push(`<span class="letter-data">${slice(field.start, field.end)}</span>`);
    cursor = field.end;
  });
  if (cursor < text.length) parts.push(slice(cursor, text.length));
  return parts.join("");
}

export function buildCancellationDocumentSvg(
  draft: CancellationProposalDraft,
  reasons: string[],
  settings: CancellationFormSettings,
  rawFormatting: CancellationLetterFormatting = {},
) {
  const blocks = buildCancellationLetterBlocks(draft, reasons);
  const formatting = normalizeCancellationLetterFormatting(rawFormatting, blocks);
  const selectedFonts = new Set<CancellationFontName>([
    settings.TitleFont,
    settings.RecipientFont,
    settings.SignerFont,
    settings.BodyFont,
    settings.DataFont,
    settings.ReasonsTitleFont,
    settings.ReasonsFont,
    settings.CopyFont,
  ]);
  Object.values(formatting).flat().forEach((run) => selectedFonts.add(run.font));
  const fontFaces = [...selectedFonts].map(embeddedFontFace).join("");
  const visibleReasons = blocks.reasons;
  const totalReasonChars = visibleReasons.reduce((total, reason) => total + reason.length, 0);
  const denseReasons = visibleReasons.length > 6 || totalReasonChars > 800;
  const veryDenseReasons = totalReasonChars > 1500;
  const scale = 1240 / 794;
  const reasonFontSize = settings.ReasonsFontSize * scale * (veryDenseReasons ? .64 : denseReasons ? .78 : 1);
  const reasonLineHeight = Math.min(settings.ReasonsLineHeight, veryDenseReasons ? 1.3 : denseReasons ? 1.45 : 3);
  const reasonMinHeight = settings.ReasonsRowHeight * scale * (veryDenseReasons ? .72 : denseReasons ? .82 : 1);
  const bodyFontSize = settings.BodyFontSize * scale * (denseReasons ? .9 : 1);
  const bodyLineHeight = Math.min(settings.BodyLineHeight, denseReasons ? 1.85 : 3);
  const reasonItems = visibleReasons
    .map((reason, index) => `<li><span class="reason-number">${persianNumber(index + 1)}.</span><div class="reason-text">${formattedText(reason, formatting[`reason-${index}`], scale)}</div></li>`)
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754" viewBox="0 0 1240 1754">
  <foreignObject x="0" y="0" width="1240" height="1754">
    <div xmlns="http://www.w3.org/1999/xhtml" class="page" dir="rtl">
      <style>
        ${fontFaces}
        *{box-sizing:border-box}
        .page{width:1240px;height:1754px;padding:132px 82px 80px;background:#fff;color:#080808;position:relative;overflow:hidden}
        .title{text-align:center;font-family:${cancellationFontFamily(settings.TitleFont)};font-size:${settings.TitleFontSize * scale}px;line-height:1.55;margin:5px 0 ${settings.TitleBottomSpacing * scale}px;font-weight:${settings.TitleFontWeight}}
        .recipient{text-align:right;margin:0 0 ${settings.RecipientBottomSpacing * scale}px;font-family:${cancellationFontFamily(settings.RecipientFont)};font-size:${settings.RecipientFontSize * scale}px;line-height:1.6;font-weight:${settings.RecipientFontWeight}}.recipient *{font-weight:inherit}
        .letter{font-family:${cancellationFontFamily(settings.BodyFont)};font-size:${bodyFontSize}px;font-weight:${settings.BodyFontWeight};line-height:${bodyLineHeight};text-align:justify;text-indent:${settings.BodyFirstLineIndent * scale}px;margin:0}
        .letter-data{color:#2d8585;font-family:bnaznin,Tahoma,Arial,sans-serif!important;font-size:inherit!important;font-weight:inherit!important}.letter-data *{color:inherit;font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important}
        .check{font-family:Tahoma,Arial,sans-serif;font-size:25px;margin:0 5px}
        .reason-title{font-family:${cancellationFontFamily(settings.ReasonsTitleFont)};font-size:${settings.ReasonsTitleFontSize * scale}px;margin:${settings.ReasonsTitleTopSpacing * scale}px 0 0;font-weight:${settings.ReasonsTitleFontWeight}}
        ol{margin:0;padding:0;font-family:${cancellationFontFamily(settings.ReasonsFont)};font-size:${reasonFontSize}px;font-weight:${settings.ReasonsFontWeight};line-height:${reasonLineHeight};list-style:none}
        li{min-height:${reasonMinHeight}px;display:grid;grid-template-columns:42px minmax(0,1fr);gap:5px;padding:6px 8px 5px 0;border-bottom:3px dotted #222}
        .reason-number{text-align:center}
        .reason-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}
        .signature{position:absolute;bottom:150px;left:125px;width:500px;text-align:center;font-family:${cancellationFontFamily(settings.SignerFont)};font-size:${settings.SignerFontSize * scale}px;font-weight:${settings.SignerFontWeight};line-height:1.55}.signature *{font-weight:inherit}
        .copy{position:absolute;bottom:75px;right:82px;font-family:${cancellationFontFamily(settings.CopyFont)};font-size:${settings.CopyFontSize * scale}px;font-weight:${settings.CopyFontWeight}}
      </style>
      <div class="title">${formattedText(blocks.title, formatting.title, scale)}</div>
      <div class="recipient">${formattedText(blocks.recipient, formatting.recipient, scale)}</div>
      <p class="letter">${formattedBodyText(blocks.body, blocks.bodyFields, formatting.body, scale)}</p>
      <div class="reason-title">${formattedText(blocks.reasonsTitle, formatting["reasons-title"], scale)}</div>
      <ol>${reasonItems}</ol>
      <div class="signature">${formattedText(blocks.signer, formatting.signer, scale)}</div>
      <div class="copy">${formattedText(blocks.copy, formatting.copy, scale)}</div>
    </div>
  </foreignObject>
</svg>`;

  return {
    svg,
    hash: createHash("sha256").update(svg, "utf8").digest("hex"),
  };
}
