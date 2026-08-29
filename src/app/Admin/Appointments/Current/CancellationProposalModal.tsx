"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import domtoimage from "dom-to-image";
import {
  cancellationFontFamily,
  defaultCancellationFormSettings,
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
  reasons?: string[];
  message?: string;
  proposalId?: number;
  documentUrl?: string;
  settings?: CancellationFormSettings;
};

type Props = {
  target: CancellationTarget;
  onClose: () => void;
  onSaved: () => void;
};

async function responseJson(response: Response) {
  const data = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) throw new Error(data.message || "انجام عملیات با خطا روبه‌رو شد.");
  return data;
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
    parts.push(<span key={`field-${index}`} className={styles.letterData}>{formatSlice(field.start, field.end)}</span>);
    cursor = field.end;
  });
  if (cursor < text.length) parts.push(<span key={`body-${cursor}`}>{formatSlice(cursor, text.length)}</span>);
  return parts;
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
  previewRef: RefObject<HTMLDivElement | null>;
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
    <div id="cancellation-letter-card" ref={previewRef} role="document" className={`${styles.letterSheet} ${dense ? styles.letterSheetDense : ""} ${veryDense ? styles.letterSheetVeryDense : ""}`} dir="rtl">
      <h3 data-format-block="title" style={{ fontFamily: cancellationFontFamily(settings.TitleFont), fontSize: settings.TitleFontSize, fontWeight: settings.TitleFontWeight, marginBottom: settings.TitleBottomSpacing }}>{formattedParts(blocks.title, formatting.title)}</h3>
      <div data-format-block="recipient" className={styles.letterRecipient} style={{ fontFamily: cancellationFontFamily(settings.RecipientFont), fontSize: settings.RecipientFontSize, fontWeight: settings.RecipientFontWeight, marginBottom: settings.RecipientBottomSpacing }}>{formattedParts(blocks.recipient, formatting.recipient)}</div>
      <p data-format-block="body" className={styles.letterBody} style={{ fontFamily: cancellationFontFamily(settings.BodyFont), fontSize: bodySize, fontWeight: settings.BodyFontWeight, lineHeight: bodyLineHeight, textIndent: settings.BodyFirstLineIndent }}>{formattedBodyParts(blocks.body, blocks.bodyFields, formatting.body)}</p>
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
    </div>
  );
}

async function downloadPng(documentUrl: string, fullName: string) {
  const response = await fetch(documentUrl, { cache: "no-store" });
  if (!response.ok) throw new Error("دریافت تصویر فرم انجام نشد.");
  const imageBlob = await response.blob();
  if (!imageBlob.type.startsWith("image/")) throw new Error("فایل ذخیره‌شده تصویر معتبر نیست.");
  const downloadUrl = URL.createObjectURL(imageBlob);
  try {
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `پیشنهاد-لغو-ابلاغ-${fullName || "شخص"}.png`;
    anchor.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
}

async function exportNodeToPNGFile(nodeId: string, fileName: string) {
  const node = document.getElementById(nodeId);
  if (!node) return null;
  await document.fonts?.ready;
  const scale = 2;
  const width = 794;
  const height = 1123;
  const dataUrl = await domtoimage.toPng(node, {
    width: width * scale,
    height: height * scale,
    style: {
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      width: `${width}px`,
      height: `${height}px`,
      minWidth: `${width}px`,
      minHeight: `${height}px`,
      maxWidth: `${width}px`,
      maxHeight: `${height}px`,
      overflow: "hidden",
      margin: "0",
      boxShadow: "none",
    },
    bgcolor: "#ffffff",
  });
  const file = await dataUrlToFile(dataUrl, fileName);
  const previewUrl = URL.createObjectURL(file);
  return { file, previewUrl };
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
  const formatting: CancellationLetterFormatting = {};
  const previewRef = useRef<HTMLDivElement | null>(null);

  const fullName = draft?.FullName || target.FullName || "—";
  const validReasons = useMemo(() => reasons.map((reason) => reason.trim()).filter(Boolean), [reasons]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSuccess("");
    setReasons([""]);
    setDocumentUrl("");
    void fetch(`/api/appointments/current/${target.EntesabId}/cancellation`, { cache: "no-store" })
      .then(responseJson)
      .then((data) => {
        if (active) {
          setDraft(data.draft ?? null);
          setSettings(data.settings ?? defaultCancellationFormSettings);
          setReasons(data.reasons?.length ? data.reasons : [""]);
          setDocumentUrl(data.documentUrl ?? "");
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
  };

  const removeReason = (index: number) => {
    setReasons((current) => current.length === 1 ? [""] : current.filter((_, reasonIndex) => reasonIndex !== index));
  };

  const submit = async () => {
    if (!draft || saving || documentUrl) return;
    if (!validReasons.length) {
      setError("حداقل یک دلیل لغو ابلاغ وارد کنید.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const exported = await exportNodeToPNGFile("cancellation-letter-card", `cancellation-${target.EntesabId}.png`);
      if (!exported) throw new Error("کادر فرم برای تبدیل به تصویر پیدا نشد.");
      const formData = new FormData();
      formData.append("reasons", JSON.stringify(validReasons));
      formData.append("formImage", exported.file);
      let data: ApiResult;
      try {
        data = await responseJson(await fetch(`/api/appointments/current/${target.EntesabId}/cancellation`, {
          method: "POST",
          body: formData,
        }));
      } finally {
        URL.revokeObjectURL(exported.previewUrl);
      }
      setSuccess(data.message || "لغو ابلاغ، دلایل و پیوست نامه ثبت شد.");
      setDocumentUrl(data.documentUrl || "");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت لغو ابلاغ انجام نشد.");
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
              <div className={styles.reasonsEditorHeader}>
                <div><strong>دلایل لغو ابلاغ</strong><span>{validReasons.length.toLocaleString("fa-IR")} از ۱۰ دلیل</span></div>
              </div>

              <div className={styles.reasonInputs}>
                {reasons.map((reason, index) => (
                  <div key={index} className={styles.reasonRow}>
                    <span className={styles.reasonNumber}>{Number(index + 1).toLocaleString("fa-IR")}</span>
                    <label className={styles.reasonField}>
                      <textarea
                        value={reason}
                        onChange={(event) => changeReason(index, event.target.value)}
                        maxLength={220}
                        rows={2}
                        placeholder="متن دلیل را وارد کنید..."
                        disabled={Boolean(documentUrl)}
                      />
                      <small>{reason.length.toLocaleString("fa-IR")} / ۲۲۰</small>
                    </label>
                    <button type="button" className={styles.reasonRemoveButton} onClick={() => removeReason(index)} disabled={Boolean(documentUrl)} aria-label={`حذف دلیل ${index + 1}`} title="حذف دلیل">×</button>
                  </div>
                ))}
                {!documentUrl ? (
                  <button type="button" className={styles.addReasonButton} onClick={() => setReasons((current) => current.length < 10 ? [...current, ""] : current)} disabled={reasons.length >= 10}>+ افزودن دلیل جدید</button>
                ) : null}
              </div>

              {error ? <div className={styles.cancelError}>{error}</div> : null}
              {success ? <div className={styles.cancelSuccess}>{success}</div> : null}

              <div className={styles.cancelActions}>
                {!documentUrl ? <button type="button" className={styles.submitCancellation} onClick={() => void submit()} disabled={saving || !validReasons.length}>{saving ? "در حال ثبت لغو ابلاغ..." : "ثبت لغو ابلاغ"}</button> : null}
                {documentUrl ? <button type="button" className={styles.downloadImageButton} onClick={() => void saveImage()} disabled={downloading}>{downloading ? "در حال دریافت پیوست..." : "دریافت پیوست PNG"}</button> : null}
                <button type="button" className={styles.closeCancellation} onClick={onClose} disabled={saving}>بستن</button>
              </div>
            </aside>

            <div className={styles.letterPreviewPane}>
              <div className={styles.previewLabel}>{documentUrl ? "نامه ثبت‌شده" : "پیش‌نمایش زنده فرم"}</div>
              <CancellationLetterPreview draft={draft} reasons={reasons} settings={settings} formatting={formatting} previewRef={previewRef} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
