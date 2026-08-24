"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import AuthInput from "@/component/AuthInput";
import styles from "./Login.module.css";

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.14 0-7.5 2.46-7.5 5.5 0 .83.67 1.5 1.5 1.5h12c.83 0 1.5-.67 1.5-1.5 0-3.04-3.36-5.5-7.5-5.5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 9h-1V6.8A4.8 4.8 0 0 0 11.2 2h-.4A4.8 4.8 0 0 0 6 6.8V9H5a2 2 0 0 0-2 2v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8a2 2 0 0 0-2-2Zm-8.7-2.2a2.5 2.5 0 0 1 5 0V9h-5V6.8ZM12 17.6V19a1 1 0 0 1-2 0v-1.4a2 2 0 1 1 2 0Z" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });
      const result = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setError(result.message ?? "ورود انجام نشد.");
        return;
      }

      router.replace(result.redirectTo ?? "/Admin/Dashboard");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <AuthInput
        id="userName"
        name="userName"
        label="نام کاربری"
        icon={<UserIcon />}
        value={userName}
        onChange={(event) => setUserName(event.target.value)}
        placeholder="نام کاربری خود را وارد کنید"
        autoComplete="username"
        maxLength={100}
        required
        autoFocus
        disabled={loading}
      />

      <AuthInput
        id="password"
        name="password"
        label="رمز عبور"
        icon={<LockIcon />}
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="رمز عبور خود را وارد کنید"
        autoComplete="current-password"
        maxLength={256}
        required
        disabled={loading}
        containerClassName={styles.passwordField}
      />

      {error ? (
        <div className={styles.errorBox} role="alert">
          <span>!</span>
          {error}
        </div>
      ) : null}

      <button className={styles.submitButton} type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            در حال بررسی...
          </>
        ) : (
          <>
            ورود به سامانه
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14.7 6.3-1.4 1.4 3.3 3.3H4v2h12.6l-3.3 3.3 1.4 1.4L20.4 12l-5.7-5.7Z" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
