"use client";

import dynamic from "next/dynamic";
import styles from "./CurrentAppointments.module.css";

const CurrentAppointmentsClient = dynamic(() => import("./CurrentAppointmentsClient"), {
  ssr: false,
  loading: () => (
    <div className={styles.initialLoading} dir="rtl">
      <span className={styles.spinner} />
      در حال آماده‌سازی فهرست انتصاب‌های جاری...
    </div>
  ),
});

export default function CurrentAppointmentsPage() {
  return <CurrentAppointmentsClient />;
}
