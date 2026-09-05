import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main dir="rtl" style={{ maxWidth: 760, margin: "70px auto", padding: 32, textAlign: "center", background: "#fff", border: "1px solid #dbe5ea", borderRadius: 18 }}>
      <strong style={{ display: "block", fontSize: 20, color: "#294b5a", marginBottom: 8 }}>دسترسی فعالی برای حساب شما تعریف نشده است</strong>
      <p style={{ fontSize: 13, color: "#718590", lineHeight: 1.9 }}>مدیر سامانه باید شما را به یک گروه دسترسی متصل کند یا مجوزهای گروه فعلی را تغییر دهد.</p>
      <Link href="/Login" style={{ display: "inline-block", marginTop: 12, padding: "9px 18px", borderRadius: 10, background: "#236f62", color: "white", textDecoration: "none" }}>بازگشت به ورود</Link>
    </main>
  );
}
