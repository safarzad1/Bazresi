"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  cancellationFontFamily,
  cancellationFontOptions,
  defaultCancellationFormSettings,
  type CancellationFontName,
  type CancellationFormSettings,
} from "@/lib/cancellation-form-settings";
import {
  buildCancellationLetterBlocks,
  type CancellationLetterFormatting,
  type CancellationLetterFormatRun,
} from "@/lib/cancellation-letter-formatting";
import styles from "./CurrentAppointments.module.css";

type CancellationDraft = {
  EntesabId: number;
  PersonId: number;
  CodeMelli: string | null;
  FirstName: string | null;
  LastName: string | null;
  FullName: string | null;
  FatherName: string | null;
  TarikhTavalod: string | null;
  ShomareShenasnameh: string | null;
  PostId: number;
  PostOnvan: string | null;
  TarikhEblagh: string | null;
  ModatEblagKhedmat: number | null;
  TarikhPayan: string | null;
  DaysLeft: number | null;
  RequestingPostId: number;
  RequesterFullName: string | null;
  RequesterPostTitle: string | null;
  SignaturePath: string | null;
};

type CancellationTarget = {
  EntesabId: number;
  FullName: string | null;
};

type ApiResult = {
  draft?: CancellationDraft;
  message?: string;
  proposalId?: number;
  documentUrl?: string;
  settings?: CancellationFormSettings;
  canEditSettings?: boolean;
};

type Props = {
  target: CancellationTarget;
  onClose: () => void;
  onSaved: () => void;
};

const formStyleRows = [
  { label: "عنوان نامه", font: "TitleFont", size: "TitleFontSize", weight: "TitleFontWeight", min: 18, max: 60 },
  { label: "گیرنده", font: "RecipientFont", size: "RecipientFontSize", weight: "RecipientFontWeight", min: 12, max: 40 },
  { label: "متن نامه", font: "BodyFont", size: "BodyFontSize", weight: "BodyFontWeight", min: 11, max: 30 },
  { label: "داده‌های نامه", font: "DataFont", size: "DataFontSize", weight: "DataFontWeight", min: 10, max: 30 },
  { label: "عنوان دلایل", font: "ReasonsTitleFont", size: "ReasonsTitleFontSize", weight: "ReasonsTitleFontWeight", min: 10, max: 28 },
  { label: "متن دلایل", font: "ReasonsFont", size: "ReasonsFontSize", weight: "ReasonsFontWeight", min: 10, max: 28 },
  { label: "امضاکننده", font: "SignerFont", size: "SignerFontSize", weight: "SignerFontWeight", min: 11, max: 36 },
  { label: "رونوشت", font: "CopyFont", size: "CopyFontSize", weight: "CopyFontWeight", min: 10, max: 28 },
] as const;

async function responseJson(response: Response) {
  const data = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) throw new Error(data.message || "انجام عملیات با خطا روبه‌رو شد.");
  return data;
}

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formattedParts(text: string, runs: CancellationLetterFormatRun[] | undefined) {
  if (!runs?.length) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  runs.forEach((run, index) => {
    const start = Math.max(cursor, run.start);
    const end = Math.max(start, Math.min(text.length, run.end));
    if (start > cursor) parts.push(text.slice(cursor, start));
    if (end > start) {
      parts.push(<span key={`${start}-${end}-${index}`} style={{ fontFamily: cancellationFontFamily(run.font), fontSize: run.fontSize }}>{text.slice(start, end)}</span>);
    }
    cursor = Math.max(cursor, end);
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function formattedBodyParts(
  text: string,
  fields: Array<{ start: number; end: number }>,
  runs: CancellationLetterFormatRun[] | undefined,
  fieldStyle: CSSProperties,
) {
  const parts: ReactNode[] = [];
  const formatSlice = (start: number, end: number) => formattedParts(
    text.slice(start, end),
    runs?.flatMap((run) => {
      const clippedStart = Math.max(start, run.start);
      const clippedEnd = Math.min(end, run.end);
      return clippedEnd > clippedStart ? [{ ...run, start: clippedStart - start, end: clippedEnd - start }] : [];
    }),
  );
  let cursor = 0;
  fields.forEach((field, index) => {
    if (field.start > cursor) parts.push(<span key={`body-${cursor}`}>{formatSlice(cursor, field.start)}</span>);
    parts.push(<b key={`field-${index}`} style={fieldStyle}>{formatSlice(field.start, field.end)}</b>);
    cursor = field.end;
  });
  if (cursor < text.length) parts.push(<span key={`body-${cursor}`}>{formatSlice(cursor, text.length)}</span>);
  return parts;
}

function replaceFormattingRange(
  runs: CancellationLetterFormatRun[] | undefined,
  next: CancellationLetterFormatRun,
) {
  const result: CancellationLetterFormatRun[] = [];
  for (const run of runs ?? []) {
    if (run.end <= next.start || run.start >= next.end) result.push(run);
    else {
      if (run.start < next.start) result.push({ ...run, end: next.start });
      if (run.end > next.end) result.push({ ...run, start: next.end });
    }
  }
  result.push(next);
  result.sort((a, b) => a.start - b.start);
  return result.reduce<CancellationLetterFormatRun[]>((merged, run) => {
    const previous = merged.at(-1);
    if (previous && previous.end === run.start && previous.font === run.font && previous.fontSize === run.fontSize) previous.end = run.end;
    else merged.push({ ...run });
    return merged;
  }, []);
}

function CancellationLetterPreview({
  draft,
  reasons,
  settings,
  formatting,
  previewRef,
}: {
  draft: CancellationDraft;
  reasons: string[];
  settings: CancellationFormSettings;
  formatting: CancellationLetterFormatting;
  previewRef: RefObject<HTMLElement | null>;
}) {
  const blocks = buildCancellationLetterBlocks(draft, reasons);
  const visibleReasons = blocks.reasons;
  const totalReasonChars = visibleReasons.reduce((total, reason) => total + reason.length, 0);
  const dense = visibleReasons.length > 6 || totalReasonChars > 800;
  const veryDense = totalReasonChars > 1500;
  const bodySize = settings.BodyFontSize * (dense ? .9 : 1);
  const bodyLineHeight = Math.min(settings.BodyLineHeight, dense ? 1.85 : 3);
  const reasonsSize = settings.ReasonsFontSize * (veryDense ? .64 : dense ? .78 : 1);
  const reasonsLineHeight = Math.min(settings.ReasonsLineHeight, veryDense ? 1.3 : dense ? 1.45 : 3);
  const reasonRowHeight = settings.ReasonsRowHeight * (veryDense ? .72 : dense ? .82 : 1);

  return (
    <article ref={previewRef} className={`${styles.letterSheet} ${dense ? styles.letterSheetDense : ""} ${veryDense ? styles.letterSheetVeryDense : ""}`} dir="rtl">
      <h3 data-format-block="title" style={{ fontFamily: cancellationFontFamily(settings.TitleFont), fontSize: settings.TitleFontSize, fontWeight: settings.TitleFontWeight, marginBottom: settings.TitleBottomSpacing }}>{formattedParts(blocks.title, formatting.title)}</h3>
      <div data-format-block="recipient" className={styles.letterRecipient} style={{ fontFamily: cancellationFontFamily(settings.RecipientFont), fontSize: settings.RecipientFontSize, fontWeight: settings.RecipientFontWeight, marginBottom: settings.RecipientBottomSpacing }}>{formattedParts(blocks.recipient, formatting.recipient)}</div>
      <p data-format-block="body" className={styles.letterBody} style={{ fontFamily: cancellationFontFamily(settings.BodyFont), fontSize: bodySize, fontWeight: settings.BodyFontWeight, lineHeight: bodyLineHeight, textIndent: settings.BodyFirstLineIndent }}>{formattedBodyParts(blocks.body, blocks.bodyFields, formatting.body, { fontFamily: cancellationFontFamily(settings.DataFont), fontSize: settings.DataFontSize, fontWeight: settings.DataFontWeight })}</p>
      <strong data-format-block="reasons-title" className={styles.reasonsTitle} style={{ fontFamily: cancellationFontFamily(settings.ReasonsTitleFont), fontSize: settings.ReasonsTitleFontSize, fontWeight: settings.ReasonsTitleFontWeight, marginTop: settings.ReasonsTitleTopSpacing }}>{formattedParts(blocks.reasonsTitle, formatting["reasons-title"])}</strong>
      {visibleReasons.length ? (
        <ol className={styles.letterReasons} style={{ fontFamily: cancellationFontFamily(settings.ReasonsFont), fontSize: reasonsSize, fontWeight: settings.ReasonsFontWeight, lineHeight: reasonsLineHeight }}>
          {visibleReasons.map((reason, index) => (
            <li style={{ minHeight: reasonRowHeight }} key={`${index}-${reason}`}>
              <span>{Number(index + 1).toLocaleString("fa-IR")}.</span>
              <div data-format-block={`reason-${index}`}>{formattedParts(reason, formatting[`reason-${index}`])}</div>
            </li>
          ))}
        </ol>
      ) : <div className={styles.letterReasonsPlaceholder}>دلایل واردشده در این قسمت نمایش داده می‌شود.</div>}

      <div data-format-block="signer" className={styles.letterSignature} style={{ fontFamily: cancellationFontFamily(settings.SignerFont), fontSize: settings.SignerFontSize, fontWeight: settings.SignerFontWeight }}>{formattedParts(blocks.signer, formatting.signer)}</div>
      <div data-format-block="copy" className={styles.letterCopy} style={{ fontFamily: cancellationFontFamily(settings.CopyFont), fontSize: settings.CopyFontSize, fontWeight: settings.CopyFontWeight }}>{formattedParts(blocks.copy, formatting.copy)}</div>
    </article>
  );
}

async function downloadPng(documentUrl: string, fullName: string) {
  const response = await fetch(documentUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("دریافت تصویر فرم انجام نشد.");
  const svg = await response.text();
  const sourceUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("تبدیل تصویر فرم انجام نشد."));
      image.src = sourceUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 2480;
    canvas.height = 3508;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("امکان ایجاد تصویر وجود ندارد.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("تولید فایل PNG انجام نشد.")), "image/png", 1);
    });
    const downloadUrl = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `پیشنهاد-لغو-ابلاغ-${fullName || "شخص"}.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function CancellationProposalModal({ target, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<CancellationDraft | null>(null);
  const [reasons, setReasons] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [settings, setSettings] = useState<CancellationFormSettings>(defaultCancellationFormSettings);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [formatting, setFormatting] = useState<CancellationLetterFormatting>({});
  const [selectedFont, setSelectedFont] = useState<CancellationFontName>("bnaznin");
  const [selectedFontSize, setSelectedFontSize] = useState(18);
  const [formatMessage, setFormatMessage] = useState("ابتدا بخشی از متن پیش‌نمایش را انتخاب کنید.");
  const previewRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const fullName = draft?.FullName || target.FullName || "—";
  const validReasons = useMemo(() => reasons.map((reason) => reason.trim()).filter(Boolean), [reasons]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void fetch(`/api/appointments/current/${target.EntesabId}/cancellation`, { cache: "no-store" })
      .then(responseJson)
      .then((data) => {
        if (active) {
          setDraft(data.draft ?? null);
          setSettings(data.settings ?? defaultCancellationFormSettings);
          setCanEditSettings(Boolean(data.canEditSettings));
          setSettingsDirty(false);
          setFormatting({});
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "دریافت فرم انجام نشد.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [target.EntesabId]);

  const changeReason = (index: number, value: string) => {
    setReasons((current) => current.map((reason, reasonIndex) => reasonIndex === index ? value.slice(0, 220) : reason));
    setFormatting((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("reason-"))));
    savedRangeRef.current = null;
  };

  const removeReason = (index: number) => {
    setReasons((current) => current.length === 1 ? [""] : current.filter((_, reasonIndex) => reasonIndex !== index));
    setFormatting((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("reason-"))));
    savedRangeRef.current = null;
  };

  const changeSetting = (
    key: keyof CancellationFormSettings,
    value: CancellationFormSettings[keyof CancellationFormSettings],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSettingsDirty(true);
    setSettingsMessage("تغییرات ذخیره نشده است.");
  };

  const saveSettings = async () => {
    if (!canEditSettings || !settingsDirty || savingSettings) return;
    setSavingSettings(true);
    setError("");
    setSettingsMessage("");
    try {
      const data = await responseJson(await fetch("/api/settings/cancellation-form", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }));
      setSettings(data.settings ?? settings);
      setSettingsDirty(false);
      setSettingsMessage(data.message || "تنظیمات فرم ذخیره شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره تنظیمات فرم انجام نشد.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      const preview = previewRef.current;
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !preview) return;
      const range = selection.getRangeAt(0);
      if (preview.contains(range.startContainer) && preview.contains(range.endContainer)) {
        savedRangeRef.current = range.cloneRange();
        setFormatMessage("متن انتخاب شد؛ فونت و اندازه را تعیین و اعمال کنید.");
      }
    };
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  const applySelectedFormatting = () => {
    const range = savedRangeRef.current;
    const preview = previewRef.current;
    if (!range || range.collapsed || !preview) {
      setFormatMessage("ابتدا بخشی از متن پیش‌نمایش را انتخاب کنید.");
      return;
    }

    const updates: Array<{ blockId: string; start: number; end: number }> = [];
    preview.querySelectorAll<HTMLElement>("[data-format-block]").forEach((block) => {
      if (!range.intersectsNode(block)) return;
      const length = block.textContent?.length ?? 0;
      let start = 0;
      let end = length;
      if (block.contains(range.startContainer)) {
        const prefix = document.createRange();
        prefix.selectNodeContents(block);
        prefix.setEnd(range.startContainer, range.startOffset);
        start = prefix.toString().length;
      }
      if (block.contains(range.endContainer)) {
        const prefix = document.createRange();
        prefix.selectNodeContents(block);
        prefix.setEnd(range.endContainer, range.endOffset);
        end = prefix.toString().length;
      }
      if (end > start) updates.push({ blockId: block.dataset.formatBlock || "", start, end });
    });

    if (!updates.length) {
      setFormatMessage("متن انتخاب‌شده داخل محدوده قابل قالب‌بندی نیست.");
      return;
    }
    setFormatting((current) => {
      const next = { ...current };
      updates.forEach(({ blockId, start, end }) => {
        next[blockId] = replaceFormattingRange(next[blockId], {
          start,
          end,
          font: selectedFont,
          fontSize: selectedFontSize,
        });
      });
      return next;
    });
    savedRangeRef.current = null;
    window.getSelection()?.removeAllRanges();
    setFormatMessage("فونت و اندازه روی متن انتخاب‌شده اعمال شد.");
  };

  const submit = async () => {
    if (!draft || saving || documentUrl) return;
    if (!validReasons.length) {
      setError("حداقل یک دلیل لغو ابلاغ وارد کنید.");
      return;
    }
    if (settingsDirty) {
      setError("ابتدا تنظیمات ظاهر فرم را ذخیره کنید.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await responseJson(await fetch(`/api/appointments/current/${target.EntesabId}/cancellation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasons: validReasons, formatting }),
      }));
      setSuccess(data.message || "پیشنهاد لغو ابلاغ ثبت شد.");
      setDocumentUrl(data.documentUrl || "");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت پیشنهاد انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const saveImage = async () => {
    if (!documentUrl || downloading) return;
    setDownloading(true);
    setError("");
    try {
      await downloadPng(documentUrl, fullName);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "دریافت تصویر انجام نشد.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <section className={styles.cancelModal} role="dialog" aria-modal="true" aria-labelledby="cancel-appointment-title">
        <header className={styles.modalHeader}>
          <div>
            <span>لغو ابلاغ</span>
            <h2 id="cancel-appointment-title">پیشنهاد لغو ابلاغ آقای {fullName}</h2>
          </div>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} disabled={saving} aria-label="بستن پنجره">×</button>
        </header>

        {loading ? <div className={styles.cancelModalLoading}><span className={styles.spinner} /> در حال تکمیل فرم از اطلاعات سیستم...</div> : null}
        {!loading && error && !draft ? <div className={styles.cancelModalFatal}>{error}<button type="button" onClick={onClose}>بستن</button></div> : null}

        {!loading && draft ? (
          <div className={styles.cancelWorkspace}>
            <aside className={styles.cancelEditor}>
              <div className={styles.autoInfoNotice}>مشخصات فرم از سیستم تکمیل شده است. متن قابل تغییر نیست؛ اما می‌توانید هر بخش را در پیش‌نمایش انتخاب کرده و فونت و اندازه آن را تغییر دهید.</div>

              <div className={styles.cancelSummary}>
                <div><span>نام و نام خانوادگی</span><strong>{fullName}</strong></div>
                <div><span>عنوان پست</span><strong>{display(draft.PostOnvan)}</strong></div>
                <div><span>تاریخ ابلاغ</span><strong>{display(draft.TarikhEblagh)}</strong></div>
                <div><span>تاریخ پایان</span><strong>{display(draft.TarikhPayan)}</strong></div>
              </div>

              {canEditSettings && !documentUrl ? (
                <details className={styles.formStyleSettings}>
                  <summary>تنظیمات فونت و اندازه فرم</summary>
                  <div className={styles.styleSettingsTable}>
                    <div className={styles.styleSettingsTableHeader}>
                      <span>بخش</span><span>فونت</span><span>اندازه</span><span>حالت</span>
                    </div>
                    {formStyleRows.map((row) => (
                      <div className={styles.styleSettingsTableRow} key={row.label}>
                        <strong>{row.label}</strong>
                        <select
                          value={String(settings[row.font])}
                          onChange={(event) => changeSetting(row.font, event.target.value as CancellationFontName)}
                        >
                          {cancellationFontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                        </select>
                        <input
                          type="number"
                          min={row.min}
                          max={row.max}
                          value={Number(settings[row.size])}
                          onChange={(event) => changeSetting(row.size, Number(event.target.value))}
                        />
                        <select
                          value={Number(settings[row.weight])}
                          onChange={(event) => changeSetting(row.weight, Number(event.target.value) as 400 | 700)}
                        >
                          <option value={400}>معمولی</option>
                          <option value={700}>بولد</option>
                        </select>
                      </div>
                    ))}
                    <div className={styles.styleSettingsAdvanced}>
                      <label>فاصله خطوط متن<input type="number" min="1.2" max="3" step="0.05" value={settings.BodyLineHeight} onChange={(event) => changeSetting("BodyLineHeight", Number(event.target.value))} /></label>
                      <label>فاصله خطوط دلایل<input type="number" min="1.1" max="3" step="0.05" value={settings.ReasonsLineHeight} onChange={(event) => changeSetting("ReasonsLineHeight", Number(event.target.value))} /></label>
                      <label>ارتفاع سطر دلیل<input type="number" min="24" max="100" value={settings.ReasonsRowHeight} onChange={(event) => changeSetting("ReasonsRowHeight", Number(event.target.value))} /></label>
                      <label>فاصله عنوان تا گیرنده<input type="number" min="0" max="100" value={settings.TitleBottomSpacing} onChange={(event) => changeSetting("TitleBottomSpacing", Number(event.target.value))} /></label>
                      <label>فاصله گیرنده تا متن<input type="number" min="0" max="100" value={settings.RecipientBottomSpacing} onChange={(event) => changeSetting("RecipientBottomSpacing", Number(event.target.value))} /></label>
                      <label>تورفتگی شروع متن<input type="number" min="0" max="100" value={settings.BodyFirstLineIndent} onChange={(event) => changeSetting("BodyFirstLineIndent", Number(event.target.value))} /></label>
                      <label>فاصله عنوان دلایل<input type="number" min="0" max="100" value={settings.ReasonsTitleTopSpacing} onChange={(event) => changeSetting("ReasonsTitleTopSpacing", Number(event.target.value))} /></label>
                    </div>
                  </div>
                  <div className={styles.styleSettingsActions}>
                    <button type="button" onClick={() => void saveSettings()} disabled={!settingsDirty || savingSettings}>{savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
                    {settingsMessage ? <span>{settingsMessage}</span> : null}
                  </div>
                </details>
              ) : null}

              <div className={styles.reasonsEditorHeader}>
                <div><strong>دلایل لغو ابلاغ</strong><span>{validReasons.length.toLocaleString("fa-IR")} از ۱۰ دلیل</span></div>
                <button type="button" onClick={() => setReasons((current) => current.length < 10 ? [...current, ""] : current)} disabled={reasons.length >= 10 || Boolean(documentUrl)}>+ افزودن دلیل</button>
              </div>

              <div className={styles.reasonInputs}>
                {reasons.map((reason, index) => (
                  <label key={index} className={styles.reasonInputCard}>
                    <span>دلیل {Number(index + 1).toLocaleString("fa-IR")}</span>
                    <textarea
                      value={reason}
                      onChange={(event) => changeReason(index, event.target.value)}
                      maxLength={220}
                      rows={3}
                      placeholder="دلیل لغو ابلاغ را بنویسید..."
                      disabled={Boolean(documentUrl)}
                    />
                    <small>{reason.length.toLocaleString("fa-IR")} / ۲۲۰</small>
                    <button type="button" onClick={() => removeReason(index)} disabled={Boolean(documentUrl)} aria-label={`حذف دلیل ${index + 1}`}>حذف</button>
                  </label>
                ))}
              </div>

              {error ? <div className={styles.cancelError}>{error}</div> : null}
              {success ? <div className={styles.cancelSuccess}>{success}</div> : null}

              <div className={styles.cancelActions}>
                {!documentUrl ? <button type="button" className={styles.submitCancellation} onClick={() => void submit()} disabled={saving || !validReasons.length || settingsDirty}>{saving ? "در حال ثبت..." : "ثبت پیشنهاد و تهیه تصویر"}</button> : null}
                {documentUrl ? <button type="button" className={styles.downloadImageButton} onClick={() => void saveImage()} disabled={downloading}>{downloading ? "در حال تهیه PNG..." : "دریافت تصویر PNG"}</button> : null}
                <button type="button" className={styles.closeCancellation} onClick={onClose} disabled={saving}>بستن</button>
              </div>
            </aside>

            <div className={styles.letterPreviewPane}>
              <div className={styles.previewLabel}>{documentUrl ? "تصویر نهایی ثبت‌شده" : "پیش‌نمایش زنده فرم"}</div>
              {!documentUrl ? (
                <div className={styles.wordToolbar} onMouseDown={(event) => {
                  if ((event.target as HTMLElement).tagName === "BUTTON") event.preventDefault();
                }}>
                  <span>متن را در برگه انتخاب کنید</span>
                  <label>فونت
                    <select value={selectedFont} onChange={(event) => setSelectedFont(event.target.value as CancellationFontName)}>
                      {cancellationFontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                    </select>
                  </label>
                  <label>اندازه
                    <input type="number" min="8" max="72" value={selectedFontSize} onChange={(event) => setSelectedFontSize(Math.min(72, Math.max(8, Number(event.target.value) || 8)))} />
                  </label>
                  <button type="button" onClick={applySelectedFormatting}>اعمال روی انتخاب</button>
                  <button type="button" className={styles.clearFormattingButton} onClick={() => { savedRangeRef.current = null; setFormatting({}); setFormatMessage("قالب‌بندی‌های انتخابی پاک شد."); }}>پاک‌کردن قالب‌ها</button>
                  <small>{formatMessage}</small>
                </div>
              ) : null}
              {documentUrl ? <img className={styles.finalDocumentImage} src={documentUrl} alt={`فرم پیشنهاد لغو ابلاغ ${fullName}`} /> : <CancellationLetterPreview draft={draft} reasons={reasons} settings={settings} formatting={formatting} previewRef={previewRef} />}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
