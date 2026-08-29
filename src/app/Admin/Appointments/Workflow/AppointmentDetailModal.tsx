"use client";

import { useEffect, useMemo, useState } from "react";
import AppointmentReferrals, { type ReferralContext, type ReferralItem, type ReferralPost } from "./AppointmentReferrals";
import {
  AppointmentOrderCard,
  emptyInterview,
  exportA4,
  InterviewEditor,
  ProposalLetterCard,
  type InterviewAnswers,
  type LetterData,
} from "./AppointmentForms";
import styles from "./Workflow.module.css";

type Row = {
  EntesabId: number; PersonId: number; CodeMelli: string | null; FullName: string | null; FatherName: string | null;
  TarikhTavalod: string | null; ShomareShenasnameh: string | null; Shoghl: string | null; TelHamrah: string | null;
  PostOnvan: string | null; RecordState: number; RecordStateNameFarsi: string | null; RequesterFullName: string | null;
  RequesterPostTitle: string | null; DestinationFullName: string | null; DestinationPostTitle: string | null;
  TarikhEblagh: string | null; ModatEblagKhedmat: number | null; DecisionNote: string | null; DecisionAt: string | null;
  DecisionByFullName: string | null; CreateDateTime: string | null; CanDecide: boolean;
};
type Interview = { InterviewType: number; InterviewTypeTitle: string; FormJson: string };
type History = { HistoryId: number; ActionTitle: string; Note: string | null; ActorFullName: string | null; CreateDateTime: string | null; FromPostTitle?: string | null; ToPostTitle?: string | null };
type FileRow = { FileId: number; FileKind: number; FileKindTitle: string; FileName: string; FileSize: number };
type Detail = { row: Row; reasons: string[]; interviews: Interview[]; history: History[]; files: FileRow[]; referrals: ReferralItem[]; referralPosts: ReferralPost[]; referralContext: ReferralContext | null; message?: string };
type Tab = "letter" | "referrals" | "interviews" | "history" | "files" | "order";

function parseInterview(interviews: Interview[], type: number) {
  const raw = interviews.find((item) => item.InterviewType === type)?.FormJson;
  try { return { ...emptyInterview, ...JSON.parse(raw || "{}") }; } catch { return emptyInterview; }
}

export default function AppointmentDetailModal({
  entesabId,
  onClose,
  onChanged,
  review = false,
  initialTab = "letter",
}: {
  entesabId: number;
  onClose: () => void;
  onChanged: () => void;
  review?: boolean;
  initialTab?: Tab;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [finalInterview, setFinalInterview] = useState<InterviewAnswers>(emptyInterview);
  const [date, setDate] = useState("");
  const [months, setMonths] = useState(24);
  const [note, setNote] = useState("");

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/appointments/workflow/${entesabId}`, { cache: "no-store" });
      const data = await response.json() as Detail & { message?: string };
      if (!response.ok) throw new Error(data.message || "دریافت درخواست انجام نشد.");
      setDetail(data);
      setFinalInterview(parseInterview(data.interviews || [], 2));
      setDate(data.row?.TarikhEblagh || "");
      setMonths(Number(data.row?.ModatEblagKhedmat || 24));
      setNote(data.row?.DecisionNote || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "دریافت درخواست انجام نشد.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [entesabId]);

  const row = detail?.row;
  const letter: LetterData = useMemo(() => ({
    fullName: row?.FullName || "", fatherName: row?.FatherName || "", codeMelli: row?.CodeMelli || "",
    birthDate: row?.TarikhTavalod || "", postTitle: row?.PostOnvan || "", requesterName: row?.RequesterFullName || "",
    requesterPost: row?.RequesterPostTitle || "", recipientName: row?.DestinationFullName || "",
    recipientPost: row?.DestinationPostTitle || "", reasons: detail?.reasons || [], date: row?.CreateDateTime?.slice(0, 10),
  }), [detail, row]);

  const act = async (action: "save-interview" | "approve" | "reject") => {
    if (!detail) return;
    if (action !== "reject" && !finalInterview.result) { setError("جمع‌بندی مصاحبه نهایی را انتخاب کنید."); setTab("interviews"); return; }
    if (action === "reject" && !note.trim()) { setError("علت عدم تأیید را وارد کنید."); return; }
    if (action === "approve" && !/^\d{4}\/\d{2}\/\d{2}$/.test(date)) { setError("تاریخ ابلاغ را به شکل 1405/01/01 وارد کنید."); return; }
    setSaving(true); setError("");
    try {
      const form = new FormData();
      form.append("action", action); form.append("finalInterview", JSON.stringify(finalInterview)); form.append("note", note);
      form.append("tarikhEblagh", date); form.append("durationMonths", String(months));
      if (action === "approve") {
        setTab("order");
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const file = await exportA4("appointment-order-card", `appointment-order-${detail.row.CodeMelli || entesabId}.png`);
        if (!file) throw new Error("تولید تصویر حکم انجام نشد.");
        form.append("orderImage", file);
      }
      const response = await fetch(`/api/appointments/workflow/${entesabId}/action`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || "ثبت نتیجه انجام نشد.");
      await load(); onChanged();
      if (action !== "save-interview") setTab(action === "approve" ? "order" : "history");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت نتیجه انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const refreshReferrals = async () => { await load(false); onChanged(); };
  const initial = detail ? parseInterview(detail.interviews, 1) : emptyInterview;
  const tabs: Array<{ k: Tab; t: string; count?: number }> = [
    { k: "letter", t: "نامه پیشنهاد" },
    { k: "referrals", t: "ارجاعات", count: detail?.referrals?.length || 0 },
    { k: "interviews", t: "مصاحبه‌ها" },
    { k: "history", t: "گردش کار" },
    { k: "files", t: "پیوست‌ها" },
    ...((row?.RecordState === 10 || review) ? [{ k: "order" as Tab, t: "حکم انتصاب" }] : []),
  ];

  return <div className={styles.fullModal} dir="rtl">
    <header className={styles.modalHeader}>
      <div><span>فرایند انتصابات / جزئیات درخواست</span><h2>{row ? `${row.FullName || "—"} — ${row.PostOnvan || "—"}` : "در حال دریافت..."}</h2></div>
      <div className={styles.headerStatus}>{row ? <span className={row.RecordState === 10 ? styles.greenStatus : row.RecordState === 3 ? styles.redStatus : styles.orangeStatus}>{row.RecordStateNameFarsi || "در انتظار بررسی"}</span> : null}<button type="button" onClick={onClose} disabled={saving}>×</button></div>
    </header>
    <nav className={styles.modalTabs}>{tabs.map((item) => <button type="button" key={item.k} onClick={() => setTab(item.k)} className={tab === item.k ? styles.activeModalTab : ""}>{item.t}{typeof item.count === "number" ? <span>{item.count.toLocaleString("fa-IR")}</span> : null}</button>)}</nav>

    {loading ? <div className={styles.modalLoading}><span className={styles.spinner} /> در حال دریافت...</div>
      : error && !detail ? <div className={styles.modalLoading}>{error}</div>
      : detail && row ? <div className={styles.detailBody}>
        <aside className={styles.detailSidebar}>
          <div className={styles.detailPerson}><span>{row.FullName?.slice(0, 1) || "ف"}</span><strong>{row.FullName || "—"}</strong><small>{row.PostOnvan || "—"}</small></div>
          <dl><dt>کد ملی</dt><dd>{row.CodeMelli || "—"}</dd><dt>نام پدر</dt><dd>{row.FatherName || "—"}</dd><dt>تاریخ تولد</dt><dd>{row.TarikhTavalod || "—"}</dd><dt>شغل فعلی</dt><dd>{row.Shoghl || "—"}</dd><dt>درخواست‌کننده</dt><dd>{row.RequesterFullName || "—"}<small>{row.RequesterPostTitle || ""}</small></dd></dl>
          {row.DecisionByFullName ? <div className={styles.decisionInfo}><span>بررسی‌کننده</span><strong>{row.DecisionByFullName}</strong><small>{row.DecisionAt || ""}</small></div> : null}
          {review && row.CanDecide && row.RecordState === 2 ? <section className={styles.decisionActions}>
            <label>توضیحات بررسی<textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 1000))} /></label>
            <label>تاریخ شروع ابلاغ<input value={date} onChange={(event) => setDate(event.target.value)} placeholder="1405/01/01" maxLength={10} /></label>
            <label>مدت ابلاغ (ماه)<input type="number" min={1} max={120} value={months} onChange={(event) => setMonths(Number(event.target.value))} /></label>
            <button type="button" className={styles.saveInterviewButton} onClick={() => void act("save-interview")} disabled={saving}>ذخیره مصاحبه نهایی</button>
            <div><button type="button" className={styles.rejectButton} onClick={() => void act("reject")} disabled={saving}>عدم تأیید</button><button type="button" className={styles.approveButton} onClick={() => void act("approve")} disabled={saving}>{saving ? "در حال ثبت..." : "تأیید و صدور ابلاغ"}</button></div>
          </section> : null}
          {error ? <div className={styles.inlineError}>{error}</div> : null}
        </aside>

        <main className={styles.detailContent}>
          {tab === "letter" ? <div className={styles.paperStage}><ProposalLetterCard id={`appointment-proposal-${entesabId}`} data={letter} /></div> : null}
          {tab === "order" ? <div className={styles.paperStage}><AppointmentOrderCard id="appointment-order-card" data={letter} tarikh={date} duration={months} /></div> : null}
          {tab === "referrals" ? <AppointmentReferrals entesabId={entesabId} referrals={detail.referrals || []} posts={detail.referralPosts || []} context={detail.referralContext || null} onChanged={refreshReferrals} /> : null}
          {tab === "interviews" ? <div className={styles.interviewsStack}><InterviewEditor value={initial} onChange={() => {}} readOnly title="مصاحبه اولیه" /><InterviewEditor value={finalInterview} onChange={setFinalInterview} readOnly={!row.CanDecide || row.RecordState !== 2} title="مصاحبه نهایی" /></div> : null}
          {tab === "history" ? <div className={styles.timeline}>{detail.history.length ? detail.history.map((item) => <article key={item.HistoryId}><i /><div><strong>{item.ActionTitle}</strong><span>{item.ActorFullName || "—"} · {item.CreateDateTime || "—"}</span>{item.FromPostTitle || item.ToPostTitle ? <small>{item.FromPostTitle || "—"} ← {item.ToPostTitle || "—"}</small> : null}{item.Note ? <p>{item.Note}</p> : null}</div></article>) : <p>گردش کاری ثبت نشده است.</p>}</div> : null}
          {tab === "files" ? <div className={styles.filesGrid}>{detail.files.length ? detail.files.map((item) => <a href={`/api/appointments/workflow/files/${item.FileId}`} target="_blank" rel="noreferrer" key={item.FileId}><span>PNG</span><div><strong>{item.FileKindTitle}</strong><small>{item.FileName} · {(item.FileSize / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} KB</small></div></a>) : <p>پیوستی ثبت نشده است.</p>}</div> : null}
        </main>
      </div> : null}
  </div>;
}
