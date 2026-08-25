"use client";

import dynamic from "next/dynamic";
import styles from "./OrganizationStructure.module.css";

const OrganizationStructureClient = dynamic(
  () => import("./OrganizationStructureClient"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.initialLoading} dir="rtl">
        <span className={styles.spinner} />
        در حال آماده‌سازی ساختار سازمانی...
      </div>
    ),
  },
);

export default function OrganizationStructurePage() {
  return <OrganizationStructureClient />;
}
