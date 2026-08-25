"use client";

import dynamic from "next/dynamic";
import styles from "./Persons.module.css";

const PersonsClient = dynamic(() => import("./PersonsClient"), {
  ssr: false,
  loading: () => (
    <div className={styles.initialLoading} dir="rtl">
      <span className={styles.spinner} />
      در حال آماده‌سازی فهرست اشخاص...
    </div>
  ),
});

export default function PersonsPage() {
  return <PersonsClient />;
}
