import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import styles from "./Login.module.css";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const modules = [
  {
    title: "ارزیابی عملکرد",
    text: "فرآیند ارزیابی و مدیریت امتیازها",
    tone: "blue",
  },
  {
    title: "انتصابات",
    text: "کارتابل، استعلام و سوابق انتصاب",
    tone: "green",
  },
  {
    title: "پرونده پرسنلی",
    text: "اطلاعات و سوابق کامل کارکنان",
    tone: "orange",
  },
  {
    title: "استعلامات",
    text: "ثبت، بررسی و پیگیری استعلام‌ها",
    tone: "purple",
  },
] as const;

function LoginIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 3h11a2 2 0 0 1 2 2v3h-2V5H5v14h10v-3h2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm13.6 6.3L22.3 14l-4.7 4.7-1.4-1.4 2.3-2.3H9v-2h9.5l-2.3-2.3 1.4-1.4L20.4 12l-5.7-5.7Z" />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) redirect("/Admin/Dashboard");

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <div className={styles.shell}>
        <section className={styles.brandPanel}>
          <div className={styles.brandHeader}>
            <div className={styles.logoMark} aria-hidden="true">ب</div>
            <div>
              <div className={styles.brandEyebrow}>سامانه سازمانی</div>
              <h1>سامانه جامع بازرسی</h1>
            </div>
          </div>

          <div className={styles.heroCopy}>
            <span className={styles.heroPill}>INSPECTION · EVALUATION</span>
            <h2>یک مرکز یکپارچه برای بازرسی، ارزیابی و فرآیندهای سازمانی</h2>
            <p>
              مدیریت متمرکز ارزیابی‌ها، انتصابات، پرونده‌های پرسنلی و استعلامات
              با دسترسی دقیق مبتنی بر سمت و محدوده سازمانی.
            </p>
          </div>

          <div className={styles.moduleGrid}>
            {modules.map((module) => (
              <article
                className={`${styles.moduleCard} ${styles[module.tone]}`}
                key={module.title}
              >
                <div className={styles.moduleDot} />
                <div>
                  <strong>{module.title}</strong>
                  <span>{module.text}</span>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.brandFooter}>
            <span className={styles.securityDot} />
            ورود امن و کنترل دسترسی بر اساس کاربر و محدوده سازمانی
          </div>
        </section>

        <section className={styles.loginPanel}>
          <div className={styles.mobileBrand}>سامانه جامع بازرسی</div>

          <div className={styles.loginCard}>
            <div className={styles.loginHeading}>
              <div className={styles.loginIcon}><LoginIcon /></div>
              <div>
                <span>خوش آمدید</span>
                <h3>ورود به سامانه</h3>
                <p>برای ادامه، اطلاعات حساب سازمانی خود را وارد کنید.</p>
              </div>
            </div>

            <LoginForm />

            <div className={styles.helpText}>
              در صورت فراموشی یا مشکل در ورود، با مدیر سامانه تماس بگیرید.
            </div>
          </div>

          <div className={styles.version}>نسخه ۱.۰ · سامانه جامع بازرسی</div>
        </section>
      </div>
    </main>
  );
}
