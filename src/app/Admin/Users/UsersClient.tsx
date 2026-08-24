"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./Users.module.css";

type UserRow = {
  UserId: string;
  UserName: string;
  FullName: string;
  TelHamrah: string | null;
  NationalCode: string;
  Email: string | null;
  SematId: number | null;
  SematTitle: string | null;
  MahalId: number | null;
  MahalTitle: string | null;
  IsActive: boolean | number | null;
  ChangePassword: boolean | number | null;
  LastDateLogin: string | null;
};

type Lookup = { Id: number; Title: string };

type UserForm = {
  userId: string;
  userName: string;
  fullName: string;
  telHamrah: string;
  nationalCode: string;
  email: string;
  sematId: string;
  mahalId: string;
  password: string;
  isActive: boolean;
  changePassword: boolean;
};

const emptyForm: UserForm = {
  userId: "",
  userName: "",
  fullName: "",
  telHamrah: "",
  nationalCode: "",
  email: "",
  sematId: "",
  mahalId: "",
  password: "",
  isActive: true,
  changePassword: false,
};

function isTrue(value: boolean | number | null) {
  return value === true || value === 1;
}

function Icon({ name }: { name: "users" | "plus" | "search" | "edit" | "trash" | "refresh" | "close" }) {
  const paths = {
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19M15.5 5.5a3 3 0 0 1 0 5.8M16.5 14a4.5 4.5 0 0 1 4 4.5V19" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    edit: <><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" /><path d="m14.8 6.8 2.8 2.8" /></>,
    trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M18.5 16a8 8 0 1 1 1.2-7.8L20 12" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

async function readJson(response: Response) {
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    users?: UserRow[];
    semats?: Lookup[];
    mahals?: Lookup[];
    totalCount?: number;
    page?: number;
    pageSize?: number;
  };
  if (!response.ok) throw new Error(data.message || "ارتباط با سرور برقرار نشد.");
  return data;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [semats, setSemats] = useState<Lookup[]>([]);
  const [mahals, setMahals] = useState<Lookup[]>([]);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = useCallback(async (
    query: string,
    active: boolean,
    requestedPage: number,
    requestedPageSize: number,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (active) params.set("onlyActive", "1");
      params.set("page", String(requestedPage));
      params.set("pageSize", String(requestedPageSize));
      const data = await readJson(await fetch(`/api/users?${params}`, { cache: "no-store" }));
      setUsers(data.users ?? []);
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "خطا در دریافت کاربران." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    fetch("/api/users?mode=lookups", { cache: "no-store" })
      .then(readJson)
      .then((data) => {
        setSemats(data.semats ?? []);
        setMahals(data.mahals ?? []);
      })
      .catch((error: Error) => setNotice({ type: "error", text: error.message }));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadUsers(search, onlyActive, page, pageSize),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [loadUsers, onlyActive, page, pageSize, search]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function openCreate() {
    setEditing(false);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(true);
    setForm({
      userId: user.UserId,
      userName: user.UserName,
      fullName: user.FullName,
      telHamrah: user.TelHamrah ?? "",
      nationalCode: user.NationalCode,
      email: user.Email ?? "",
      sematId: user.SematId === null ? "" : String(user.SematId),
      mahalId: user.MahalId === null ? "" : String(user.MahalId),
      password: "",
      isActive: isTrue(user.IsActive),
      changePassword: isTrue(user.ChangePassword),
    });
    setModalOpen(true);
  }

  function change<K extends keyof UserForm>(key: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sematId: form.sematId || null,
          mahalId: form.mahalId || null,
        }),
      });
      const data = await readJson(response);
      setModalOpen(false);
      setNotice({ type: "success", text: data.message ?? "عملیات با موفقیت انجام شد." });
      await loadUsers(search, onlyActive, page, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ثبت اطلاعات انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || saving) return;
    setSaving(true);
    try {
      const data = await readJson(await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.UserId }),
      }));
      setDeleteTarget(null);
      setNotice({ type: "success", text: data.message ?? "کاربر حذف شد." });
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await loadUsers(search, onlyActive, nextPage, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف کاربر انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, totalCount);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4)) + index,
  );

  useEffect(() => {
    if (hydrated && !loading && page > totalPages) setPage(totalPages);
  }, [hydrated, loading, page, totalPages]);

  return (
    <main className={styles.page}>
      {notice && <div className={`${styles.notice} ${styles[notice.type]}`}>{notice.text}</div>}

      <section className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><Icon name="users" /></span>
          <div>
            <span className={styles.eyebrow}>مدیریت کاربران سامانه</span>
            <h1>فهرست کاربران</h1>
            <p>ثبت، ویرایش و مدیریت دسترسی کاربران بازرسی</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} type="button" onClick={() => void loadUsers(search, onlyActive, page, pageSize)} disabled={!hydrated || loading}>
            <Icon name="refresh" /><span>به‌روزرسانی</span>
          </button>
          <button className={styles.addButton} type="button" onClick={openCreate}>
            <Icon name="plus" /><span>کاربر جدید</span>
          </button>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Icon name="search" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جست‌وجوی نام، نام کاربری، کد ملی یا موبایل..." />
        </label>
        <label className={styles.activeFilter}>
          <input type="checkbox" checked={onlyActive} onChange={(event) => { setOnlyActive(event.target.checked); setPage(1); }} />
          <span>فقط کاربران فعال</span>
        </label>
        <span className={styles.counter}>{!hydrated || loading ? "در حال دریافت..." : `${totalCount.toLocaleString("fa-IR")} کاربر`}</span>
      </section>

      <section className={styles.tableCard} aria-busy={!hydrated || loading}>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>کاربر</th>
                <th>اطلاعات شناسایی</th>
                <th>سمت و محل خدمت</th>
                <th>وضعیت</th>
                <th>آخرین ورود</th>
                <th className={styles.actionsColumn}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {hydrated && !loading && users.map((user) => (
                <tr key={user.UserId}>
                  <td>
                    <div className={styles.personCell}>
                      <span className={styles.avatar}>{user.FullName.trim().slice(0, 1) || "ک"}</span>
                      <div><strong>{user.FullName}</strong><small>{user.UserName}</small></div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.detailsCell}>
                      <span>{user.NationalCode}</span>
                      <small>{user.TelHamrah || user.Email || "—"}</small>
                    </div>
                  </td>
                  <td>
                    <div className={styles.detailsCell}>
                      <span>{user.SematTitle || "بدون سمت"}</span>
                      <small>{user.MahalTitle || "محل خدمت تعیین نشده"}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.status} ${isTrue(user.IsActive) ? styles.statusActive : styles.statusInactive}`}>
                      <i />{isTrue(user.IsActive) ? "فعال" : "غیرفعال"}
                    </span>
                    {isTrue(user.ChangePassword) && <small className={styles.passwordFlag}>تغییر رمز اجباری</small>}
                  </td>
                  <td className={styles.lastLogin}>{user.LastDateLogin || "ثبت نشده"}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.editAction} type="button" onClick={() => openEdit(user)} title="ویرایش کاربر" aria-label={`ویرایش ${user.FullName}`}><Icon name="edit" /></button>
                      <button className={styles.deleteAction} type="button" onClick={() => setDeleteTarget(user)} title="حذف کاربر" aria-label={`حذف ${user.FullName}`}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!hydrated || loading) && <div className={styles.stateBox}><span className={styles.spinner} />در حال دریافت فهرست کاربران...</div>}
        {hydrated && !loading && users.length === 0 && <div className={styles.stateBox}><Icon name="users" /><strong>کاربری پیدا نشد</strong><span>عبارت جست‌وجو یا فیلتر را تغییر دهید.</span></div>}
        {hydrated && !loading && totalCount > 0 && (
          <footer className={styles.pagination}>
            <div className={styles.pageSummary}>
              نمایش {firstRow.toLocaleString("fa-IR")} تا {lastRow.toLocaleString("fa-IR")} از {totalCount.toLocaleString("fa-IR")}
            </div>
            <div className={styles.pageControls}>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>قبلی</button>
              {pageNumbers.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={pageNumber === page ? styles.currentPage : ""}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber.toLocaleString("fa-IR")}
                </button>
              ))}
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>بعدی</button>
            </div>
            <label className={styles.pageSize}>
              <span>تعداد در صفحه</span>
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                <option value="10">۱۰</option>
                <option value="15">۱۵</option>
                <option value="25">۲۵</option>
                <option value="50">۵۰</option>
              </select>
            </label>
          </footer>
        )}
      </section>

      {modalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && setModalOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
            <header className={styles.modalHeader}>
              <div><span>{editing ? "ویرایش اطلاعات" : "ثبت اطلاعات"}</span><h2 id="user-modal-title">{editing ? form.fullName : "کاربر جدید"}</h2></div>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving} aria-label="بستن فرم"><Icon name="close" /></button>
            </header>
            <form onSubmit={submitUser}>
              <div className={styles.formBody}>
                <div className={styles.formGrid}>
                  <label><span>نام و نام خانوادگی <b>*</b></span><input value={form.fullName} onChange={(event) => change("fullName", event.target.value)} maxLength={100} required /></label>
                  <label><span>نام کاربری <b>*</b></span><input dir="ltr" value={form.userName} onChange={(event) => change("userName", event.target.value)} maxLength={100} required /></label>
                  <label><span>کد ملی <b>*</b></span><input dir="ltr" inputMode="numeric" value={form.nationalCode} onChange={(event) => change("nationalCode", event.target.value)} maxLength={10} required /></label>
                  <label><span>شماره همراه</span><input dir="ltr" inputMode="tel" value={form.telHamrah} onChange={(event) => change("telHamrah", event.target.value)} maxLength={11} placeholder="09xxxxxxxxx" /></label>
                  <label className={styles.fullField}><span>ایمیل</span><input dir="ltr" type="email" value={form.email} onChange={(event) => change("email", event.target.value)} maxLength={256} /></label>
                  <label><span>سمت</span><select value={form.sematId} onChange={(event) => change("sematId", event.target.value)}><option value="">انتخاب نشده</option>{semats.map((item) => <option key={item.Id} value={item.Id}>{item.Title}</option>)}</select></label>
                  <label><span>محل خدمت</span><select value={form.mahalId} onChange={(event) => change("mahalId", event.target.value)}><option value="">انتخاب نشده</option>{mahals.map((item) => <option key={item.Id} value={item.Id}>{item.Title}</option>)}</select></label>
                  <label className={styles.fullField}><span>{editing ? "رمز عبور جدید" : "رمز عبور *"}</span><input dir="ltr" type="password" autoComplete="new-password" value={form.password} onChange={(event) => change("password", event.target.value)} minLength={6} maxLength={256} required={!editing} placeholder={editing ? "برای حفظ رمز فعلی خالی بگذارید" : "حداقل ۶ نویسه"} /></label>
                </div>
                <div className={styles.toggleRow}>
                  <label><input type="checkbox" checked={form.isActive} onChange={(event) => change("isActive", event.target.checked)} /><span><strong>حساب فعال</strong><small>کاربر امکان ورود به سامانه داشته باشد</small></span></label>
                  <label><input type="checkbox" checked={form.changePassword} onChange={(event) => change("changePassword", event.target.checked)} /><span><strong>تغییر رمز در ورود بعدی</strong><small>کاربر ملزم به تعیین رمز جدید باشد</small></span></label>
                </div>
              </div>
              <footer className={styles.modalFooter}>
                <button className={styles.cancelButton} type="button" onClick={() => setModalOpen(false)} disabled={saving}>انصراف</button>
                <button className={styles.saveButton} type="submit" disabled={saving}>{saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ثبت کاربر"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <span className={styles.dangerIcon}><Icon name="trash" /></span>
            <h2 id="delete-title">حذف کاربر</h2>
            <p>کاربر <strong>{deleteTarget.FullName}</strong> به‌صورت نرم حذف و امکان ورود او غیرفعال می‌شود.</p>
            <div><button type="button" className={styles.cancelButton} onClick={() => setDeleteTarget(null)} disabled={saving}>انصراف</button><button type="button" className={styles.confirmDelete} onClick={() => void confirmDelete()} disabled={saving}>{saving ? "در حال حذف..." : "تأیید حذف"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
