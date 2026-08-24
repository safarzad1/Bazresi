"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

import styles from "./SearchableExpenseTypeDropdown.module.css";

export type SearchableExpenseTypeOption = {
  id: number;
  title: string;
};

type Props = {
  value: number;
  options: SearchableExpenseTypeOption[];
  onChange: (value: number) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  allLabel?: string;
  placeholder?: string;
  showAllOption?: boolean;
  showSelectedHint?: boolean;
  compact?: boolean;
  onOpen?: () => void;
  dropdownZIndex?: number;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("fa-IR")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SearchableExpenseTypeDropdown({
  value,
  options,
  onChange,
  loading = false,
  disabled = false,
  label = "نوع هزینه",
  allLabel = "همه نوع‌های هزینه",
  placeholder = "جست‌وجوی نوع هزینه...",
  showAllOption = true,
  showSelectedHint = true,
  compact = false,
  onOpen,
  dropdownZIndex = 2147483647,
}: Props) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = `expense-type-search-${generatedId}`;
  const listId = `expense-type-options-${generatedId}`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 300,
    maxHeight: 290,
  });

  const normalizedOptions = useMemo(() => {
    const byId = new Map<number, SearchableExpenseTypeOption>();

    for (const option of options) {
      const id = Number(option.id);
      const title = String(option.title ?? "").trim();
      if (!Number.isFinite(id) || id <= 0 || !title) continue;
      byId.set(id, { id, title });
    }

    return Array.from(byId.values()).sort((first, second) =>
      first.title.localeCompare(second.title, "fa"),
    );
  }, [options]);

  const selectedTitle = useMemo(() => {
    if (value <= 0) return "";
    return normalizedOptions.find((option) => option.id === value)?.title ?? "";
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      normalizeSearchValue(option.title).includes(normalizedQuery),
    );
  }, [normalizedOptions, query]);

  const updateDropdownPosition = () => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const rect = root.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const horizontalMargin = 12;
    const verticalGap = 7;
    const desiredWidth = Math.max(rect.width, Math.min(390, viewportWidth - 24));
    const width = Math.min(desiredWidth, viewportWidth - horizontalMargin * 2);
    const left = Math.min(
      Math.max(horizontalMargin, rect.right - width),
      viewportWidth - width - horizontalMargin,
    );
    const spaceBelow = viewportHeight - rect.bottom - verticalGap - 10;
    const spaceAbove = rect.top - verticalGap - 10;
    const openAbove = spaceBelow < 190 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(120, openAbove ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(310, availableHeight);
    const top = openAbove
      ? Math.max(10, rect.top - maxHeight - verticalGap)
      : Math.min(viewportHeight - 10, rect.bottom + verticalGap);

    setDropdownPosition({ top, left, width, maxHeight });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();
    const handleViewportChange = () => updateDropdownPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  const openDropdown = () => {
    if (disabled || loading) return;
    onOpen?.();
    updateDropdownPosition();
    setOpen(true);
  };

  const selectValue = (nextValue: number) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  const clearSelection = () => {
    if (query) {
      setQuery("");
      setOpen(true);
      searchInputRef.current?.focus();
      return;
    }

    if (showAllOption && value > 0) onChange(0);
    setQuery("");
    setOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      event.currentTarget.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openDropdown();
    }

    if (event.key === "Enter" && open && filteredOptions.length === 1) {
      event.preventDefault();
      selectValue(filteredOptions[0].id);
    }
  };

  const inputValue = open ? query : selectedTitle;
  const dropdownStyle: CSSProperties = {
    top: dropdownPosition.top,
    left: dropdownPosition.left,
    width: dropdownPosition.width,
    maxHeight: dropdownPosition.maxHeight,
    fontFamily:
      '"Shabnam", Arial, Helvetica, sans-serif',
    fontWeight: 400,
    zIndex: dropdownZIndex,
  };

  const dropdown =
    open && mounted && !disabled && !loading
      ? createPortal(
          <div
            ref={dropdownRef}
            id={listId}
            className={styles.dropdown}
            role="listbox"
            aria-label={label}
            style={dropdownStyle}
            dir="rtl"
          >
            {showAllOption && (
              <button
                type="button"
                role="option"
                aria-selected={value === 0}
                className={`${styles.option} ${
                  value === 0 ? styles.selected : ""
                }`}
                onClick={() => selectValue(0)}
              >
                <span>{allLabel}</span>
                {value === 0 && <Check size={15} aria-hidden="true" />}
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={value === option.id}
                key={option.id}
                className={`${styles.option} ${
                  value === option.id ? styles.selected : ""
                }`}
                onClick={() => selectValue(option.id)}
              >
                <span>{option.title}</span>
                {value === option.id && <Check size={15} aria-hidden="true" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className={styles.empty}>موردی با این عنوان پیدا نشد.</div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${compact ? styles.compact : ""}`}
      dir="rtl"
    >
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className={`${styles.combobox} ${open ? styles.comboboxOpen : ""}`}>
        <Search size={16} aria-hidden="true" className={styles.searchIcon} />
        <input
          id={inputId}
          ref={searchInputRef}
          className={styles.searchInput}
          value={inputValue}
          onFocus={() => {
            setQuery("");
            openDropdown();
          }}
          onClick={openDropdown}
          onChange={(event) => {
            setQuery(event.target.value);
            openDropdown();
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={
            loading ? "در حال دریافت نوع هزینه..." : placeholder
          }
          disabled={disabled || loading}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
        />

        {(query || (showAllOption && value > 0)) && !disabled && !loading ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearSelection}
            title="پاک‌کردن نوع هزینه"
            aria-label="پاک‌کردن نوع هزینه"
          >
            <X size={15} />
          </button>
        ) : (
          <button
            type="button"
            className={styles.chevronButton}
            onClick={() => {
              if (open) {
                setOpen(false);
                setQuery("");
              } else {
                openDropdown();
                window.setTimeout(() => searchInputRef.current?.focus(), 0);
              }
            }}
            disabled={disabled || loading}
            aria-label={open ? "بستن فهرست" : "بازکردن فهرست"}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {showSelectedHint && value > 0 && selectedTitle && !open && (
        <div className={styles.selectedHint}>انتخاب‌شده: {selectedTitle}</div>
      )}

      {dropdown}
    </div>
  );
}
