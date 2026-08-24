"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./AuthInput.module.css";

type AuthInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "size"
> & {
  label: string;
  icon: ReactNode;
  containerClassName?: string;
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {crossed ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

export default function AuthInput({
  id,
  name,
  label,
  icon,
  containerClassName = "",
  type = "text",
  ...inputProps
}: AuthInputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && passwordVisible ? "text" : type;
  const inputId = id ?? name;

  return (
    <div className={`${styles.field} ${containerClassName}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.inputWrap}>
        <span className={styles.icon}>{icon}</span>
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type={resolvedType}
          className={styles.input}
        />
        {isPassword ? (
          <button
            className={styles.action}
            type="button"
            onClick={() => setPasswordVisible((value) => !value)}
            aria-label={passwordVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          >
            <EyeIcon crossed={passwordVisible} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
