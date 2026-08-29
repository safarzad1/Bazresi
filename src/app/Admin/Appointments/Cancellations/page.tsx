"use client";

import dynamic from "next/dynamic";
import styles from "./Cancellations.module.css";

const CancellationsClient = dynamic(() => import("./CancellationsClient"), {
  ssr: false,
  loading: () => <div className={styles.initialLoading} dir="rtl"><span className={styles.spinner} /> در حال آماده‌سازی فرایند لغو انتصاب...</div>,
});

export default function CancellationsPage() {
  return <CancellationsClient />;
}
