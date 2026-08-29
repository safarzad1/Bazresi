"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./CaseFile.module.css";

type PersonSummary = {
  PersonId: number;
  CodeMelli: string;
  FirstName: string;
  LastName: string;
  FatherName: string;
  ImagePath: string | null;
  FullName: string;
  LastPage: number;
  DocumentCount: number;
};
type CaseDocument = {
  ID: number; PersonId: number; AzSafheh: number; TaSafheh: number; TedadSafheh: number;
  TarikhNameh: string | null; ShomareNameh: string | null; OnvanMatlab: string; Kholaseh: string | null;
  NoeSanad: number; NoeSanadTitle: string | null; MarjaNameh: string | null; IsSystemGenerated: boolean;
  CreateDateTime: string; FileCount: number;
};
type CaseFile = {
  ID: number; FehrestParvandehID: number; PersonId: number; Safheh: number; FileName: string;
  OriginalFileName: string | null; SortOrder: number; CreateDateTime: string; ContentType: string | null; FileSize: number | null;
};
type Payload = { person: PersonSummary; documents: CaseDocument[]; files: CaseFile[]; message?: string };

type Notice = { type: "success" | "error"; text: string } | null;
const emptyForm = { tarikhNameh: "", shomareNameh: "", onvanMatlab: "", kholaseh: "", noeSanad: "1", noeSanadTitle: "نامه / سند", marjaNameh: "" };

function FileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>;
}
function BackIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>; }
function UploadIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M18.5 16a8 8 0 1 1 1.2-7.8L20 12"/></svg>; }
function formatBytes(value: number | null) {
  if (!value || value < 1) return "—";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024)).toLocaleString("fa-IR")} KB`;
  return `${(value / (1024 * 1024)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
}

export default function CaseFileClient() {
  const params = useSearchParams();
  const personId = Number(params.get("personId") || 0);
  const [person, setPerson] = useState<PersonSummary | null>(null);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(personId) || personId < 1) { setNotice({ type: "error", text: "شناسه شخص در آدرس صفحه معتبر نیست." }); setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/persons/case-file?personId=${personId}`, { cache: "no-store" });
      const data = await response.json() as Payload;
      if (!response.ok) throw new Error(data.message || "دریافت پرونده انجام نشد.");
      setPerson(data.person); setDocuments(data.documents || []); setFiles(data.files || []);
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "دریافت پرونده انجام نشد." });
    } finally { setLoading(false); }
  }, [personId]);

  useEffect(() => { void load(); }, [load]);

  const filesByDocument = useMemo(() => {
    const map = new Map<number, CaseFile[]>();
    files.forEach((file) => map.set(file.FehrestParvandehID, [...(map.get(file.FehrestParvandehID) || []), file]));
    return map;
  }, [files]);
  const nextRange = selectedFiles.length ? `${(Number(person?.LastPage || 0) + 1).toLocaleString("fa-IR")} تا ${(Number(person?.LastPage || 0) + selectedFiles.length).toLocaleString("fa-IR")}` : "پس از انتخاب فایل محاسبه می‌شود";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!person) return;
    if (!form.onvanMatlab.trim()) { setNotice({ type: "error", text: "عنوان مطلب را وارد کنید." }); return; }
    if (!selectedFiles.length) { setNotice({ type: "error", text: "حداقل یک فایل/صفحه انتخاب کنید." }); return; }
    setSaving(true); setNotice(null);
    try {
      const body = new FormData();
      body.append("personId", String(person.PersonId));
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      selectedFiles.forEach((file) => body.append("files", file));
      const response = await fetch("/api/persons/case-file", { method: "POST", body });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "ثبت سند انجام نشد.");
      setNotice({ type: "success", text: data.message || "سند به پرونده افزوده شد." });
      setForm(emptyForm); setSelectedFiles([]);
      const fileInput = document.getElementById("case-files-input") as HTMLInputElement | null; if (fileInput) fileInput.value = "";
      await load();
    } catch (reason) {
      setNotice({ type: "error", text: reason instanceof Error ? reason.message : "ثبت سند انجام نشد." });
    } finally { setSaving(false); }
  }

  if (loading && !person) return <div className={styles.loading} dir="rtl"><span />در حال دریافت پرونده شخص...</div>;

  return <main className={styles.page} dir="rtl">
    {notice && <div className={`${styles.notice} ${styles[notice.type]}`}>{notice.text}</div>}
    <header className={styles.header}>
      <div className={styles.personTitle}>
        <span className={styles.personAvatar}>{person?.ImagePath ? <img src={`/api/persons/image?file=${encodeURIComponent(person.ImagePath)}`} alt="" /> : <FileIcon />}</span>
        <div><small>پرونده الکترونیکی شخص</small><h1>{person?.FullName || "پرونده شخص"}</h1><p>کد ملی: {person?.CodeMelli || "—"} · نام پدر: {person?.FatherName || "—"}</p></div>
      </div>
      <div className={styles.headerActions}>
        <button type="button" onClick={() => void load()} disabled={loading}><RefreshIcon />به‌روزرسانی</button>
        <Link href="/Admin/Persons"><BackIcon />بازگشت به اشخاص</Link>
      </div>
    </header>

    <section className={styles.stats}>
      <div><span>تعداد اسناد</span><strong>{Number(person?.DocumentCount || 0).toLocaleString("fa-IR")}</strong></div>
      <div><span>آخرین صفحه پرونده</span><strong>{Number(person?.LastPage || 0).toLocaleString("fa-IR")}</strong></div>
      <div><span>شماره صفحات سند جدید</span><strong className={styles.rangePreview}>{nextRange}</strong></div>
    </section>

    <section className={styles.contentGrid}>
      <form className={styles.formCard} onSubmit={submit}>
        <div className={styles.cardTitle}><div><small>افزودن به پرونده</small><h2>ایجاد سند جدید</h2></div><span><FileIcon /></span></div>
        <div className={styles.formGrid}>
          <label><span>تاریخ نامه</span><input value={form.tarikhNameh} onChange={(e) => setForm(v => ({ ...v, tarikhNameh: e.target.value.replace(/[^0-9/]/g, "").slice(0, 10) }))} placeholder="1405/06/07" /></label>
          <label><span>شماره نامه</span><input value={form.shomareNameh} onChange={(e) => setForm(v => ({ ...v, shomareNameh: e.target.value.slice(0, 100) }))} placeholder="شماره نامه / سند" /></label>
          <label className={styles.full}><span>عنوان مطلب *</span><input required value={form.onvanMatlab} onChange={(e) => setForm(v => ({ ...v, onvanMatlab: e.target.value.slice(0, 500) }))} placeholder="عنوان سند یا موضوع نامه" /></label>
          <label><span>نوع سند</span><select value={form.noeSanad} onChange={(e) => { const option=e.target.selectedOptions[0]; setForm(v => ({ ...v, noeSanad: e.target.value, noeSanadTitle: option?.text || "" })); }}><option value="1">نامه / سند</option><option value="2">گزارش</option><option value="3">استعلام</option><option value="4">پاسخ استعلام</option><option value="5">پیوست و مدرک</option></select></label>
          <label><span>مرجع نامه</span><input value={form.marjaNameh} onChange={(e) => setForm(v => ({ ...v, marjaNameh: e.target.value.slice(0, 250) }))} placeholder="واحد / سازمان / مرجع" /></label>
          <label className={styles.full}><span>خلاصه</span><textarea value={form.kholaseh} onChange={(e) => setForm(v => ({ ...v, kholaseh: e.target.value.slice(0, 2000) }))} placeholder="خلاصه‌ای از محتوای سند..." /></label>
        </div>

        <label className={styles.uploadBox}>
          <UploadIcon />
          <strong>{selectedFiles.length ? `${selectedFiles.length.toLocaleString("fa-IR")} فایل انتخاب شده` : "انتخاب صفحات / فایل‌های سند"}</strong>
          <span>هر فایل یک صفحه پرونده محسوب می‌شود؛ ترتیب انتخاب، ترتیب شماره صفحه است.</span>
          <small>JPG، PNG، WEBP یا PDF · حداکثر ۲۰ مگابایت برای هر فایل</small>
          <input id="case-files-input" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []).slice(0, 30))} />
        </label>
        {selectedFiles.length > 0 && <div className={styles.selectedFiles}>{selectedFiles.map((file, index) => <div key={`${file.name}-${index}`}><b>صفحه {(Number(person?.LastPage || 0) + index + 1).toLocaleString("fa-IR")}</b><span>{file.name}</span><small>{formatBytes(file.size)}</small></div>)}</div>}
        <footer className={styles.formFooter}><span>بازه صفحه به صورت خودکار در دیتابیس رزرو می‌شود.</span><button type="submit" disabled={saving}>{saving ? "در حال ثبت..." : "ثبت سند در پرونده"}</button></footer>
      </form>

      <section className={styles.listCard}>
        <div className={styles.cardTitle}><div><small>فهرست پرونده</small><h2>اسناد ثبت‌شده</h2></div><b>{documents.length.toLocaleString("fa-IR")}</b></div>
        <div className={styles.tableWrap}>
          <table><thead><tr><th>صفحه</th><th>تاریخ / شماره</th><th>عنوان مطلب</th><th>نوع / مرجع</th><th>صفحات پیوست</th></tr></thead>
          <tbody>{documents.map((doc) => {
            const docFiles=(filesByDocument.get(doc.ID)||[]).sort((a,b)=>a.Safheh-b.Safheh);
            return <tr key={doc.ID}>
              <td><span className={styles.pageRange}>{doc.AzSafheh.toLocaleString("fa-IR")}{doc.TaSafheh !== doc.AzSafheh ? ` - ${doc.TaSafheh.toLocaleString("fa-IR")}` : ""}</span><small>{doc.TedadSafheh.toLocaleString("fa-IR")} صفحه</small></td>
              <td><strong>{doc.TarikhNameh || "—"}</strong><small>{doc.ShomareNameh || "بدون شماره"}</small></td>
              <td><strong className={styles.subject}>{doc.OnvanMatlab}</strong>{doc.Kholaseh ? <small title={doc.Kholaseh}>{doc.Kholaseh}</small> : null}{doc.IsSystemGenerated ? <em>ثبت خودکار</em> : null}</td>
              <td><strong>{doc.NoeSanadTitle || "سند"}</strong><small>{doc.MarjaNameh || "—"}</small></td>
              <td><div className={styles.fileChips}>{docFiles.map(file => <a key={file.ID} href={`/api/persons/case-file/file?file=${encodeURIComponent(file.FileName)}`} target="_blank" rel="noreferrer" title={`${file.OriginalFileName || "فایل"} - ${formatBytes(file.FileSize)}`}><FileIcon />ص {file.Safheh.toLocaleString("fa-IR")}</a>)}</div></td>
            </tr>;
          })}</tbody></table>
          {!documents.length && !loading && <div className={styles.empty}><FileIcon /><strong>هنوز سندی در پرونده ثبت نشده است</strong><span>اولین سند را از فرم سمت راست اضافه کنید.</span></div>}
        </div>
      </section>
    </section>
  </main>;
}
