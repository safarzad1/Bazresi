import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import styles from "./Dashboard.module.css";

const modules = [
  { key: "dashboard", title: "داشبورد", text: "نمای کلی وضعیت سامانه", color: "blue" },
  { key: "evaluation", title: "ارزیابی", text: "مدیریت فرآیندهای ارزیابی", color: "green" },
  { key: "appointments", title: "انتصابات", text: "کارتابل و سوابق انتصابات", color: "amber" },
  { key: "personnel", title: "منابع انسانی", text: "اطلاعات و پرونده پرسنلی", color: "purple" },
  { key: "inquiries", title: "استعلامات", text: "ثبت و پیگیری استعلام‌ها", color: "cyan" },
] as const;

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/Login");

  const visibleModules = modules.filter((item) => session.permissions[item.key]);

  return (
    <main className={styles.page}>
      <div className={styles.welcome}>
        <div>
          <span>ورود موفق</span>
          <h1>{session.fullName}، خوش آمدید</h1>
          <p>از این بخش می‌توانید به ماژول‌های مجاز سامانه دسترسی داشته باشید.</p>
        </div>
        <div className={styles.welcomeBadge}>داشبورد</div>
      </div>

      {session.mustChangePassword ? (
        <div className={styles.notice}>
          برای افزایش امنیت حساب، لازم است رمز عبور خود را تغییر دهید.
        </div>
      ) : null}

      <div className={styles.sectionTitle}>
        <h2>دسترسی‌های من</h2>
        <span>{visibleModules.length} ماژول فعال</span>
      </div>

      {visibleModules.length ? (
        <div className={styles.grid}>
          {visibleModules.map((item) => (
            <article className={styles.card} key={item.key}>
              <span className={`${styles.cardIcon} ${styles[item.color]}`}>{item.title.slice(0, 1)}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className={styles.ready}>فعال</span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyAccess}>
          دسترسی فعالی برای این حساب تعریف نشده است. با مدیر سامانه تماس بگیرید.
        </div>
      )}
    </main>
  );
}
