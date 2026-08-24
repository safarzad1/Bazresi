import styles from "./Settings.module.css";

const settingCards = [
  {
    title: "کاربران و دسترسی‌ها",
    text: "مدیریت کاربران، سمت‌ها و سطح دسترسی به بخش‌های سامانه",
    tone: "teal",
    icon: "ک",
  },
  {
    title: "تنظیمات پایه",
    text: "مدیریت اطلاعات پایه و گزینه‌های عمومی سامانه بازرسی",
    tone: "blue",
    icon: "ت",
  },
  {
    title: "امنیت و ورود",
    text: "سیاست‌های ورود، رمز عبور و کنترل نشست کاربران",
    tone: "purple",
    icon: "ا",
  },
] as const;

export default function SettingsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <span>تنظیمات سامانه</span>
        <h1>مدیریت تنظیمات</h1>
        <p>بخش‌های تنظیماتی سامانه از این صفحه در دسترس قرار می‌گیرند.</p>
      </div>

      <div className={styles.grid}>
        {settingCards.map((item) => (
          <article className={styles.card} key={item.title}>
            <span className={`${styles.icon} ${styles[item.tone]}`}>{item.icon}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
              <small>در مرحله بعد تکمیل می‌شود</small>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
