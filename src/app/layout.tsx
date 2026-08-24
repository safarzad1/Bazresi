import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../Styles/globals.css";

export const metadata: Metadata = {
  title: "سامانه جامع بازرسی",
  description: "سامانه جامع مدیریت و ارزیابی بازرسی",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
