"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ACCESS_MENU, hasAccess, menuCodeForPath } from "@/lib/access-menu";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  children: ReactNode;
  displayName: string;
  userName: string;
  sematTitle: string | null;
  isSystemAdmin: boolean;
  menuCodes: string[];
};

type AppointmentNotification = {
  entesabId: number;
  fullName: string | null;
  postTitle: string | null;
  requesterFullName: string | null;
  createDateTime: string | null;
  unread: boolean;
};

type AppointmentNotifications = {
  pendingCount: number;
  unreadCount: number;
  items: AppointmentNotification[];
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

function OrganizationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="5" rx="1.5" />
      <rect x="3" y="16" width="6" height="5" rx="1.5" />
      <rect x="15" y="16" width="6" height="5" rx="1.5" />
      <path d="M12 8v4M6 16v-4h12v4" />
    </svg>
  );
}

function PersonsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1.4A6.6 6.6 0 0 1 11.6 12h.8a6.6 6.6 0 0 1 6.6 6.6V20" />
      <path d="M4 4h3M4 7h2" />
    </svg>
  );
}

function AppointmentsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12v16H6z" />
      <path d="M9 2v4M15 2v4M9 10h6M9 14h6" />
    </svg>
  );
}

function EvaluationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h12v16H6z" />
      <path d="M9 2v4M15 2v4M9 10h6M9 14h3" />
      <path d="m14 16 1.5 1.5L19 14" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 7 5 5-5 5" />
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 20h4" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

const dashboardItem = { href: "/Admin/Dashboard", title: "داشبورد", icon: DashboardIcon };

const personsItems = [
  { href: "/Admin/Persons", title: "فهرست اشخاص", icon: PersonsIcon },
];

const organizationItems = [
  { href: "/Admin/OrganizationStructure", title: "ساختار سازمانی", icon: OrganizationIcon },
];

const systemItems = [
  { href: "/Admin/Users", title: "فهرست کاربران", icon: UsersIcon },
  { href: "/Admin/Settings", title: "تنظیمات سامانه", icon: SettingsIcon },
];

export default function AdminShell({
  children,
  displayName,
  userName,
  sematTitle,
  isSystemAdmin,
  menuCodes,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dashboardAllowed = hasAccess(menuCodes, ACCESS_MENU.dashboard, isSystemAdmin);
  const personsAllowed = hasAccess(menuCodes, ACCESS_MENU.persons, isSystemAdmin);
  const workflowAllowed = hasAccess(menuCodes, ACCESS_MENU.appointmentsWorkflow, isSystemAdmin);
  const currentAppointmentsAllowed = hasAccess(menuCodes, ACCESS_MENU.appointmentsCurrent, isSystemAdmin);
  const cancellationsAllowed = hasAccess(menuCodes, ACCESS_MENU.appointmentsCancellations, isSystemAdmin);
  const appointmentsAllowed = workflowAllowed || currentAppointmentsAllowed || cancellationsAllowed;
  const evaluationAllowed = hasAccess(menuCodes, ACCESS_MENU.evaluation, isSystemAdmin);
  const organizationAllowed = hasAccess(menuCodes, ACCESS_MENU.organization, isSystemAdmin);
  const usersAllowed = hasAccess(menuCodes, ACCESS_MENU.users, isSystemAdmin);
  const accessManagementAllowed = hasAccess(menuCodes, ACCESS_MENU.accessManagement, isSystemAdmin);
  const settingsAllowed = hasAccess(menuCodes, ACCESS_MENU.settings, isSystemAdmin);
  const requiredMenuCode = menuCodeForPath(pathname);
  const pageAllowed = !requiredMenuCode || hasAccess(menuCodes, requiredMenuCode, isSystemAdmin);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointmentsOpen, setAppointmentsOpen] = useState(pathname.startsWith("/Admin/Appointments"));
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppointmentNotifications>({
    pendingCount: 0,
    unreadCount: 0,
    items: [],
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setNotificationOpen(false);
    if (pathname.startsWith("/Admin/Appointments")) setAppointmentsOpen(true);
  }, [pathname]);

  useEffect(() => {
    function closeHeaderMenus(event: MouseEvent) {
      if (
        headerActionsRef.current &&
        !headerActionsRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", closeHeaderMenus);
    return () => document.removeEventListener("mousedown", closeHeaderMenus);
  }, []);

  useEffect(() => {
    if (!workflowAllowed) return;
    let active = true;

    async function loadNotifications() {
      setNotificationsLoading(true);
      try {
        const response = await fetch("/api/appointments/notifications", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as AppointmentNotifications;
        if (active) {
          setNotifications({
            pendingCount: Number(payload.pendingCount || 0),
            unreadCount: Number(payload.unreadCount || 0),
            items: Array.isArray(payload.items) ? payload.items : [],
          });
        }
      } catch {
        // خطای موقت اعلان نباید مانع نمایش سایر بخش‌های پنل شود.
      } finally {
        if (active) setNotificationsLoading(false);
      }
    }

    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 60_000);
    window.addEventListener("appointments:notifications-changed", loadNotifications);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("appointments:notifications-changed", loadNotifications);
    };
  }, [workflowAllowed, pathname]);

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

        <nav className={styles.navigation} aria-label="منوی سامانه">
          {dashboardAllowed && (
            <div className={styles.menuSection}>
              <span className={styles.menuTitle}>اصلی</span>
              <Link
                className={`${styles.menuLink} ${pathname.startsWith(dashboardItem.href) ? styles.menuLinkActive : ""}`}
                href={dashboardItem.href}
              >
                <span className={styles.menuIcon}><DashboardIcon /></span>
                <span>{dashboardItem.title}</span>
              </Link>
            </div>
          )}

          {personsAllowed && (
            <div className={styles.menuSection}>
              <span className={styles.menuTitle}>اشخاص و پرونده‌ها</span>
              {personsItems.map((item) => {
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
            </div>
          )}

          {(appointmentsAllowed || evaluationAllowed) && (
            <div className={styles.menuSection}>
              <span className={styles.menuTitle}>فرآیندها</span>

              {appointmentsAllowed && (
                <div className={styles.menuGroup}>
                  <button
                    type="button"
                    className={`${styles.menuLink} ${styles.menuGroupButton} ${pathname.startsWith("/Admin/Appointments") ? styles.menuLinkActive : ""}`}
                    onClick={() => setAppointmentsOpen((current) => !current)}
                    aria-expanded={appointmentsOpen}
                  >
                    <span className={styles.menuIcon}><AppointmentsIcon /></span>
                    <span className={styles.menuGroupTitle}>انتصابات</span>
                    <span className={`${styles.menuChevron} ${appointmentsOpen ? styles.menuChevronOpen : ""}`}><ChevronIcon /></span>
                  </button>

                  {appointmentsOpen && (
                    <div className={styles.submenu}>
                      {workflowAllowed && (
                        <Link
                          className={`${styles.submenuLink} ${pathname.startsWith("/Admin/Appointments/Workflow") ? styles.submenuLinkActive : ""}`}
                          href="/Admin/Appointments/Workflow"
                        >
                          <span />
                          فرایند انتصابات
                        </Link>
                      )}
                      {currentAppointmentsAllowed && (
                        <Link
                          className={`${styles.submenuLink} ${pathname.startsWith("/Admin/Appointments/Current") ? styles.submenuLinkActive : ""}`}
                          href="/Admin/Appointments/Current"
                        >
                          <span />
                          انتصاب‌های جاری
                        </Link>
                      )}
                      {cancellationsAllowed && (
                        <Link
                          className={`${styles.submenuLink} ${pathname.startsWith("/Admin/Appointments/Cancellations") ? styles.submenuLinkActive : ""}`}
                          href="/Admin/Appointments/Cancellations"
                        >
                          <span />
                          لغو انتصاب
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {evaluationAllowed && (
                <Link
                  className={`${styles.menuLink} ${pathname.startsWith("/Admin/Evaluation") ? styles.menuLinkActive : ""}`}
                  href="/Admin/Evaluation"
                >
                  <span className={styles.menuIcon}><EvaluationIcon /></span>
                  <span>ارزشیابی</span>
                </Link>
              )}
            </div>
          )}

          {organizationAllowed && (
            <div className={styles.menuSection}>
              <span className={styles.menuTitle}>ساختار سازمان</span>
              {organizationItems.map((item) => {
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
            </div>
          )}

          {(usersAllowed || accessManagementAllowed || settingsAllowed) && (
            <div className={styles.menuSection}>
              <span className={styles.menuTitle}>مدیریت سامانه</span>
              {usersAllowed && (
                <Link className={`${styles.menuLink} ${pathname.startsWith("/Admin/Users") ? styles.menuLinkActive : ""}`} href="/Admin/Users">
                  <span className={styles.menuIcon}><UsersIcon /></span><span>فهرست کاربران</span>
                </Link>
              )}
              {accessManagementAllowed && (
                <Link className={`${styles.menuLink} ${pathname.startsWith("/Admin/AccessManagement") ? styles.menuLinkActive : ""}`} href="/Admin/AccessManagement">
                  <span className={styles.menuIcon}><SettingsIcon /></span><span>مدیریت دسترسی</span>
                </Link>
              )}
              {settingsAllowed && (
                <Link className={`${styles.menuLink} ${pathname.startsWith("/Admin/Settings") ? styles.menuLinkActive : ""}`} href="/Admin/Settings">
                  <span className={styles.menuIcon}><SettingsIcon /></span><span>تنظیمات سامانه</span>
                </Link>
              )}
            </div>
          )}
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
              <strong>مرکز کنترل سازمان</strong>
            </div>
          </div>

          <div className={styles.headerActions} ref={headerActionsRef}>
            <label className={styles.headerSearch}>
              <SearchIcon />
              <input
                type="search"
                placeholder="جستجو در سامانه..."
                aria-label="جستجو در سامانه"
              />
            </label>

            {workflowAllowed && (
            <div className={styles.notificationWrap}>
              <button
                className={styles.notificationButton}
                type="button"
                aria-label="اعلان‌ها"
                aria-expanded={notificationOpen}
                onClick={() => {
                  setProfileOpen(false);
                  setNotificationOpen((current) => !current);
                }}
              >
                <BellIcon />
                {notifications.unreadCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {notifications.unreadCount > 99
                      ? "+۹۹"
                      : notifications.unreadCount.toLocaleString("fa-IR")}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className={styles.notificationPanel}>
                  <header className={styles.notificationHeader}>
                    <div>
                      <strong>کارتابل انتصابات</strong>
                      <span>{notifications.pendingCount.toLocaleString("fa-IR")} درخواست در انتظار اقدام</span>
                    </div>
                    {notifications.unreadCount > 0 && (
                      <b>{notifications.unreadCount.toLocaleString("fa-IR")} جدید</b>
                    )}
                  </header>
                  <div className={styles.notificationList}>
                    {notificationsLoading && !notifications.items.length ? (
                      <p>در حال دریافت اعلان‌ها...</p>
                    ) : notifications.items.length ? (
                      notifications.items.slice(0, 5).map((item) => (
                        <Link
                          href={`/Admin/Appointments/Workflow?request=${item.entesabId}`}
                          className={item.unread ? styles.unreadNotification : ""}
                          key={item.entesabId}
                          onClick={() => setNotificationOpen(false)}
                        >
                          <i />
                          <span>
                            <strong>{item.fullName || "فرد پیشنهادی"}</strong>
                            <small>{item.postTitle || "پیشنهاد انتصاب"}{item.requesterFullName ? ` · از ${item.requesterFullName}` : ""}</small>
                          </span>
                        </Link>
                      ))
                    ) : (
                      <div className={styles.emptyNotifications}>
                        <BellIcon />
                        <strong>اعلان جدیدی ندارید</strong>
                        <span>درخواست‌های رسیده به کارتابل شما اینجا نمایش داده می‌شوند.</span>
                      </div>
                    )}
                  </div>
                  {notifications.pendingCount > 0 && (
                    <Link className={styles.allNotificationsLink} href="/Admin/Appointments/Workflow" onClick={() => setNotificationOpen(false)}>
                      مشاهده همه درخواست‌ها
                    </Link>
                  )}
                </div>
              )}
            </div>
            )}

            <div className={styles.headerProfileWrap}>
              <button
                className={styles.headerProfile}
                type="button"
                aria-expanded={profileOpen}
                onClick={() => {
                  setNotificationOpen(false);
                  setProfileOpen((current) => !current);
                }}
              >
                <span className={styles.headerAvatar}>
                  {displayName.trim().slice(0, 1) || "ک"}
                </span>
                <span className={styles.headerProfileText}>
                  <strong>{displayName}</strong>
                  <small>{sematTitle || userName}</small>
                </span>
                <span className={`${styles.profileArrow} ${profileOpen ? styles.profileArrowOpen : ""}`}>
                  <DownIcon />
                </span>
              </button>

              {profileOpen && (
                <div className={styles.profileMenu}>
                  {settingsAllowed && (
                    <Link className={styles.profileMenuItem} href="/Admin/Settings">
                      <SettingsIcon />
                      تنظیمات
                    </Link>
                  )}
                  <button
                    className={`${styles.profileMenuItem} ${styles.profileMenuLogout}`}
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                  >
                    <LogoutIcon />
                    {loggingOut ? "در حال خروج..." : "خروج از سامانه"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {pageAllowed ? children : (
            <section style={{maxWidth: 760, margin: "70px auto", padding: 32, textAlign: "center", background: "#fff", border: "1px solid #dbe5ea", borderRadius: 18}}>
              <strong style={{display: "block", fontSize: 20, color: "#294b5a", marginBottom: 8}}>دسترسی به این بخش مجاز نیست</strong>
              <span style={{fontSize: 13, color: "#718590"}}>سطح دسترسی حساب شما از طریق گروه دسترسی مدیریت می‌شود.</span>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
