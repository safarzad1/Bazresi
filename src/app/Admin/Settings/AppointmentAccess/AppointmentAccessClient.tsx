"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SearchableDropdown,
  SearchableMultiSelectDropdown,
  type DropdownOption,
} from "@/component/Dropdown";
import styles from "./AppointmentAccess.module.css";

type AccessRow = {
  AccessId: number;
  ActorPostId: number;
  ActorPostTitle: string;
  ActorMahalId: number | null;
  ActorMahalTitle: string | null;
  TargetPostId: number;
  TargetPostTitle: string;
  TargetMahalId: number | null;
  TargetMahalTitle: string | null;
};

type PostLookup = {
  Id: number;
  Title: string;
  MahalId: number | null;
  MahalTitle: string | null;
};

function displayMahalTitle(mahalTitle: string | null) {
  if (!mahalTitle) return null;
  return mahalTitle.trim() === "ایران" ? "ستاد" : mahalTitle;
}

function postLabel(title: string, id: number, mahalTitle: string | null) {
  const displayedMahalTitle = displayMahalTitle(mahalTitle);
  return displayedMahalTitle
    ? `${title} — ${displayedMahalTitle} (کد ${id})`
    : `${title} (کد ${id})`;
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as {
    rows?: AccessRow[];
    posts?: PostLookup[];
    message?: string;
  };
}

export default function AppointmentAccessClient() {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [posts, setPosts] = useState<PostLookup[]>([]);
  const [actorPostId, setActorPostId] = useState<number | null>(null);
  const [targetPostIds, setTargetPostIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/appointment-access", { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "دریافت دسترسی‌ها انجام نشد.");
      setRows(data.rows ?? []);
      setPosts(data.posts ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت دسترسی‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const allPostOptions = useMemo<DropdownOption<number>[]>(
    () => posts.map((post) => ({
      value: post.Id,
      label: postLabel(post.Title, post.Id, post.MahalTitle),
      searchText: `${post.Title} ${post.Id} ${post.MahalTitle ?? ""}`,
    })),
    [posts],
  );

  const targetOptions = useMemo(() => {
    if (!actorPostId) return allPostOptions;
    const used = new Set(
      rows.filter((row) => row.ActorPostId === actorPostId).map((row) => row.TargetPostId),
    );
    return allPostOptions.filter((option) => !used.has(option.value));
  }, [actorPostId, allPostOptions, rows]);

  const filteredRows = useMemo(() => {
    if (!actorPostId) return [];
    const actorRows = rows.filter((row) => row.ActorPostId === actorPostId);
    const query = search.trim().toLocaleLowerCase("fa-IR");
    if (!query) return actorRows;
    return actorRows.filter((row) =>
      `${row.ActorPostTitle} ${row.ActorPostId} ${row.ActorMahalTitle ?? ""} ${row.TargetPostTitle} ${row.TargetPostId} ${row.TargetMahalTitle ?? ""}`
        .toLocaleLowerCase("fa-IR")
        .includes(query),
    );
  }, [actorPostId, rows, search]);

  async function save() {
    if (!actorPostId || targetPostIds.length === 0 || saving) {
      if (!actorPostId || targetPostIds.length === 0) setError("پست انجام‌دهنده و حداقل یک پست مجاز را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/settings/appointment-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorPostId, targetPostIds }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "ثبت دسترسی انجام نشد.");
      const savedCount = targetPostIds.length;
      setTargetPostIds([]);
      setMessage(`${savedCount.toLocaleString("fa-IR")} دسترسی با موفقیت ثبت شد.`);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ثبت دسترسی انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(accessId: number) {
    if (deletingId !== null || !window.confirm("این دسترسی حذف شود؟")) return;
    setDeletingId(accessId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/settings/appointment-access?id=${accessId}`, { method: "DELETE" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "حذف دسترسی انجام نشد.");
      setRows((current) => current.filter((row) => row.AccessId !== accessId));
      setMessage("دسترسی حذف شد.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "حذف دسترسی انجام نشد.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className={styles.page} dir="rtl">
      <div className={styles.breadcrumb}>
        <Link href="/Admin/Settings">تنظیمات</Link><span>/</span><strong>دسترسی انتصابات</strong>
      </div>

      <section className={styles.formCard}>
        <div className={styles.formHeading}>
          <span>تعریف دسترسی جدید</span>
        </div>
        <div className={styles.formGrid}>
          <label>
            <span>سمتی که عملیات را انجام می‌دهد</span>
            <SearchableDropdown<number>
              value={actorPostId}
              options={allPostOptions}
              onChange={(value) => {
                setActorPostId(value);
                setTargetPostIds([]);
                setSearch("");
                setMessage("");
                setError("");
              }}
              onClear={() => {
                setActorPostId(null);
                setTargetPostIds([]);
                setSearch("");
                setMessage("");
                setError("");
              }}
              placeholder="جست‌وجو و انتخاب پست انجام‌دهنده"
              searchPlaceholder="عنوان، کد یا محل پست..."
              loading={loading}
              disabled={saving}
            />
          </label>
          <label>
            <span>پستی که اجازه مدیریت آن را دارد</span>
            <SearchableMultiSelectDropdown<number>
              value={targetPostIds}
              options={targetOptions}
              onChange={(values) => {
                setTargetPostIds(values);
                setMessage("");
                setError("");
              }}
              placeholder="جست‌وجو و انتخاب پست‌های مجاز"
              searchPlaceholder="عنوان، کد یا محل پست..."
              loading={loading}
              disabled={saving || !actorPostId}
              emptyText={actorPostId ? "تمام پست‌های قابل انتخاب قبلاً ثبت شده‌اند." : "ابتدا پست انجام‌دهنده را انتخاب کنید."}
            />
          </label>
          <button className={styles.saveButton} type="button" onClick={() => void save()} disabled={saving || !actorPostId || targetPostIds.length === 0}>
            {saving ? <span className={styles.spinner} /> : "+"}
            {saving ? "در حال ثبت..." : targetPostIds.length > 1 ? `افزودن ${targetPostIds.length.toLocaleString("fa-IR")} دسترسی` : "افزودن دسترسی"}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>مجوزهای ثبت‌شده</span>
          <div className={styles.searchBox}>
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی عنوان، کد یا محل پست..." />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ردیف</th><th>پست مجاز</th><th>نوع مجوز</th><th>عملیات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className={styles.empty}><span className={styles.spinner} /> در حال دریافت دسترسی‌ها...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={4} className={styles.empty}>{!actorPostId ? "ابتدا سمت انجام‌دهنده را انتخاب کنید." : search ? "موردی مطابق جست‌وجو پیدا نشد." : "برای این سمت هنوز دسترسی‌ای تعریف نشده است."}</td></tr>
              ) : filteredRows.map((row, index) => (
                <tr key={row.AccessId}>
                  <td>{(index + 1).toLocaleString("fa-IR")}</td>
                  <td><strong>{row.TargetPostTitle}</strong><small>کد {row.TargetPostId.toLocaleString("fa-IR")}{displayMahalTitle(row.TargetMahalTitle) ? ` — ${displayMahalTitle(row.TargetMahalTitle)}` : ""}</small></td>
                  <td><span className={styles.permissionBadge}>انتصاب و لغو انتصاب</span></td>
                  <td><button className={styles.deleteButton} type="button" disabled={deletingId !== null} onClick={() => void remove(row.AccessId)}>{deletingId === row.AccessId ? "در حال حذف..." : "حذف"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
