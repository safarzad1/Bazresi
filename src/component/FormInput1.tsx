"use client";

import {
    ChangeEvent,
    InputHTMLAttributes,
    KeyboardEvent,
} from "react";
import { LucideIcon } from "lucide-react";
import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    formatThousands,
} from "@/Utils/numberFormat";

import styles from "./FormInput1.module.css";

type NativeInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "value"
    | "onChange"
    | "onKeyDown"
    | "children"
>;

interface FormInputProps
    extends NativeInputProps {
    label?: string;
    icon?: LucideIcon;
    value?: string;
    onChange?: (
        e: ChangeEvent<HTMLInputElement>,
    ) => void;
    onKeyDown?: (
        e: KeyboardEvent<HTMLInputElement>,
    ) => void;
    error?: boolean;
    errorMessage?: string;
    onlyNumber?: boolean;
    thousandSeparator?: boolean;
    decimalScale?: number;
    labelColor?: string;
    requiredStarColor?: string;
}

const FormInput1 = ({
    label,
    placeholder,
    icon: Icon,
    value,
    name,
    maxLength,
    onChange,
    onKeyDown,
    error = false,
    errorMessage,
    onlyNumber = false,
    thousandSeparator = false,
    decimalScale = 2,
    labelColor = "",
    required = false,
    requiredStarColor = "",
    disabled = false,
    autoComplete,
    autoFocus = false,
    type = "text",
    inputMode: inputModeProp,
    ...nativeInputProps
}: FormInputProps) => {
    const handleChange = (
        e: ChangeEvent<HTMLInputElement>,
    ) => {
        let nextValue =
            e.target.value;

        if (thousandSeparator) {
            nextValue =
                formatThousands(
                    nextValue,
                    {
                        decimalScale:
                            onlyNumber
                                ? 0
                                : decimalScale,
                    },
                );
        } else if (onlyNumber) {
            nextValue =
                nextValue.replace(
                    /\D/g,
                    "",
                );
        }

        if (
            nextValue ===
            e.target.value
        ) {
            onChange?.(e);
            return;
        }

        onChange?.({
            ...e,
            target: {
                ...e.target,
                value: nextValue,
                name:
                    name ??
                    e.target.name,
            },
        } as ChangeEvent<HTMLInputElement>);
    };

    const resolvedInputMode =
        inputModeProp ??
        (thousandSeparator &&
        !onlyNumber
            ? "decimal"
            : onlyNumber
              ? "numeric"
              : undefined);

    return (
        <div
            className={
                styles.field
            }
        >
            {label ? (
                <label
                    className={`${styles.label} ${labelColor}`}
                    htmlFor={name}
                >
                    {label}

                    {required ? (
                        <span
                            className={`${styles.required} ${requiredStarColor}`}
                        >
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}

            <div
                className={`${styles.inputWrap} ${
                    error
                        ? styles.inputWrapError
                        : ""
                } ${
                    disabled
                        ? styles.inputWrapDisabled
                        : ""
                }`}
            >
                {Icon ? (
                    <span
                        className={
                            styles.icon
                        }
                        aria-hidden="true"
                    >
                        <Icon
                            size={16}
                            strokeWidth={
                                1.8
                            }
                        />
                    </span>
                ) : null}

                <input
                    {...nativeInputProps}
                    id={name}
                    type={type}
                    value={
                        thousandSeparator
                            ? formatThousands(
                                  value ?? "",
                                  {
                                      decimalScale:
                                          onlyNumber
                                              ? 0
                                              : decimalScale,
                                  },
                              )
                            : value ?? ""
                    }
                    onChange={
                        handleChange
                    }
                    onKeyDown={
                        onKeyDown
                    }
                    maxLength={
                        maxLength
                    }
                    placeholder={
                        placeholder
                    }
                    name={name}
                    required={
                        required
                    }
                    disabled={
                        disabled
                    }
                    autoComplete={
                        autoComplete
                    }
                    autoFocus={
                        autoFocus
                    }
                    inputMode={
                        resolvedInputMode
                    }
                    className={
                        styles.input
                    }
                />
            </div>

            <AnimatePresence>
                {errorMessage ? (
                    <motion.p
                        initial={{
                            opacity: 0,
                            y: -3,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -3,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        className={
                            styles.errorMessage
                        }
                    >
                        {errorMessage}
                    </motion.p>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default FormInput1;
