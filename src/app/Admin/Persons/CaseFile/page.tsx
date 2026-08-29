"use client";

import dynamic from "next/dynamic";
import styles from "./CaseFile.module.css";

const CaseFileClient = dynamic(() => import("./CaseFileClient"), {
  ssr: false,
  loading: () => <div className={styles.loading} dir="rtl"><span />در حال آماده‌سازی پرونده...</div>,
});

export default function CaseFilePage() {
  return <CaseFileClient />;
}
