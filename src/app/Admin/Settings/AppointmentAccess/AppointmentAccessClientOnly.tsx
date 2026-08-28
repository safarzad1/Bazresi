"use client";

import dynamic from "next/dynamic";
import styles from "./AppointmentAccess.module.css";

const AppointmentAccessClient = dynamic(
  () => import("./AppointmentAccessClient"),
  {
    ssr: false,
    loading: () => (
      <main className={styles.page} dir="rtl">
        <section className={styles.hydrationCard}>
          <span className={styles.spinner} />
          در حال آماده‌سازی فرم...
        </section>
      </main>
    ),
  },
);

export default function AppointmentAccessClientOnly() {
  return <AppointmentAccessClient />;
}
