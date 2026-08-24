"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Dashboard.module.css";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/Login");
      router.refresh();
    }
  }

  return (
    <button className={styles.logout} type="button" onClick={logout} disabled={loading}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
      </svg>
      {loading ? "در حال خروج..." : "خروج"}
    </button>
  );
}
