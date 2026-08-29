"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CancellationProposalModal from "../Current/CancellationProposalModal";
import styles from "./Cancellations.module.css";

type CancellationRow = {
  ProposalId: number;
  EntesabId: number;
  PersonId: number;
  FullName: string | null;
  CodeMelli: string | null;
  PostOnvan: string | null;
  TarikhEblagh: string | null;
  RequesterFullName: string | null;
  RequesterPostTitle: string | null;
  CreateDateTime: string | null;
  RecordState: number;
  RecordStateNameFarsi: string | null;
  DecisionCode: number | null;
  DecisionNote: string | null;
  DecisionByFullName: string | null;
  DecisionAt: string | null;
  CanDecide: boolean;
  IsOwnRequest: boolean;
  ReasonsCount: number;
  HasAttachment: boolean;
};

type FilterKey = "inbox" | "sent" | "approved" | "rejected" | "all";

function SearchIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M18.5 10A7 7 0 0 0 6 7l-2 3M5.5 14A7 7 0 0 0 18 17l2-3" /></svg>; }
function LetterIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M8.5 14s1.4-2 3.5-2 3.5 2 3.5 2-1.4 2-3.5 2-3.5-2-3.5-2Z" /></svg>; }
function ReviewIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 9h8M8 13h5" /><path d="m14.5 17 1.6 1.6 3.4-4" /></svg>; }

function statusClass(state: number) {
  if (state === 12) return styles.statusApproved;
  if (state === 13) return styles.statusRejected;
  return styles.statusPending;
}

function statusText(row: CancellationRow) {
  return row.RecordStateNameFarsi || (row.RecordState === 12 ? "تأییدشده" : row.RecordState === 13 ? "عدم تأیید" : "در انتظار بررسی");
}

export default function CancellationsClient() {
  const [rows, setRows] = useState<CancellationRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("inbox");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [letterTarget, setLetterTarget] = useState<CancellationRow | null>(null);
  const [reviewTarget, setReviewTarget] = useState<CancellationRow | null>(null);
  const [note, setNote] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/appointments/cancellations", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { rows?: CancellationRow[]; message?: string };
      if (!response.ok) throw new Error(data.message || "دریافت درخواست‌ها انجام نشد.");
      setRows(data.rows ?? []);
    } catch (reason) {
      setRows([]);
      setError(reason instanceof Error ? reason.message : "دریافت درخواست‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!letterTarget && !reviewTarget) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [letterTarget, reviewTarget]);

  const counts = useMemo(() => ({
    inbox: rows.filter((row) => row.RecordState === 2 && row.CanDecide).length,
    sent: rows.filter((row) => row.IsOwnRequest).length,
    approved: rows.filter((row) => row.RecordState === 12).length,
    rejected: rows.filter((row) => row.RecordState === 13).length,
    all: rows.length,
  }), [rows]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fa");
    return rows.filter((row) => {
      const inFilter = filter === "all"
        || (filter === "inbox" && row.RecordState === 2 && row.CanDecide)
        || (filter === "sent" && row.IsOwnRequest)
        || (filter === "approved" && row.RecordState === 12)
        || (filter === "rejected" && row.RecordState === 13);
      if (!inFilter) return false;
      if (!term) return true;
      return [row.FullName, row.CodeMelli, row.PostOnvan, row.RequesterFullName]
        .filter(Boolean).join(" ").toLocaleLowerCase("fa").includes(term);
    });
  }, [filter, rows, search]);

  const submitDecision = async (decision: "approve" | "reject") => {
    if (!reviewTarget || savingDecision) return;
    if (decision === "reject" && !note.trim()) {
      setError("برای عدم تأیید، توضیحات را وارد کنید.");
      return;
    }
    setSavingDecision(true);
    setError("");
    try {
      const response = await fetch(`/api/appointments/cancellations/${reviewTarget.ProposalId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(data.message || "ثبت نتیجه انجام نشد.");
      setReviewTarget(null);
      setNote("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت نتیجه انجام نشد.");
    } finally {
      setSavingDecision(false);
    }
  };

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "inbox", label: "کارتابل بررسی" },
    { key: "sent", label: "ارسال‌شده" },
    { key: "approved", label: "تأییدشده" },
    { key: "rejected", label: "عدم تأیید" },
    { key: "all", label: "همه درخواست‌ها" },
  ];

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.pageHeader}>
        <div><span>انتصابات</span><h1>فرایند لغو انتصاب</h1><p>کارتابل بررسی، درخواست‌های ارسال‌شده و نتیجه نهایی لغو ابلاغ‌ها</p></div>
        <div className={styles.headerActions}>
          <label className={styles.searchBox}><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی نام، کد ملی یا عنوان پست..." /></label>
          <button type="button" className={styles.refreshButton} onClick={() => void load()} disabled={loading}><RefreshIcon />به‌روزرسانی</button>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        {filters.slice(0, 4).map((item) => <button type="button" key={item.key} className={`${styles.summaryCard} ${filter === item.key ? styles.summaryCardActive : ""}`} onClick={() => setFilter(item.key)}><span>{item.label}</span><strong>{counts[item.key].toLocaleString("fa-IR")}</strong></button>)}
      </section>

      <section className={styles.workflowCard}>
        <div className={styles.tabs}>
          {filters.map((item) => <button type="button" key={item.key} className={filter === item.key ? styles.activeTab : ""} onClick={() => setFilter(item.key)}>{item.label}<span>{counts[item.key].toLocaleString("fa-IR")}</span></button>)}
        </div>
        {error ? <div className={styles.errorBox}>{error}</div> : null}
        <div className={styles.tableScroll}>
          <table>
            <thead><tr><th>ردیف</th><th>شخص و مسئولیت</th><th>درخواست‌کننده</th><th>تاریخ درخواست</th><th>دلایل / پیوست</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className={styles.empty}><span className={styles.spinner} /> در حال دریافت...</td></tr> : visibleRows.length ? visibleRows.map((row, index) => (
                <tr key={row.ProposalId}>
                  <td className={styles.rowNumber}>{Number(index + 1).toLocaleString("fa-IR")}</td>
                  <td><div className={styles.personCell}><span className={styles.avatar}>{row.FullName?.trim().slice(0, 1) || "ف"}</span><div><strong>{row.FullName || "—"}</strong><small>{row.PostOnvan || "—"}</small></div></div></td>
                  <td><div className={styles.requester}><strong>{row.RequesterFullName || "—"}</strong><small>{row.RequesterPostTitle || "—"}</small></div></td>
                  <td>{row.CreateDateTime || "—"}</td>
                  <td><div className={styles.metaBadges}><span>{row.ReasonsCount.toLocaleString("fa-IR")} دلیل</span><span className={row.HasAttachment ? styles.attachmentReady : styles.attachmentMissing}>{row.HasAttachment ? "پیوست دارد" : "بدون پیوست"}</span></div></td>
                  <td><span className={`${styles.statusBadge} ${statusClass(row.RecordState)}`}>{statusText(row)}</span></td>
                  <td><div className={styles.actions}><button type="button" className={styles.viewButton} onClick={() => setLetterTarget(row)}><LetterIcon />نمایش نامه</button>{row.CanDecide && row.RecordState === 2 ? <button type="button" className={styles.reviewButton} onClick={() => { setReviewTarget(row); setNote(""); }}><ReviewIcon />بررسی</button> : null}</div></td>
                </tr>
              )) : <tr><td colSpan={7} className={styles.empty}>در این بخش درخواستی وجود ندارد.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {letterTarget ? <CancellationProposalModal target={{ EntesabId: letterTarget.EntesabId, FullName: letterTarget.FullName }} onClose={() => setLetterTarget(null)} onSaved={() => void load()} /> : null}

      {reviewTarget ? <div className={styles.modalOverlay}><section className={styles.decisionModal} role="dialog" aria-modal="true" aria-labelledby="decision-title"><header><div><span>بررسی درخواست</span><h2 id="decision-title">لغو انتصاب {reviewTarget.FullName || "—"}</h2></div><button type="button" onClick={() => setReviewTarget(null)} disabled={savingDecision}>×</button></header><div className={styles.decisionBody}><div className={styles.decisionSummary}><span>عنوان مسئولیت</span><strong>{reviewTarget.PostOnvan || "—"}</strong><span>درخواست‌کننده</span><strong>{reviewTarget.RequesterFullName || "—"}</strong></div><label>توضیحات بررسی<textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 1000))} rows={5} placeholder="در صورت عدم تأیید، درج توضیحات الزامی است..." /></label>{error ? <div className={styles.errorBox}>{error}</div> : null}</div><footer><button type="button" className={styles.rejectButton} onClick={() => void submitDecision("reject")} disabled={savingDecision}>عدم تأیید</button><button type="button" className={styles.approveButton} onClick={() => void submitDecision("approve")} disabled={savingDecision}>{savingDecision ? "در حال ثبت..." : "تأیید لغو انتصاب"}</button></footer></section></div> : null}
    </main>
  );
}
