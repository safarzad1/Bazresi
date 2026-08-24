"use client";

import dynamic from "next/dynamic";
import styles from "./Users.module.css";

const UsersClient = dynamic(() => import("./UsersClient"), {
  ssr: false,
  loading: () => (
    <div className={styles.initialLoading} dir="rtl">
      <span className={styles.spinner} />
      در حال آماده‌سازی فهرست کاربران...
    </div>
  ),
});

export default function UsersPage() {
  return <UsersClient />;
}
