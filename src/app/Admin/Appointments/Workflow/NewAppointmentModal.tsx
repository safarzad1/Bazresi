"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableDropdown, type DropdownOption } from "@/component/Dropdown";
import {
  emptyInterview,
  exportA4,
  InterviewEditor,
  ProposalLetterCard,
  type InterviewAnswers,
  type LetterData,
} from "./AppointmentForms";
import styles from "./Workflow.module.css";

type Person = {
  PersonId: number;
  CodeMelli: string;
  FullName: string;
  FatherName: string;
  TarikhTavalod: string | null;
  Shoghl: string | null;
  TelHamrah: string | null;
};
type Post = { PostId: number; PostOnvan: string };
type Context = {
  RequesterFullName: string | null;
  RequesterPostTitle: string | null;
  DestinationFullName: string | null;
  DestinationPostTitle: string | null;
};

export default function NewAppointmentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [context, setContext] = useState<Context | null>(null);
  const [search, setSearch] = useState("");
  const [personId, setPersonId] = useState(0);
  const [postId, setPostId] = useState(0);
  const [reasons, setReasons] = useState([""]);
  const [interview, setInterview] = useState<InterviewAnswers>(emptyInterview);
  const [initialLoading, setInitialLoading] = useState(true);
  const [personSearching, setPersonSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setPersonSearching(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(`/api/appointments/workflow?mode=lookups&search=${encodeURIComponent(search)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json() as { persons?: Person[]; posts?: Post[]; context?: Context | null; message?: string };
        if (!response.ok) throw new Error(data.message || "دریافت اطلاعات انجام نشد.");
        setPersons((data.persons || []).slice(0, 20));
        setPosts(data.posts || []);
        setContext(data.context || null);
      } catch (reason) {
        if ((reason as { name?: string }).name !== "AbortError") {
          setError(reason instanceof Error ? reason.message : "دریافت اطلاعات انجام نشد.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
          setPersonSearching(false);
        }
      }
    })();
    return () => controller.abort();
  }, [search]);

  const person = selectedPerson || persons.find((item) => item.PersonId === personId) || null;
  const post = posts.find((item) => item.PostId === postId) || null;
  const cleanReasons = reasons.map((item) => item.trim()).filter(Boolean);

  const personOptions = useMemo<DropdownOption<number>[]>(() => {
    const source = selectedPerson && !persons.some((item) => item.PersonId === selectedPerson.PersonId)
      ? [selectedPerson, ...persons]
      : persons;
    return source.map((item) => ({
      value: item.PersonId,
      label: item.FullName,
      description: `کد ملی: ${item.CodeMelli || "—"}`,
      searchText: `${item.FullName} ${item.CodeMelli}`,
    }));
  }, [persons, selectedPerson]);

  const postOptions = useMemo<DropdownOption<number>[]>(() => posts.map((item) => ({
    value: item.PostId,
    label: item.PostOnvan,
  })), [posts]);

  const data: LetterData = {
    fullName: person?.FullName || "",
    fatherName: person?.FatherName || "",
    codeMelli: person?.CodeMelli || "",
    birthDate: person?.TarikhTavalod || "",
    postTitle: post?.PostOnvan || "",
    requesterName: context?.RequesterFullName || "",
    requesterPost: context?.RequesterPostTitle || "",
    recipientName: context?.DestinationFullName || "",
    recipientPost: context?.DestinationPostTitle || "",
    reasons: cleanReasons,
  };

  const submit = async () => {
    if (!person || !post) { setError("شخص و پست پیشنهادی را انتخاب کنید."); return; }
    if (!cleanReasons.length) { setError("حداقل یک دلیل وارد کنید."); return; }
    if (!interview.result) { setError("جمع‌بندی مصاحبه اولیه را انتخاب کنید."); return; }
    setSaving(true); setError("");
    try {
      const image = await exportA4("appointment-proposal-letter-new", `appointment-proposal-${person.CodeMelli}.png`);
      if (!image) throw new Error("تولید تصویر نامه انجام نشد.");
      const form = new FormData();
      form.append("personId", String(person.PersonId));
      form.append("postId", String(post.PostId));
      form.append("reasons", JSON.stringify(cleanReasons));
      form.append("initialInterview", JSON.stringify(interview));
      form.append("proposalImage", image);
      const response = await fetch("/api/appointments/workflow", { method: "POST", body: form });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(result.message || "ثبت درخواست انجام نشد.");
      onSaved(); onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت درخواست انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  return <div className={styles.fullModal} dir="rtl">
    <header className={styles.modalHeader}><div><span>انتصابات / درخواست جدید</span><h2>پیشنهاد انتصاب جدید</h2></div><button type="button" onClick={onClose} disabled={saving}>×</button></header>
    <div className={styles.newModalBody}>
      <aside className={styles.formPanel}>
        <div className={styles.panelScroll}>
          <section className={styles.formSection}>
            <h3>انتخاب فرد و مسئولیت</h3>
            <label>فرد پیشنهادی
              <SearchableDropdown<number>
                value={personId || null}
                options={personOptions}
                onChange={(value) => {
                  setPersonId(value);
                  setSelectedPerson(persons.find((item) => item.PersonId === value) || selectedPerson);
                }}
                onClear={() => { setPersonId(0); setSelectedPerson(null); }}
                onSearchChange={setSearch}
                searchDelayMs={300}
                searching={personSearching && !initialLoading}
                loading={initialLoading}
                loadingText="در حال دریافت اشخاص..."
                placeholder="انتخاب فرد"
                searchPlaceholder="نام، نام خانوادگی یا کد ملی..."
                emptyText="شخصی برای نمایش وجود ندارد."
                noResultText="شخصی با این نام یا کد ملی پیدا نشد."
                clearAriaLabel="پاک‌کردن فرد انتخاب‌شده"
                compact
                className={styles.workflowDropdown}
                menuClassName={styles.workflowDropdownMenu}
                menuWidth={430}
              />
              <small className={styles.lookupHint}>در هر جست‌وجو حداکثر ۲۰ نتیجه نمایش داده می‌شود.</small>
            </label>
            <label>پست پیشنهادی
              <SearchableDropdown<number>
                value={postId || null}
                options={postOptions}
                onChange={setPostId}
                onClear={() => setPostId(0)}
                placeholder="انتخاب پست خالی"
                searchPlaceholder="جست‌وجوی عنوان پست..."
                emptyText="پست خالی در محدوده دسترسی وجود ندارد."
                noResultText="پستی با این عنوان پیدا نشد."
                clearAriaLabel="پاک‌کردن پست انتخاب‌شده"
                compact
                className={styles.workflowDropdown}
                menuClassName={styles.workflowDropdownMenu}
                menuWidth={430}
              />
            </label>
            {person ? <div className={styles.personSummary}><strong>{person.FullName}</strong><span>کد ملی: {person.CodeMelli}</span><span>شغل: {person.Shoghl || "—"}</span><span>تلفن: {person.TelHamrah || "—"}</span></div> : null}
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionTitle}><h3>دلایل پیشنهاد</h3>{reasons.length < 10 ? <button type="button" onClick={() => setReasons((current) => [...current, ""])}>+ افزودن</button> : null}</div>
            {reasons.map((item, index) => <div className={styles.reasonInput} key={index}><span>{(index + 1).toLocaleString("fa-IR")}</span><textarea value={item} onChange={(event) => setReasons((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value.slice(0, 1000) : value))} placeholder="دلیل و ویژگی فرد پیشنهادی..." /><button type="button" onClick={() => setReasons((current) => current.length === 1 ? [""] : current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}
          </section>
          <InterviewEditor value={interview} onChange={setInterview} title="مصاحبه اولیه" />
        </div>
        <footer className={styles.panelFooter}>{error ? <span className={styles.inlineError}>{error}</span> : null}<button type="button" className={styles.secondaryButton} onClick={onClose}>بستن</button><button type="button" className={styles.primaryButton} onClick={() => void submit()} disabled={saving}>{saving ? "در حال ثبت..." : "ثبت و ارسال پیشنهاد"}</button></footer>
      </aside>
      <main className={styles.previewPanel}><span className={styles.previewLabel}>پیش‌نمایش نامه A4</span><div className={styles.paperStage}><ProposalLetterCard id="appointment-proposal-letter-new" data={data} /></div></main>
    </div>
  </div>;
}
