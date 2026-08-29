"use client";

import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import {
    Check,
    ChevronDown,
    LoaderCircle,
    Search,
    X,
} from "lucide-react";

import styles from "./Dropdown.module.css";
import type { CommonDropdownProps, DropdownValue } from "./types";
import {
    createDropdownMenuStyle,
    getDropdownPosition,
    normalizeDropdownSearch,
    type DropdownPosition,
} from "./dropdownUtils";

export type SearchableDropdownProps<T extends DropdownValue = string> =
    CommonDropdownProps<T> & {
        searchPlaceholder?: string;
        noResultText?: string;
        menuWidth?: number;
        menuClassName?: string;
        onSearchChange?: (query: string) => void;
        searchDelayMs?: number;
        searching?: boolean;
        onClear?: () => void;
        clearAriaLabel?: string;
    };

export default function SearchableDropdown<
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
    compact = false,
    className = "",
    ariaLabel = "جست‌وجو و انتخاب گزینه",
    leadingIcon,
    dropdownZIndex = 2147483000,
    menuWidth,
    menuClassName = "",
    onSearchChange,
    searchDelayMs = 300,
    searching = false,
    onClear,
    clearAriaLabel = "پاک‌کردن انتخاب",
}: SearchableDropdownProps<T>) {
    const generatedId = useId().replace(/:/g, "");
    const listId = `searchable-dropdown-list-${generatedId}`;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [waitingForSearch, setWaitingForSearch] = useState(false);
    const [position, setPosition] = useState<DropdownPosition>({
        top: 0,
        left: 0,
        width: 300,
        maxHeight: 310,
    });

    const normalizedOptions = useMemo(() => {
        const unique = new Map<T, (typeof options)[number]>();
        for (const option of options) unique.set(option.value, option);
        return Array.from(unique.values());
    }, [options]);

    const selectedOption = useMemo(
        () => normalizedOptions.find((option) => option.value === value),
        [normalizedOptions, value],
    );
    const canClear = Boolean(
        onClear && value !== "" && value !== null && value !== undefined,
    );

    const filteredOptions = useMemo(() => {
        // Remote search results are already filtered by the stored procedure.
        // Filtering them again in the browser can hide valid Persian matches.
        if (onSearchChange) return normalizedOptions;

        const normalizedQuery = normalizeDropdownSearch(query);
        if (!normalizedQuery) return normalizedOptions;

        return normalizedOptions.filter((option) =>
            normalizeDropdownSearch(
                `${option.label} ${option.description ?? ""} ${
                    option.searchText ?? ""
                }`,
            ).includes(normalizedQuery),
        );
    }, [normalizedOptions, onSearchChange, query]);

    const updatePosition = () => {
        setPosition(getDropdownPosition(rootRef, menuWidth ?? 390));
    };

    const closeDropdown = () => {
        setOpen(false);
        setQuery("");
        setWaitingForSearch(false);
    };

    const openDropdown = () => {
        if (disabled || loading) return;
        updatePosition();
        setOpen(true);
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

    useEffect(() => {
        if (!open || !onSearchChange) return;

        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            onSearchChange("");
            return;
        }

        const timer = window.setTimeout(
            () => {
                setWaitingForSearch(false);
                onSearchChange(normalizedQuery);
            },
            Math.max(0, searchDelayMs),
        );

        return () => window.clearTimeout(timer);
    }, [onSearchChange, open, query, searchDelayMs]);

    const menu =
        open && mounted && !disabled && !loading
            ? createPortal(
                  <div
                      ref={menuRef}
                      id={listId}
                      className={`${styles.searchMenu} ${menuClassName}`}
                      role="listbox"
                      aria-label={ariaLabel}
                      style={createDropdownMenuStyle(
                          position,
                          dropdownZIndex,
                      )}
                      dir="rtl"
                  >
                      <div className={styles.searchBox}>
                          {searching || waitingForSearch ? (
                              <LoaderCircle
                                  size={16}
                                  className={styles.spin}
                                  aria-hidden="true"
                              />
                          ) : (
                              <Search size={16} aria-hidden="true" />
                          )}
                          <input
                              ref={inputRef}
                              value={query}
                              onChange={(event) => {
                                  const nextQuery = event.target.value;
                                  setQuery(nextQuery);
                                  setWaitingForSearch(
                                      Boolean(onSearchChange && nextQuery.trim()),
                                  );
                              }}
                              placeholder={searchPlaceholder}
                              aria-label={searchPlaceholder}
                          />
                          {query && (
                              <button
                                  type="button"
                                  className={styles.clearButton}
                                  onClick={() => {
                                      setQuery("");
                                      setWaitingForSearch(false);
                                      inputRef.current?.focus();
                                  }}
                                  aria-label="پاک‌کردن عبارت جست‌وجو"
                              >
                                  <X size={15} aria-hidden="true" />
                              </button>
                          )}
                      </div>

                      <div className={styles.optionList}>
                          {waitingForSearch ? (
                              <div className={styles.empty}>
                                  پس از توقف کوتاه تایپ جست‌وجو می‌شود...
                              </div>
                          ) : searching ? (
                              <div className={styles.empty}>در حال جست‌وجو...</div>
                          ) : normalizedOptions.length === 0 ? (
                              <div className={styles.empty}>{emptyText}</div>
                          ) : filteredOptions.length === 0 ? (
                              <div className={styles.empty}>{noResultText}</div>
                          ) : (
                              filteredOptions.map((option) => {
                                  const selected = option.value === value;
                                  return (
                                      <button
                                          key={String(option.value)}
                                          type="button"
                                          role="option"
                                          aria-selected={selected}
                                          className={`${styles.option} ${
                                              selected
                                                  ? styles.optionSelected
                                                  : ""
                                          }`}
                                          disabled={option.disabled}
                                          onClick={() => {
                                              if (option.disabled) return;
                                              onChange(option.value);
                                              closeDropdown();
                                          }}
                                      >
                                          <span className={styles.optionText}>
                                              <strong>{option.label}</strong>
                                              {option.description && (
                                                  <small>
                                                      {option.description}
                                                  </small>
                                              )}
                                          </span>
                                          {selected && (
                                              <Check
                                                  size={15}
                                                  aria-hidden="true"
                                              />
                                          )}
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
        <div
            ref={rootRef}
            className={`${styles.root} ${compact ? styles.compact : ""} ${className}`}
            dir="rtl"
        >
            <button
                type="button"
                className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${canClear ? styles.triggerWithClear : ""}`}
                onClick={() => (open ? closeDropdown() : openDropdown())}
                disabled={disabled || loading}
                aria-haspopup="listbox"
                aria-controls={listId}
                aria-expanded={open}
                aria-label={ariaLabel}
            >
                {loading ? (
                    <LoaderCircle
                        size={16}
                        className={styles.spin}
                        aria-hidden="true"
                    />
                ) : (
                    leadingIcon ?? <Search size={16} aria-hidden="true" />
                )}
                <span
                    className={`${styles.triggerText} ${
                        selectedOption ? "" : styles.placeholder
                    }`}
                >
                    {loading
                        ? loadingText
                        : selectedOption?.label ?? placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={styles.chevron}
                    aria-hidden="true"
                />
            </button>
            {canClear && !disabled && !loading && (
                <button
                    type="button"
                    className={styles.triggerClear}
                    onClick={(event) => {
                        event.stopPropagation();
                        closeDropdown();
                        onClear?.();
                    }}
                    aria-label={clearAriaLabel}
                    title={clearAriaLabel}
                >
                    <X size={15} aria-hidden="true" />
                </button>
            )}
            {menu}
        </div>
    );
}
