"use client";

import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";
import styles from "./InputPersianDatePicker.module.css";

type Props = {
    label?: string;
    value?: string;
    onChange?: (date: string | null) => void;
    required?: boolean;
    allowPastDates?: boolean;
    placeholder?: string;
    error?: boolean;
    errorMessage?: string;
};

export default function InputPersianDate({
    label,
    value,
    onChange,
    required = false,
    allowPastDates = true,
    placeholder = "انتخاب تاریخ",
    error = false,
    errorMessage,
}: Props) {
    const selected = value
        ? new DateObject({
              date: value,
              calendar: persian,
              locale: persian_fa,
          })
        : null;

    return (
        <div className={styles.field} dir="rtl">
            {label ? (
                <label className={styles.label}>
                    {label}
                    {required ? <span>*</span> : null}
                </label>
            ) : null}

            <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={selected}
                onChange={(date: DateObject | null) =>
                    onChange?.(
                        date
                            ? date.format("YYYY/MM/DD")
                            : null,
                    )
                }
                minDate={
                    allowPastDates
                        ? undefined
                        : new DateObject({
                              calendar: persian,
                              locale: persian_fa,
                          })
                }
                inputClass={`${styles.input} ${error ? styles.inputError : ""}`}
                placeholder={placeholder}
                calendarPosition="bottom-right"
                portal
                zIndex={2147483000}
            />

            {error && errorMessage ? (
                <div className={styles.errorMessage} role="alert">
                    {errorMessage}
                </div>
            ) : null}
        </div>
    );
}
