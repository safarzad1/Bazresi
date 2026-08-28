"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CurrentAppointments.module.css";

type AppointmentDocument = {
  Id: number;
  OnvanSanad: string | null;
  CreateDateTime: string | null;
  FullFileName: string | null;
};

type CurrentAppointmentRow = {
  EntesabId: number;
  PersonId: number;
  FullName: string | null;
  PostOnvan: string | null;
  TarikhEblagh: string | null;
  ModatEblagKhedmat: number | null;
  Madarek: AppointmentDocument[];
};

type ApiResult = {
  rows?: CurrentAppointmentRow[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
}

function RefreshIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M18.5 10A7 7 0 0 0 6 7l-2 3M5.5 14A7 7 0 0 0 18 17l2-3" /></svg>;
}

function FileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>;
}

async function readJson(response: Response) {
  const data = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) throw new Error(data.message || "دریافت اطلاعات انجام نشد.");
  return data;
}

export default function CurrentAppointmentsClient() {
  const [rows, setRows] = useState<CurrentAppointmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(pageSize),
      });
      const data = await readJson(await fetch(`/api/appointments/current?${params}`, { cache: "no-store" }));
      setRows(data.rows ?? []);
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (err) {
      setRows([]);
      setTotalCount(0);
      setError(err instanceof Error ? err.message : "دریافت فهرست انتصاب‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), search ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageNumbers = useMemo(() => {
    const count = Math.min(5, totalPages);
    const start = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - count + 1));
    return Array.from({ length: count }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.pageHeader}>
        <div>
          <span>انتصابات</span>
          <h1>فهرست انتصاب‌های جاری</h1>
          <p>انتصاب‌های ابلاغ‌شده و جاری حوزه سازمانی شما</p>
        </div>
        <div className={styles.headerActions}>

          <label className={styles.searchBox}>
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="جست‌وجوی نام، عنوان پست یا تاریخ ابلاغ..."
          />
        </label>

          <button type="button" className={styles.refreshButton} onClick={() => void load()} disabled={loading}>

            <RefreshIcon />

            به‌روزرسانی

          </button>

          <span className={styles.counter}>{loading ? "در حال دریافت..." : `${totalCount.toLocaleString("fa-IR")} انتصاب جاری`}</span>

        </div>
      </section>
{error ? <div className={styles.errorBox}>{error}</div> : null}

      <section className={styles.tableCard} aria-busy={loading}>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>نام و نام خانوادگی</th>
                <th>عنوان پست</th>
                <th>تاریخ ابلاغ</th>
                <th>مدت ابلاغ خدمت</th>
                <th>مدارک</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className={styles.empty}><span className={styles.spinner} /> در حال دریافت فهرست...</td></tr>
              ) : rows.length ? rows.map((row, index) => (
                <tr key={row.EntesabId}>
                  <td className={styles.rowNumber}>{((page - 1) * pageSize + index + 1).toLocaleString("fa-IR")}</td>
                  <td>
                    <div className={styles.personCell}>
                      <span className={styles.avatar}>{(row.FullName?.trim().slice(0, 1) || "ف")}</span>
                      <div><strong>{row.FullName || "—"}</strong><small>شناسه شخص: {row.PersonId.toLocaleString("fa-IR")}</small></div>
                    </div>
                  </td>
                  <td><span className={styles.postTitle}>{row.PostOnvan || "—"}</span></td>
                  <td>{row.TarikhEblagh || "—"}</td>
                  <td>{row.ModatEblagKhedmat === null ? "—" : row.ModatEblagKhedmat.toLocaleString("fa-IR")}</td>
                  <td>
                    <span className={styles.documentBadge} title={row.Madarek.map((item) => item.OnvanSanad).filter(Boolean).join("، ") || undefined}>
                      <FileIcon />
                      {row.Madarek.length.toLocaleString("fa-IR")}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className={styles.empty}>انتصاب جاری برای نمایش وجود ندارد.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <div className={styles.pageSizeWrap}>
            <span>تعداد در صفحه</span>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              {[10, 20, 50, 100].map((size) => <option value={size} key={size}>{size.toLocaleString("fa-IR")}</option>)}
            </select>
          </div>

          <div className={styles.pageButtons}>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}>قبلی</button>
            {pageNumbers.map((number) => (
              <button type="button" key={number} className={page === number ? styles.activePage : ""} onClick={() => setPage(number)} disabled={loading}>{number.toLocaleString("fa-IR")}</button>
            ))}
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading}>بعدی</button>
          </div>
        </footer>
      </section>
    </main>
  );
}
