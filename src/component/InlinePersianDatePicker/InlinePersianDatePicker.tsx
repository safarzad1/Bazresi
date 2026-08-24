"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";

import styles from "./InlinePersianDatePicker.module.css";

type InlinePersianDatePickerProps = {
  value?: string | null;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: (date: string) => void;
};

function toEnglishDigits(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function createDateValue(value?: string | null) {
  const normalized = toEnglishDigits(value).trim();
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) return null;

  try {
    return new DateObject({
      date: normalized,
      format: "YYYY/MM/DD",
      calendar: persian,
      locale: persianFa,
    });
  } catch {
    return null;
  }
}

export default function InlinePersianDatePicker({
  value,
  disabled = false,
  ariaLabel = "تاریخ هزینه",
  onChange,
}: InlinePersianDatePickerProps) {
  const selectedDate = useMemo(() => createDateValue(value), [value]);

  return (
    <div className={styles.wrapper} aria-label={ariaLabel}>
      <DatePicker
        value={selectedDate}
        calendar={persian}
        locale={persianFa}
        format="YYYY/MM/DD"
        onChange={(date) => {
          if (!date || Array.isArray(date)) return;
          const normalized = toEnglishDigits(date.format("YYYY/MM/DD")).trim();
          if (/^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) onChange(normalized);
        }}
        editable={false}
        disabled={disabled}
        placeholder="انتخاب تاریخ"
        calendarPosition="bottom-right"
        portal
        zIndex={2147483647}
        fixMainPosition
        fixRelativePosition
        containerClassName={styles.container}
        inputClass={styles.input}
        className={styles.calendar}
      />
      <CalendarDays className={styles.icon} size={17} aria-hidden="true" />
    </div>
  );
}
