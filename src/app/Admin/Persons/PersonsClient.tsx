"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SearchableDropdown } from "@/component/Dropdown";
import InputPersianDate from "@/component/InputPersianDatePicker";
import { PERSON_DFN_PID } from "@/lib/person-dfn";
import styles from "./Persons.module.css";

type PersonRow = {
  PersonId: number;
  CodeMelli: string;
  FirstName: string;
  LastName: string;
  FatherName: string;
  JensiatName: string;
  Shoghl: string;
  TelHamrah: string | null;
  ImagePath: string | null;
  RegistrationState: number;
  CreateDateTime: string | null;
  FinalizedDateTime: string | null;
};

type PersonRecord = PersonRow & {
  CodeMelliSarparast: string | null;
  Nesbat: number | null;
  TarikhTavalod: string | null;
  ShomareShenasnameh: string;
  Life: number;
  TarikhFoat: string | null;
  MahalTavalod: number | null;
  MahalSodor: number | null;
  Serial_Harf: string | null;
  Serial_Seri: string | null;
  Serial_Code: string | null;
  Almosana: number;
  FirstNameOld: string | null;
  LastNameOld: string | null;
  TaghyiratShenasnamehSet: number;
  TaghyiratShenasnameh: string | null;
  Jensiat: number;
  Taahol: number;
  DinMazhab: number;
  Rohani: number;
  NezamVazifeh: number;
  TarikhShoro: string | null;
  TarikhPayan: string | null;
  NoeMoaafiat: number | null;
  TarikhMoaafiat: string | null;
  SharhMoaafiat: string | null;
  Email: string | null;
  TelZaruri: string | null;
};

type Definition = { GroupCode: number; Id: number; Title: string };
type City = { Id: number; Title: string };

type PersonForm = {
  personId: number;
  registrationState: number;
  imagePath: string;
  codeMelli: string;
  codeMelliSarparast: string;
  nesbat: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  tarikhTavalod: string;
  shomareShenasnameh: string;
  life: string;
  tarikhFoat: string;
  mahalTavalod: string;
  mahalSodor: string;
  serialHarf: string;
  serialSeri: string;
  serialCode: string;
  almosana: string;
  firstNameOld: string;
  lastNameOld: string;
  taghyiratShenasnamehSet: string;
  taghyiratShenasnameh: string;
  jensiat: string;
  shoghl: string;
  taahol: string;
  dinMazhab: string;
  rohani: string;
  nezamVazifeh: string;
  tarikhShoro: string;
  tarikhPayan: string;
  noeMoaafiat: string;
  tarikhMoaafiat: string;
  sharhMoaafiat: string;
  email: string;
  telHamrah: string;
  telZaruri: string;
};

const emptyForm: PersonForm = {
  personId: 0,
  registrationState: 0,
  imagePath: "",
  codeMelli: "",
  codeMelliSarparast: "",
  nesbat: "",
  firstName: "",
  lastName: "",
  fatherName: "",
  tarikhTavalod: "",
  shomareShenasnameh: "",
  life: "",
  tarikhFoat: "",
  mahalTavalod: "",
  mahalSodor: "",
  serialHarf: "",
  serialSeri: "",
  serialCode: "",
  almosana: "",
  firstNameOld: "",
  lastNameOld: "",
  taghyiratShenasnamehSet: "",
  taghyiratShenasnameh: "",
  jensiat: "",
  shoghl: "",
  taahol: "",
  dinMazhab: "",
  rohani: "",
  nezamVazifeh: "",
  tarikhShoro: "",
  tarikhPayan: "",
  noeMoaafiat: "",
  tarikhMoaafiat: "",
  sharhMoaafiat: "",
  email: "",
  telHamrah: "",
  telZaruri: "",
};

const steps = [
  { title: "اطلاعات هویتی", subtitle: "مشخصات اصلی و شناسنامه" },
  { title: "جزئیات شناسنامه", subtitle: "محل، سریال و تغییرات" },
  { title: "اطلاعات تکمیلی", subtitle: "شغل، وضعیت و تماس" },
  { title: "تصویر و بازبینی", subtitle: "مرور نهایی اطلاعات" },
];

type IconName =
  | "persons" | "plus" | "search" | "refresh" | "edit" | "trash"
  | "close" | "next" | "back" | "save" | "check" | "upload"
  | "warning" | "file" | "draft" | "camera";

function Icon({ name }: { name: IconName }) {
  const paths = {
    persons: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1.4A6.6 6.6 0 0 1 11.6 12h.8a6.6 6.6 0 0 1 6.6 6.6V20M4 4h3M4 7h2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M18.5 16a8 8 0 1 1 1.2-7.8L20 12" /></>,
    edit: <><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" /><path d="m14.8 6.8 2.8 2.8" /></>,
    trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    next: <path d="m15 6-6 6 6 6" />,
    back: <path d="m9 6 6 6-6 6" />,
    save: <><path d="M5 4h12l2 2v14H5V4Z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
    file: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
    draft: <><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6" /></>,
    camera: <><path d="M4 8h4l1.5-2h5L16 8h4v11H4V8Z" /><circle cx="12" cy="13" r="3" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function fromRecord(person: PersonRecord): PersonForm {
  const value = (item: number | string | null | undefined) => item === null || item === undefined ? "" : String(item);
  return {
    personId: Number(person.PersonId),
    registrationState: Number(person.RegistrationState),
    imagePath: person.ImagePath ?? "",
    codeMelli: person.CodeMelli ?? "",
    codeMelliSarparast: person.CodeMelliSarparast ?? "",
    nesbat: value(person.Nesbat),
    firstName: person.FirstName ?? "",
    lastName: person.LastName ?? "",
    fatherName: person.FatherName ?? "",
    tarikhTavalod: person.TarikhTavalod ?? "",
    shomareShenasnameh: person.ShomareShenasnameh ?? "",
    life: value(person.Life || null),
    tarikhFoat: person.TarikhFoat ?? "",
    mahalTavalod: value(person.MahalTavalod),
    mahalSodor: value(person.MahalSodor),
    serialHarf: person.Serial_Harf ?? "",
    serialSeri: person.Serial_Seri ?? "",
    serialCode: person.Serial_Code ?? "",
    almosana: value(person.Almosana || null),
    firstNameOld: person.FirstNameOld ?? "",
    lastNameOld: person.LastNameOld ?? "",
    taghyiratShenasnamehSet: value(person.TaghyiratShenasnamehSet || null),
    taghyiratShenasnameh: person.TaghyiratShenasnameh ?? "",
    jensiat: value(person.Jensiat || null),
    shoghl: person.Shoghl ?? "",
    taahol: value(person.Taahol || null),
    dinMazhab: value(person.DinMazhab || null),
    rohani: value(person.Rohani || null),
    nezamVazifeh: value(person.NezamVazifeh || null),
    tarikhShoro: person.TarikhShoro ?? "",
    tarikhPayan: person.TarikhPayan ?? "",
    noeMoaafiat: value(person.NoeMoaafiat),
    tarikhMoaafiat: person.TarikhMoaafiat ?? "",
    sharhMoaafiat: person.SharhMoaafiat ?? "",
    email: person.Email ?? "",
    telHamrah: person.TelHamrah ?? "",
    telZaruri: person.TelZaruri ?? "",
  };
}

function isStoredImageFile(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(value));
}

async function readJson(response: Response) {
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown> & { message?: string };
  if (!response.ok) throw new Error(data.message || "ارتباط با سرور برقرار نشد.");
  return data;
}

function TextField({
  label, value, onChange, placeholder, required, type = "text", maxLength, hint,
}: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
  required?: boolean; type?: string; maxLength?: number; hint?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}{required && <i>*</i>}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return (
    <label className={`${styles.field} ${styles.wideField}`}>
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} />
    </label>
  );
}

function ConfirmDialog({
  tone, title, text, confirmText, busy, onCancel, onConfirm,
}: {
  tone: "success" | "danger"; title: string; text: string; confirmText: string;
  busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className={styles.confirmBackdrop} role="presentation">
      <section className={`${styles.confirmDialog} ${tone === "danger" ? styles.confirmDanger : styles.confirmSuccess}`} role="alertdialog" aria-modal="true" aria-label={title}>
        <span className={styles.confirmIcon}><Icon name={tone === "danger" ? "warning" : "check"} /></span>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={busy}>انصراف</button>
          <button type="button" className={tone === "danger" ? styles.dangerButton : styles.finalButton} onClick={onConfirm} disabled={busy}>
            {busy ? <span className={styles.buttonSpinner} /> : <Icon name={tone === "danger" ? "trash" : "check"} />}
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function PersonsClient() {
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PersonForm>(emptyForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [finalConfirm, setFinalConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonRow | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const definitionOptions = useCallback((groupCode: number) => [
    { value: "", label: "انتخاب نشده" },
    ...definitions.filter((item) => item.GroupCode === groupCode).map((item) => ({ value: String(item.Id), label: item.Title })),
  ], [definitions]);
  const cityOptions = useMemo(() => [
    { value: "", label: "انتخاب نشده" },
    ...cities.map((item) => ({ value: String(item.Id), label: item.Title })),
  ], [cities]);

  const loadPersons = useCallback(async (query: string, state: string, requestedPage: number, requestedSize: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(requestedPage), pageSize: String(requestedSize) });
      if (query.trim()) params.set("search", query.trim());
      if (state !== "all") params.set("state", state);
      const data = await readJson(await fetch(`/api/persons?${params}`, { cache: "no-store" }));
      setPersons((data.persons as PersonRow[] | undefined) ?? []);
      setTotalCount(Number(data.totalCount ?? 0));
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اشخاص انجام نشد." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/persons?mode=lookups", { cache: "no-store" })
      .then(readJson)
      .then((data) => {
        setDefinitions((data.definitions as Definition[] | undefined) ?? []);
        setCities((data.cities as City[] | undefined) ?? []);
      })
      .catch((error: Error) => setNotice({ type: "error", text: error.message }));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPersons(search, stateFilter, page, pageSize), 350);
    return () => window.clearTimeout(timer);
  }, [loadPersons, page, pageSize, search, stateFilter]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function change<K extends keyof PersonForm>(key: K, value: PersonForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setForm(emptyForm);
    setStep(0);
    setSelectedImage(null);
    setPreviewUrl("");
    setWizardOpen(true);
  }

  async function openPerson(person: PersonRow) {
    setWizardOpen(true);
    setLoadingDetail(true);
    setStep(0);
    setSelectedImage(null);
    setPreviewUrl("");
    try {
      const data = await readJson(await fetch(`/api/persons?personId=${person.PersonId}`, { cache: "no-store" }));
      const record = data.person as PersonRecord | undefined;
      if (!record) throw new Error("اطلاعات شخص دریافت نشد.");
      setForm(fromRecord(record));
    } catch (error) {
      setWizardOpen(false);
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات انجام نشد." });
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeWizard() {
    if (saving) return;
    setWizardOpen(false);
    setFinalConfirm(false);
    setSelectedImage(null);
    setPreviewUrl("");
  }

  function bodyFromForm(personId = form.personId) {
    return {
      ...form,
      personId,
      imagePath: undefined,
      registrationState: undefined,
    };
  }

  async function saveDraft(showNotice = true) {
    if (form.registrationState === 1) return form.personId;
    const data = await readJson(await fetch("/api/persons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyFromForm()),
    }));
    const saved = data.person as { PersonId?: number } | undefined;
    const personId = Number(saved?.PersonId ?? form.personId);
    if (!personId) throw new Error("شناسه پیش‌نویس دریافت نشد.");
    setForm((current) => ({ ...current, personId }));
    if (showNotice) setNotice({ type: "success", text: data.message as string || "پیش‌نویس ذخیره شد." });
    return personId;
  }

  function stepError(currentStep: number) {
    if (currentStep === 0) {
      if (!/^\d{10}$/.test(form.codeMelli)) return "کد ملی را به‌صورت ۱۰ رقمی وارد کنید.";
      if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2 || form.fatherName.trim().length < 2) return "نام، نام خانوادگی و نام پدر را کامل وارد کنید.";
      if (!form.shomareShenasnameh.trim()) return "شماره شناسنامه را وارد کنید.";
      if (!form.life || !form.jensiat) return "وضعیت حیات و جنسیت را انتخاب کنید.";
    }
    if (currentStep === 2) {
      if (form.shoghl.trim().length < 2) return "شغل را وارد کنید.";
      if (!form.taahol || !form.dinMazhab || !form.rohani || !form.nezamVazifeh) return "وضعیت‌های تأهل، دین و مذهب، روحانیت و نظام وظیفه را انتخاب کنید.";
      if (form.telHamrah && !/^09\d{9}$/.test(form.telHamrah)) return "شماره همراه معتبر نیست.";
    }
    return "";
  }

  async function nextStep() {
    const error = stepError(step);
    if (error) {
      setNotice({ type: "error", text: error });
      return;
    }
    setSaving(true);
    try {
      if (step === 2 && form.registrationState === 0) await saveDraft(false);
      setStep((current) => Math.min(3, current + 1));
    } catch (errorValue) {
      setNotice({ type: "error", text: errorValue instanceof Error ? errorValue.message : "ذخیره پیش‌نویس انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDraftSave() {
    if (saving) return;
    setSaving(true);
    try {
      const personId = await saveDraft(false);
      await uploadSelectedImage(personId);
      setNotice({ type: "success", text: "پیش‌نویس و تصویر انتخاب‌شده ذخیره شدند." });
      await loadPersons(search, stateFilter, page, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره پیش‌نویس انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setNotice({ type: "error", text: "حجم تصویر باید حداکثر ۴ مگابایت باشد." });
      event.target.value = "";
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadSelectedImage(personId: number) {
    if (!selectedImage) return form.imagePath;
    const upload = new FormData();
    upload.append("personId", String(personId));
    upload.append("file", selectedImage);
    const data = await readJson(await fetch("/api/persons/image", { method: "POST", body: upload }));
    const fileName = String(data.fileName ?? "");
    setForm((current) => ({ ...current, imagePath: fileName }));
    setSelectedImage(null);
    setPreviewUrl(String(data.imageUrl ?? ""));
    return fileName;
  }

  function requestFinalConfirmation() {
    const error = stepError(0) || stepError(2);
    if (error) {
      setNotice({ type: "error", text: error });
      return;
    }
    setFinalConfirm(true);
  }

  async function finalizePerson() {
    if (saving) return;
    setSaving(true);
    try {
      let personId = form.personId;
      if (!personId) personId = await saveDraft(false);
      await uploadSelectedImage(personId);
      const data = await readJson(await fetch("/api/persons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyFromForm(personId)),
      }));
      setFinalConfirm(false);
      setWizardOpen(false);
      setNotice({ type: "success", text: data.message as string || "ثبت نهایی انجام شد." });
      setPage(1);
      await loadPersons(search, stateFilter, 1, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ثبت نهایی انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || saving) return;
    setSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: deleteTarget.PersonId }),
      }));
      setDeleteTarget(null);
      setNotice({ type: "success", text: data.message as string || "شخص حذف شد." });
      const nextPage = persons.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await loadPersons(search, stateFilter, nextPage, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  const lookupTitle = useCallback((group: number, value: string) => {
    if (!value) return "—";
    return definitions.find((item) => item.GroupCode === group && String(item.Id) === value)?.Title ?? value;
  }, [definitions]);
  const cityTitle = useCallback((value: string) => {
    if (!value) return "—";
    return cities.find((item) => String(item.Id) === value)?.Title ?? value;
  }, [cities]);

  const reviewRows = useMemo(() => [
    ["نام و نام خانوادگی", `${form.firstName} ${form.lastName}`.trim() || "—"],
    ["نام پدر", form.fatherName || "—"],
    ["کد ملی", form.codeMelli || "—"],
    ["شماره شناسنامه", form.shomareShenasnameh || "—"],
    ["تاریخ تولد", form.tarikhTavalod || "—"],
    ["جنسیت", lookupTitle(PERSON_DFN_PID.gender, form.jensiat)],
    ["وضعیت حیات", lookupTitle(PERSON_DFN_PID.life, form.life)],
    ["تاریخ فوت", form.tarikhFoat || "—"],
    ["کد ملی سرپرست", form.codeMelliSarparast || "—"],
    ["نسبت", lookupTitle(PERSON_DFN_PID.relation, form.nesbat)],
    ["محل تولد", cityTitle(form.mahalTavalod)],
    ["محل صدور", cityTitle(form.mahalSodor)],
    ["سریال شناسنامه", [form.serialHarf, form.serialSeri, form.serialCode].filter(Boolean).join(" - ") || "—"],
    ["المثنی", lookupTitle(PERSON_DFN_PID.yesNo, form.almosana)],
    ["نام و نام خانوادگی قبلی", `${form.firstNameOld} ${form.lastNameOld}`.trim() || "—"],
    ["دارای تغییرات شناسنامه", lookupTitle(PERSON_DFN_PID.yesNo, form.taghyiratShenasnamehSet)],
    ["شرح تغییرات شناسنامه", form.taghyiratShenasnameh || "—"],
    ["شغل", form.shoghl || "—"],
    ["وضعیت تأهل", lookupTitle(PERSON_DFN_PID.maritalStatus, form.taahol)],
    ["دین و مذهب", lookupTitle(PERSON_DFN_PID.religionSect, form.dinMazhab)],
    ["روحانی", lookupTitle(PERSON_DFN_PID.clergyStatus, form.rohani)],
    ["نظام وظیفه", lookupTitle(PERSON_DFN_PID.militaryStatus, form.nezamVazifeh)],
    ["شروع و پایان خدمت", [form.tarikhShoro, form.tarikhPayan].filter(Boolean).join(" تا ") || "—"],
    ["نوع معافیت", lookupTitle(PERSON_DFN_PID.exemptionType, form.noeMoaafiat)],
    ["تاریخ معافیت", form.tarikhMoaafiat || "—"],
    ["شرح معافیت", form.sharhMoaafiat || "—"],
    ["شماره همراه", form.telHamrah || "—"],
    ["تماس ضروری", form.telZaruri || "—"],
    ["ایمیل", form.email || "—"],
    ["تصویر پرسنلی", selectedImage || form.imagePath ? "انتخاب شده" : "—"],
  ], [cityTitle, form, lookupTitle, selectedImage]);

  const firstRow = totalCount ? (page - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(page * pageSize, totalCount);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4)) + index,
  );
  const shownImage = previewUrl || (isStoredImageFile(form.imagePath) ? `/api/persons/image?file=${encodeURIComponent(form.imagePath)}` : "");

  return (
    <main className={styles.page} dir="rtl">
      {notice && <div className={`${styles.notice} ${styles[notice.type]}`}>{notice.text}</div>}

      <section className={styles.pageHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><Icon name="persons" /></span>
          <div><span>مدیریت اطلاعات پرسنلی</span><h1>فهرست اشخاص</h1><p>ثبت و تکمیل مرحله‌ای اطلاعات هویتی و پرسنلی</p></div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} type="button" onClick={() => void loadPersons(search, stateFilter, page, pageSize)} disabled={loading}><Icon name="refresh" />به‌روزرسانی</button>
          <button className={styles.addButton} type="button" onClick={openCreate}><Icon name="plus" />شخص جدید</button>
        </div>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}><Icon name="search" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="جست‌وجوی نام، نام خانوادگی، کد ملی یا موبایل..." /></label>
        <div className={styles.filterDropdown}>
          <SearchableDropdown value={stateFilter} options={[
            { value: "all", label: "همه وضعیت‌ها" },
            { value: "1", label: "ثبت نهایی" },
            { value: "0", label: "پیش‌نویس" },
          ]} onChange={(value) => { setStateFilter(value); setPage(1); }} compact ariaLabel="فیلتر وضعیت ثبت" />
        </div>
        <span className={styles.counter}>{loading ? "در حال دریافت..." : `${totalCount.toLocaleString("fa-IR")} شخص`}</span>
      </section>

      <section className={styles.tableCard} aria-busy={loading}>
        <div className={styles.tableScroll}>
          <table>
            <thead><tr><th>شخص</th><th>اطلاعات هویتی</th><th>شغل و تماس</th><th>وضعیت ثبت</th><th>تاریخ ثبت</th><th className={styles.actionsColumn}>عملیات</th></tr></thead>
            <tbody>
              {!loading && persons.map((person) => (
                <tr key={person.PersonId}>
                  <td><div className={styles.personCell}>
                    {isStoredImageFile(person.ImagePath) ? <img src={`/api/persons/image?file=${encodeURIComponent(person.ImagePath || "")}`} alt="" /> : <span className={styles.avatar}>{person.FirstName.trim().slice(0, 1) || "ش"}</span>}
                    <div><strong>{`${person.FirstName} ${person.LastName}`.trim() || "پیش‌نویس بدون نام"}</strong><small>{person.JensiatName || "جنسیت ثبت نشده"}</small></div>
                  </div></td>
                  <td><div className={styles.detailsCell}><span>{person.CodeMelli || "کد ملی ثبت نشده"}</span><small>نام پدر: {person.FatherName || "—"}</small></div></td>
                  <td><div className={styles.detailsCell}><span>{person.Shoghl || "شغل ثبت نشده"}</span><small>{person.TelHamrah || "شماره تماس ثبت نشده"}</small></div></td>
                  <td><span className={`${styles.status} ${Number(person.RegistrationState) === 1 ? styles.finalStatus : styles.draftStatus}`}><i />{Number(person.RegistrationState) === 1 ? "ثبت نهایی" : "پیش‌نویس"}</span></td>
                  <td className={styles.dateCell}>{person.FinalizedDateTime || person.CreateDateTime || "—"}</td>
                  <td><div className={styles.rowActions}>
                    <button className={styles.editAction} type="button" onClick={() => void openPerson(person)} title={Number(person.RegistrationState) === 1 ? "مشاهده و ویرایش" : "ادامه تکمیل"}><Icon name="edit" /></button>
                    <button className={styles.deleteAction} type="button" onClick={() => setDeleteTarget(person)} title="حذف شخص"><Icon name="trash" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className={styles.tableState}><span className={styles.spinner} />در حال دریافت اشخاص...</div>}
          {!loading && persons.length === 0 && <div className={styles.tableState}><Icon name="persons" /><strong>شخصی پیدا نشد</strong><span>فیلتر یا عبارت جست‌وجو را تغییر دهید.</span></div>}
        </div>
        <footer className={styles.pagination}>
          <span>نمایش {firstRow.toLocaleString("fa-IR")} تا {lastRow.toLocaleString("fa-IR")} از {totalCount.toLocaleString("fa-IR")}</span>
          <div className={styles.pageButtons}>
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}>قبلی</button>
            {pageNumbers.map((number) => <button type="button" key={number} className={number === page ? styles.currentPage : ""} onClick={() => setPage(number)} disabled={loading}>{number.toLocaleString("fa-IR")}</button>)}
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages || loading}>بعدی</button>
          </div>
          <div className={styles.pageSize}><span>تعداد در صفحه</span><SearchableDropdown value={String(pageSize)} options={[10, 15, 25, 50].map((value) => ({ value: String(value), label: value.toLocaleString("fa-IR") }))} onChange={(value) => { setPageSize(Number(value)); setPage(1); }} compact /></div>
        </footer>
      </section>

      {wizardOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.wizardModal} role="dialog" aria-modal="true" aria-label="فرم ثبت شخص">
            <header className={styles.wizardHeader}>
              <div><span className={styles.wizardIcon}><Icon name="file" /></span><div><small>{form.personId ? `شماره پرونده ${form.personId.toLocaleString("fa-IR")}` : "پرونده جدید"}</small><h2>{form.registrationState === 1 ? "ویرایش اطلاعات شخص" : "افزودن شخص جدید"}</h2></div></div>
              <button type="button" onClick={closeWizard} aria-label="بستن فرم"><Icon name="close" /></button>
            </header>

            <div className={styles.stepper}>
              {steps.map((item, index) => <div className={`${styles.stepItem} ${index === step ? styles.stepActive : ""} ${index < step ? styles.stepDone : ""}`} key={item.title}><span>{index < step ? <Icon name="check" /> : (index + 1).toLocaleString("fa-IR")}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div></div>)}
            </div>

            {loadingDetail ? <div className={styles.wizardLoading}><span className={styles.spinner} />در حال دریافت پرونده...</div> : (
              <div className={styles.wizardBody}>
                <div className={styles.stepTitle}><span>مرحله {(step + 1).toLocaleString("fa-IR")}</span><h3>{steps[step].title}</h3><p>{steps[step].subtitle}</p></div>

                {step === 0 && <div className={styles.formGrid}>
                  <TextField label="نام" value={form.firstName} onChange={(value) => change("firstName", value)} required maxLength={150} />
                  <TextField label="نام خانوادگی" value={form.lastName} onChange={(value) => change("lastName", value)} required maxLength={150} />
                  <TextField label="نام پدر" value={form.fatherName} onChange={(value) => change("fatherName", value)} required maxLength={150} />
                  <TextField label="کد ملی" value={form.codeMelli} onChange={(value) => change("codeMelli", value)} required maxLength={10} placeholder="۱۰ رقم" />
                  <TextField label="شماره شناسنامه" value={form.shomareShenasnameh} onChange={(value) => change("shomareShenasnameh", value)} required maxLength={20} />
                  <InputPersianDate label="تاریخ تولد" value={form.tarikhTavalod} onChange={(value) => change("tarikhTavalod", value ?? "")} placeholder="انتخاب تاریخ تولد" />
                  <label className={styles.field}><span>جنسیت<i>*</i></span><SearchableDropdown value={form.jensiat} options={definitionOptions(PERSON_DFN_PID.gender)} onChange={(value) => change("jensiat", value)} compact /></label>
                  <label className={styles.field}><span>وضعیت حیات<i>*</i></span><SearchableDropdown value={form.life} options={definitionOptions(PERSON_DFN_PID.life)} onChange={(value) => change("life", value)} compact /></label>
                  <InputPersianDate label="تاریخ فوت" value={form.tarikhFoat} onChange={(value) => change("tarikhFoat", value ?? "")} placeholder="در صورت نیاز" />
                  <TextField label="کد ملی سرپرست" value={form.codeMelliSarparast} onChange={(value) => change("codeMelliSarparast", value)} maxLength={10} />
                  <label className={styles.field}><span>نسبت با سرپرست</span><SearchableDropdown value={form.nesbat} options={definitionOptions(PERSON_DFN_PID.relation)} onChange={(value) => change("nesbat", value)} compact /></label>
                </div>}

                {step === 1 && <div className={styles.formGrid}>
                  <label className={styles.field}><span>محل تولد</span><SearchableDropdown value={form.mahalTavalod} options={cityOptions} onChange={(value) => change("mahalTavalod", value)} searchPlaceholder="جست‌وجوی شهر..." compact /></label>
                  <label className={styles.field}><span>محل صدور</span><SearchableDropdown value={form.mahalSodor} options={cityOptions} onChange={(value) => change("mahalSodor", value)} searchPlaceholder="جست‌وجوی شهر..." compact /></label>
                  <TextField label="حرف سریال" value={form.serialHarf} onChange={(value) => change("serialHarf", value)} maxLength={3} />
                  <TextField label="سری شناسنامه" value={form.serialSeri} onChange={(value) => change("serialSeri", value)} maxLength={50} />
                  <TextField label="شماره سریال" value={form.serialCode} onChange={(value) => change("serialCode", value)} maxLength={50} />
                  <label className={styles.field}><span>شناسنامه المثنی</span><SearchableDropdown value={form.almosana} options={definitionOptions(PERSON_DFN_PID.yesNo)} onChange={(value) => change("almosana", value)} compact /></label>
                  <TextField label="نام قبلی" value={form.firstNameOld} onChange={(value) => change("firstNameOld", value)} maxLength={250} />
                  <TextField label="نام خانوادگی قبلی" value={form.lastNameOld} onChange={(value) => change("lastNameOld", value)} maxLength={150} />
                  <label className={styles.field}><span>دارای تغییرات شناسنامه</span><SearchableDropdown value={form.taghyiratShenasnamehSet} options={definitionOptions(PERSON_DFN_PID.yesNo)} onChange={(value) => change("taghyiratShenasnamehSet", value)} compact /></label>
                  <TextAreaField label="شرح تغییرات شناسنامه" value={form.taghyiratShenasnameh} onChange={(value) => change("taghyiratShenasnameh", value)} />
                </div>}

                {step === 2 && <div className={styles.formGrid}>
                  <TextField label="شغل" value={form.shoghl} onChange={(value) => change("shoghl", value)} required maxLength={50} />
                  <label className={styles.field}><span>وضعیت تأهل<i>*</i></span><SearchableDropdown value={form.taahol} options={definitionOptions(PERSON_DFN_PID.maritalStatus)} onChange={(value) => change("taahol", value)} compact /></label>
                  <label className={styles.field}><span>دین و مذهب<i>*</i></span><SearchableDropdown value={form.dinMazhab} options={definitionOptions(PERSON_DFN_PID.religionSect)} onChange={(value) => change("dinMazhab", value)} compact /></label>
                  <label className={styles.field}><span>وضعیت روحانیت<i>*</i></span><SearchableDropdown value={form.rohani} options={definitionOptions(PERSON_DFN_PID.clergyStatus)} onChange={(value) => change("rohani", value)} compact /></label>
                  <label className={styles.field}><span>وضعیت نظام وظیفه<i>*</i></span><SearchableDropdown value={form.nezamVazifeh} options={definitionOptions(PERSON_DFN_PID.militaryStatus)} onChange={(value) => change("nezamVazifeh", value)} compact /></label>
                  <InputPersianDate label="تاریخ شروع خدمت" value={form.tarikhShoro} onChange={(value) => change("tarikhShoro", value ?? "")} placeholder="انتخاب تاریخ شروع" />
                  <InputPersianDate label="تاریخ پایان خدمت" value={form.tarikhPayan} onChange={(value) => change("tarikhPayan", value ?? "")} placeholder="انتخاب تاریخ پایان" />
                  <label className={styles.field}><span>نوع معافیت</span><SearchableDropdown value={form.noeMoaafiat} options={definitionOptions(PERSON_DFN_PID.exemptionType)} onChange={(value) => change("noeMoaafiat", value)} compact /></label>
                  <InputPersianDate label="تاریخ معافیت" value={form.tarikhMoaafiat} onChange={(value) => change("tarikhMoaafiat", value ?? "")} placeholder="انتخاب تاریخ معافیت" />
                  <TextField label="شماره همراه" value={form.telHamrah} onChange={(value) => change("telHamrah", value)} placeholder="09xxxxxxxxx" maxLength={11} />
                  <TextField label="تماس ضروری" value={form.telZaruri} onChange={(value) => change("telZaruri", value)} maxLength={15} />
                  <TextField label="ایمیل" value={form.email} onChange={(value) => change("email", value)} type="email" maxLength={1500} />
                  <TextAreaField label="شرح معافیت" value={form.sharhMoaafiat} onChange={(value) => change("sharhMoaafiat", value)} />
                </div>}

                {step === 3 && <div className={styles.reviewLayout}>
                  <section className={styles.imagePanel}>
                    <div className={styles.imagePreview}>{shownImage ? <img src={shownImage} alt="پیش‌نمایش تصویر پرسنلی" /> : <><Icon name="camera" /><strong>تصویر پرسنلی</strong><span>تصویری انتخاب نشده است</span></>}</div>
                    <label className={styles.uploadButton}><Icon name="upload" /><span>{shownImage ? "تغییر تصویر" : "انتخاب تصویر"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /></label>
                    <small>فرمت JPG، PNG یا WEBP با حداکثر حجم ۴ مگابایت</small>
                    <div className={styles.storageNote}><Icon name="file" /><span>فقط نام فایل در اطلاعات شخص ثبت می‌شود؛ محتوای تصویر در DBBazresiFiles نگهداری خواهد شد.</span></div>
                  </section>
                  <section className={styles.reviewPanel}>
                    <header><div><span>مرور اطلاعات واردشده</span><h3>{`${form.firstName} ${form.lastName}`.trim() || "شخص جدید"}</h3></div><span className={`${styles.status} ${form.registrationState === 1 ? styles.finalStatus : styles.draftStatus}`}>{form.registrationState === 1 ? "ثبت نهایی" : "پیش‌نویس"}</span></header>
                    <div className={styles.reviewRows}>{reviewRows.map(([label, value]) => <div className={styles.reviewRow} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
                  </section>
                </div>}
              </div>
            )}

            <footer className={styles.wizardFooter}>
              <div>{form.registrationState === 0 && <button type="button" className={styles.draftButton} onClick={() => void handleDraftSave()} disabled={saving || loadingDetail}><Icon name="draft" />ذخیره موقت</button>}<small>{form.personId ? "اطلاعات تا این مرحله قابل بازیابی است." : "با ذخیره موقت، پیش‌نویس در جدول اشخاص ایجاد می‌شود."}</small></div>
              <div>
                {step > 0 && <button type="button" className={styles.backButton} onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={saving}><Icon name="back" />مرحله قبل</button>}
                {step < 3 ? <button type="button" className={styles.nextButton} onClick={() => void nextStep()} disabled={saving || loadingDetail}>{saving ? <span className={styles.buttonSpinner} /> : <Icon name="next" />}مرحله بعد</button> : <button type="button" className={styles.finalButton} onClick={requestFinalConfirmation} disabled={saving}><Icon name="check" />تأیید و ثبت نهایی</button>}
              </div>
            </footer>
          </section>
        </div>
      )}

      {finalConfirm && <ConfirmDialog tone="success" title="تأیید ثبت نهایی اطلاعات" text={`اطلاعات ${`${form.firstName} ${form.lastName}`.trim()} پس از تأیید به وضعیت ثبت نهایی منتقل می‌شود. آیا اطلاعات بررسی شده است؟`} confirmText="بله، ثبت نهایی شود" busy={saving} onCancel={() => setFinalConfirm(false)} onConfirm={() => void finalizePerson()} />}
      {deleteTarget && <ConfirmDialog tone="danger" title="حذف شخص از فهرست" text={`پرونده ${`${deleteTarget.FirstName} ${deleteTarget.LastName}`.trim() || "انتخاب‌شده"} به‌صورت نرم حذف می‌شود و در فهرست نمایش داده نخواهد شد.`} confirmText="حذف شود" busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
    </main>
  );
}
