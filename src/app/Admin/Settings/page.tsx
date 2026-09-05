import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
import styles from "./Settings.module.css";

const settingCards = [
  {
    title: "دسترسی انتصابات",
    text: "تعیین پست انجام‌دهنده و پست‌هایی که اجازه انتصاب یا لغو انتصاب آن‌ها را دارد",
    tone: "orange",
    icon: "ن",
    href: "/Admin/Settings/AppointmentAccess",
  },
  {
    title: "گروه‌ها و دسترسی‌ها",
    text: "ایجاد گروه، تعیین دسترسی فرم‌ها و اتصال کاربران به گروه",
    tone: "teal",
    icon: "د",
    href: "/Admin/AccessManagement",
  },
  {
    title: "تنظیمات پایه",
    text: "مدیریت اطلاعات پایه و گزینه‌های عمومی سامانه بازرسی",
    tone: "blue",
    icon: "ت",
    href: null,
  },
  {
    title: "امنیت و ورود",
    text: "سیاست‌های ورود، رمز عبور و کنترل نشست کاربران",
    tone: "purple",
    icon: "ا",
    href: null,
  },
] as const;

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");
  if (!sessionHasMenu(session, ACCESS_MENU.settings)) redirect("/Admin/Dashboard");

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <span>تنظیمات سامانه</span>
        <h1>مدیریت تنظیمات</h1>
        <p>بخش‌های تنظیماتی سامانه از این صفحه در دسترس قرار می‌گیرند.</p>
      </div>

      <div className={styles.grid}>
        {settingCards.map((item) => {
          if (item.href === "/Admin/AccessManagement" && !sessionHasMenu(session, ACCESS_MENU.accessManagement)) return null;
          const content = (
          <article className={`${styles.card} ${item.href ? styles.cardActive : ""}`}>
            <span className={`${styles.icon} ${styles[item.tone]}`}>{item.icon}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <small>{item.href ? "ورود به تنظیمات" : "در مرحله بعد تکمیل می‌شود"}</small>
            </div>
          </article>
          );
          return item.href
            ? <Link className={styles.cardLink} href={item.href} key={item.title}>{content}</Link>
            : <div key={item.title}>{content}</div>;
        })}
      </div>
    </main>
  );
}
