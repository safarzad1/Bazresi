"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  children: ReactNode;
  displayName: string;
  userName: string;
  sematTitle: string | null;
};

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.35.55.7 1 .9.34.15.7.2 1.1.2h.1v4h-.1a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-1 .5Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19v-1.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19M15.5 5.5a3 3 0 0 1 0 5.8M16.5 14a4.5 4.5 0 0 1 4 4.5V19" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

const menuItems = [
  { href: "/Admin/Dashboard", title: "داشبورد", icon: DashboardIcon },
  { href: "/Admin/Users", title: "فهرست کاربران", icon: UsersIcon },
  { href: "/Admin/Settings", title: "تنظیمات", icon: SettingsIcon },
];

export default function AdminShell({
  children,
  displayName,
  userName,
  sematTitle,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const currentPage = menuItems.find((item) => pathname.startsWith(item.href));

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/Login");
      router.refresh();
    }
  }

  return (
    <div className={styles.shell} dir="rtl">
      <button
        className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ""}`}
        type="button"
        onClick={() => setMenuOpen(false)}
        aria-label="بستن منو"
      />

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>ب</span>
          <div>
            <strong>سامانه جامع بازرسی</strong>
            <small>پنل مدیریت سازمانی</small>
          </div>
        </div>

        <nav className={styles.navigation} aria-label="منوی عمومی">
          <span className={styles.menuTitle}>منوی عمومی</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={`${styles.menuLink} ${active ? styles.menuLinkActive : ""}`}
                href={item.href}
                key={item.href}
              >
                <span className={styles.menuIcon}><Icon /></span>
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <span className={styles.avatar}>{displayName.trim().slice(0, 1) || "ک"}</span>
            <div className={styles.userText}>
              <strong>{displayName}</strong>
              <small>{sematTitle || userName}</small>
            </div>
            <button
              className={styles.logoutButton}
              type="button"
              onClick={logout}
              disabled={loggingOut}
              aria-label="خروج از سامانه"
              title="خروج"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerStart}>
            <button
              className={styles.menuToggle}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="باز کردن منو"
            >
              <span /><span /><span />
            </button>
            <div className={styles.headerTitle}>
              <span>سامانه جامع بازرسی</span>
              <strong>{currentPage?.title ?? "پنل مدیریت"}</strong>
            </div>
          </div>
          <span className={styles.onlineStatus}><i /> سامانه فعال</span>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
