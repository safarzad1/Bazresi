"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import styles from "./Dropdown.module.css";
import type { DropdownOption, DropdownValue } from "./types";
import {
    createDropdownMenuStyle,
    getDropdownPosition,
    normalizeDropdownSearch,
    type DropdownPosition,
} from "./dropdownUtils";

export type SearchableMultiSelectDropdownProps<
    T extends DropdownValue = string,
> = {
    value: T[];
    options: DropdownOption<T>[];
    onChange: (value: T[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    noResultText?: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    className?: string;
    ariaLabel?: string;
    menuWidth?: number;
    dropdownZIndex?: number;
    clearSearchOnSelect?: boolean;
};

export default function SearchableMultiSelectDropdown<
    T extends DropdownValue = string,
>({
    value,
    options,
    onChange,
    placeholder = "جست‌وجو و انتخاب کنید",
    searchPlaceholder = "جست‌وجو...",
    emptyText = "گزینه‌ای برای انتخاب وجود ندارد.",
    noResultText = "موردی پیدا نشد.",
    disabled = false,
    loading = false,
    loadingText = "در حال دریافت...",
    className = "",
    ariaLabel = "انتخاب چند گزینه",
    menuWidth,
    dropdownZIndex = 2147483000,
    clearSearchOnSelect = false,
}: SearchableMultiSelectDropdownProps<T>) {
    const generatedId = useId().replace(/:/g, "");
    const listId = `searchable-multi-list-${generatedId}`;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [position, setPosition] = useState<DropdownPosition>({
        top: 0,
        left: 0,
        width: 300,
        maxHeight: 310,
    });

    const normalizedOptions = useMemo(() => {
        const unique = new Map<T, DropdownOption<T>>();
        for (const option of options) unique.set(option.value, option);
        return Array.from(unique.values());
    }, [options]);

    const selectedSet = useMemo(() => new Set(value), [value]);
    const selectedOptions = useMemo(
        () => value
            .map((selectedValue) =>
                normalizedOptions.find((option) => option.value === selectedValue),
            )
            .filter((option): option is DropdownOption<T> => Boolean(option)),
        [normalizedOptions, value],
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = normalizeDropdownSearch(query);
        if (!normalizedQuery) return normalizedOptions;
        return normalizedOptions.filter((option) =>
            normalizeDropdownSearch(
                `${option.label} ${option.description ?? ""} ${option.searchText ?? ""}`,
            ).includes(normalizedQuery),
        );
    }, [normalizedOptions, query]);

    const closeDropdown = () => {
        setOpen(false);
        setQuery("");
    };

    const updatePosition = () => {
        setPosition(getDropdownPosition(rootRef, menuWidth ?? 430));
    };

    const openDropdown = () => {
        if (disabled || loading) return;
        updatePosition();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    const toggleValue = (optionValue: T) => {
        const nextValue = selectedSet.has(optionValue)
            ? value.filter((item) => item !== optionValue)
            : [...value, optionValue];
        onChange(nextValue);
        if (clearSearchOnSelect) setQuery("");
        window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;

        const closeOnOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (
                !rootRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            ) {
                closeDropdown();
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeDropdown();
        };
        const handleViewportChange = () => updatePosition();

        document.addEventListener("mousedown", closeOnOutside);
        document.addEventListener("touchstart", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
            document.removeEventListener("mousedown", closeOnOutside);
            document.removeEventListener("touchstart", closeOnOutside);
            document.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
        };
    }, [open, menuWidth]);

    useEffect(() => {
        if (disabled || loading) closeDropdown();
    }, [disabled, loading]);

    const menu =
        open && mounted && !disabled && !loading
            ? createPortal(
                  <div
                      ref={menuRef}
                      id={listId}
                      className={styles.searchMenu}
                      role="listbox"
                      aria-label={ariaLabel}
                      aria-multiselectable="true"
                      style={createDropdownMenuStyle(position, dropdownZIndex)}
                      dir="rtl"
                  >
                      <div className={styles.searchBox}>
                          <Search size={16} aria-hidden="true" />
                          <input
                              ref={inputRef}
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              placeholder={searchPlaceholder}
                              aria-label={searchPlaceholder}
                          />
                          {query && (
                              <button
                                  type="button"
                                  className={styles.clearButton}
                                  onClick={() => {
                                      setQuery("");
                                      inputRef.current?.focus();
                                  }}
                                  aria-label="پاک‌کردن عبارت جست‌وجو"
                              >
                                  <X size={15} aria-hidden="true" />
                              </button>
                          )}
                      </div>

                      <div className={styles.optionList}>
                          {normalizedOptions.length === 0 ? (
                              <div className={styles.empty}>{emptyText}</div>
                          ) : filteredOptions.length === 0 ? (
                              <div className={styles.empty}>{noResultText}</div>
                          ) : (
                              filteredOptions.map((option) => {
                                  const selected = selectedSet.has(option.value);
                                  return (
                                      <button
                                          key={String(option.value)}
                                          type="button"
                                          role="option"
                                          aria-selected={selected}
                                          className={`${styles.option} ${selected ? styles.optionSelected : ""}`}
                                          disabled={option.disabled}
                                          onClick={() => {
                                              if (!option.disabled) toggleValue(option.value);
                                          }}
                                      >
                                          <span className={styles.optionText}>
                                              <strong>{option.label}</strong>
                                              {option.description && <small>{option.description}</small>}
                                          </span>
                                          <span className={`${styles.multiCheck} ${selected ? styles.multiCheckSelected : ""}`}>
                                              {selected && <Check size={13} aria-hidden="true" />}
                                          </span>
                                      </button>
                                  );
                              })
                          )}
                      </div>
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div ref={rootRef} className={`${styles.root} ${className}`} dir="rtl">
            <div
                className={`${styles.trigger} ${styles.multiTrigger} ${open ? styles.triggerOpen : ""} ${disabled || loading ? styles.multiTriggerDisabled : ""}`}
                role="combobox"
                tabIndex={disabled || loading ? -1 : 0}
                aria-controls={listId}
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => (open ? closeDropdown() : openDropdown())}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        open ? closeDropdown() : openDropdown();
                    }
                }}
            >
                {loading ? (
                    <LoaderCircle size={16} className={styles.spin} aria-hidden="true" />
                ) : (
                    <Search size={16} aria-hidden="true" />
                )}
                <div className={styles.multiValue}>
                    {loading ? (
                        <span className={styles.placeholder}>{loadingText}</span>
                    ) : selectedOptions.length === 0 ? (
                        <span className={styles.placeholder}>{placeholder}</span>
                    ) : (
                        selectedOptions.map((option) => (
                            <span className={styles.multiChip} key={String(option.value)}>
                                <span>{option.label}</span>
                                <button
                                    type="button"
                                    disabled={disabled || loading}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        toggleValue(option.value);
                                    }}
                                    aria-label={`حذف ${option.label}`}
                                >
                                    <X size={12} aria-hidden="true" />
                                </button>
                            </span>
                        ))
                    )}
                </div>
                <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
            </div>
            {menu}
        </div>
    );
}
