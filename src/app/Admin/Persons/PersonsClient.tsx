"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchableDropdown } from "@/component/Dropdown";
import { normalizeDropdownSearch } from "@/component/Dropdown/dropdownUtils";
import InputPersianDate from "@/component/InputPersianDatePicker";
import { PERSON_DFN_PID } from "@/lib/person-dfn";
import { isValidIranianNationalCode, numericInput } from "@/Utils/nationalCode";
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
type MainPerson = { CodeMelli: string; FullName: string };

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

type WorkHistoryRow = {
  id: number;
  workplace: string;
  position: string;
  fromDate: string;
  toDate: string;
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

const detailTabs = [
  { id: "details", title: "مشخصات فردی", isTable: true },
  { id: "sacrifice", title: "سابقه ایثارگری", isTable: false },
  { id: "military", title: "وضعیت نظام وظیفه", isTable: false },
  { id: "education", title: "سوابق تحصیلی", isTable: false },
  { id: "employment", title: "اطلاعات شغلی", isTable: false },
  { id: "family", title: "اطلاعات همسر و فرزندان", isTable: true },
  { id: "relatives", title: "اقوام درجه ۱ و ۲ خارج از کشور", isTable: true },
  { id: "work-history", title: "سوابق شغلی", isTable: true },
  { id: "election-supervision", title: "سوابق نظارتی و اجرایی انتخابات", isTable: true },
  { id: "social-activities", title: "سوابق فعالیت‌های اجتماعی", isTable: true },
  { id: "training", title: "دوره‌های آموزشی عمومی و تخصصی", isTable: true },
  { id: "candidacy", title: "سابقه داوطلبی در انتخابات", isTable: true },
  { id: "computer-skills", title: "مهارت استفاده از رایانه", isTable: false },
  { id: "health", title: "وضعیت جسمانی", isTable: false },
  { id: "contact", title: "آدرس و اطلاعات تماس", isTable: false },
] as const;
type DetailTabId = typeof detailTabs[number]["id"];
const tableDetailTabs = detailTabs.filter((tab) => tab.isTable);

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
  label, value, onChange, placeholder, required, type = "text", maxLength, hint, numeric = false, error = false, largeLabel = false,
}: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
  required?: boolean; type?: string; maxLength?: number; hint?: string; numeric?: boolean; error?: boolean; largeLabel?: boolean;
}) {
  return (
    <label className={`${styles.field} ${error ? styles.fieldError : ""} ${largeLabel ? styles.largeFieldLabel : ""}`}>
      <span>{label}{required && <i>*</i>}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(numeric ? numericInput(event.target.value, maxLength) : event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={numeric ? "numeric" : undefined}
        pattern={numeric ? "[0-9]*" : undefined}
        aria-invalid={error || undefined}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, required = false, hint, error = false, largeLabel = false }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string;
  required?: boolean; hint?: string; error?: boolean; largeLabel?: boolean;
}) {
  return (
    <label className={`${styles.field} ${styles.wideField} ${error ? styles.fieldError : ""} ${largeLabel ? styles.largeFieldLabel : ""}`}>
      <span>{label}{required && <i>*</i>}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} aria-invalid={error || undefined} />
      {hint && <small>{hint}</small>}
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
  const [mainPersons, setMainPersons] = useState<MainPerson[]>([]);
  const [selectedMainPerson, setSelectedMainPerson] = useState<MainPerson | null>(null);
  const [mainPersonsSearching, setMainPersonsSearching] = useState(false);
  const mainPersonRequestId = useRef(0);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTabId>("details");
  const [workHistory, setWorkHistory] = useState<WorkHistoryRow[]>([]);
  const [workHistoryForm, setWorkHistoryForm] = useState<Omit<WorkHistoryRow, "id">>({ workplace: "", position: "", fromDate: "", toDate: "" });
  const [editingWorkHistoryId, setEditingWorkHistoryId] = useState<number | null>(null);
  const [workHistoryModalOpen, setWorkHistoryModalOpen] = useState(false);
  const [sectionEdit, setSectionEdit] = useState<number | null>(null);
  const sectionEditBackup = useRef<PersonForm | null>(null);
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
  const certificateDescriptionRequired = useMemo(() => {
    const selected = definitions.find(
      (item) =>
        item.GroupCode === PERSON_DFN_PID.descriptionAvailability &&
        String(item.Id) === form.taghyiratShenasnamehSet,
    );
    return normalizeDropdownSearch(selected?.Title) === "دارد";
  }, [definitions, form.taghyiratShenasnamehSet]);
  const certificateDescriptionInvalid =
    certificateDescriptionRequired && form.taghyiratShenasnameh.trim().length <= 5;
  const mainPersonOptions = useMemo(() => {
    const availablePersons = [...mainPersons];
    if (
      form.codeMelliSarparast &&
      !availablePersons.some((item) => item.CodeMelli === form.codeMelliSarparast)
    ) {
      availablePersons.unshift(selectedMainPerson ?? {
        CodeMelli: form.codeMelliSarparast,
        FullName: form.codeMelliSarparast,
      });
    }

    return [
      { value: "", label: "انتخاب نشده" },
      ...availablePersons.map((item) => ({
      value: item.CodeMelli,
      label: item.FullName,
      description: item.CodeMelli,
      searchText: `${item.FullName} ${item.CodeMelli}`,
      })),
    ];
  }, [form.codeMelliSarparast, mainPersons, selectedMainPerson]);

  const searchMainPersonOptions = useCallback(async (query: string) => {
    const requestId = ++mainPersonRequestId.current;
    setMainPersonsSearching(true);

    try {
      const params = new URLSearchParams({ mode: "head-lookup" });
      if (query) params.set("search", query);
      const data = await readJson(await fetch(`/api/persons?${params}`, { cache: "no-store" }));
      if (requestId === mainPersonRequestId.current) {
        setMainPersons((data.mainPersons as MainPerson[] | undefined) ?? []);
      }
    } catch (error) {
      if (requestId === mainPersonRequestId.current) {
        setNotice({ type: "error", text: error instanceof Error ? error.message : "جست‌وجوی سرپرست انجام نشد." });
      }
    } finally {
      if (requestId === mainPersonRequestId.current) setMainPersonsSearching(false);
    }
  }, []);

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
    const requestId = ++mainPersonRequestId.current;
    fetch("/api/persons?mode=lookups", { cache: "no-store" })
      .then(readJson)
      .then((data) => {
        setDefinitions((data.definitions as Definition[] | undefined) ?? []);
        setCities((data.cities as City[] | undefined) ?? []);
        // A slower initial lookup must not overwrite a newer head search.
        if (requestId === mainPersonRequestId.current) {
          setMainPersons((data.mainPersons as MainPerson[] | undefined) ?? []);
        }
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

  useEffect(() => {
    if (!detailOpen && !wizardOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [detailOpen, wizardOpen]);

  function change<K extends keyof PersonForm>(key: K, value: PersonForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setDetailOpen(false);
    setForm(emptyForm);
    setSelectedMainPerson(null);
    setStep(0);
    setSelectedImage(null);
    setPreviewUrl("");
    setWizardOpen(true);
  }

  async function loadPersonForm(person: PersonRow | number) {
    const personId = typeof person === "number" ? person : person.PersonId;
    const data = await readJson(await fetch(`/api/persons?personId=${personId}`, { cache: "no-store" }));
    const record = data.person as PersonRecord | undefined;
    if (!record) throw new Error("اطلاعات شخص دریافت نشد.");
    const nextForm = fromRecord(record);
    setForm(nextForm);
    setSelectedMainPerson(
      mainPersons.find((item) => item.CodeMelli === nextForm.codeMelliSarparast) ?? null,
    );
    return nextForm;
  }

  async function openDetail(person: PersonRow) {
    setWizardOpen(false);
    setSectionEdit(null);
    sectionEditBackup.current = null;
    setDetailTab("details");
    setDetailOpen(true);
    setLoadingDetail(true);
    setSelectedImage(null);
    setPreviewUrl("");
    setForm({
      ...emptyForm,
      personId: Number(person.PersonId),
      registrationState: Number(person.RegistrationState),
      imagePath: person.ImagePath ?? "",
      codeMelli: person.CodeMelli ?? "",
      firstName: person.FirstName ?? "",
      lastName: person.LastName ?? "",
      fatherName: person.FatherName ?? "",
      jensiat: person.JensiatName ?? "",
      shoghl: person.Shoghl ?? "",
      telHamrah: person.TelHamrah ?? "",
    });
    try {
      await loadPersonForm(person);
    } catch (error) {
      setDetailOpen(false);
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات انجام نشد." });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function openPerson(person: PersonRow) {
    setDetailOpen(false);
    setWizardOpen(true);
    setLoadingDetail(true);
    setStep(0);
    setSelectedImage(null);
    setPreviewUrl("");
    setForm({ ...emptyForm, personId: Number(person.PersonId), registrationState: Number(person.RegistrationState) });
    try {
      await loadPersonForm(person);
    } catch (error) {
      setWizardOpen(false);
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات انجام نشد." });
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeDetail() {
    setSectionEdit(null);
    sectionEditBackup.current = null;
    setDetailOpen(false);
  }

  function resetWorkHistoryForm() {
    setWorkHistoryForm({ workplace: "", position: "", fromDate: "", toDate: "" });
    setEditingWorkHistoryId(null);
  }

  function saveWorkHistoryRow() {
    if (!workHistoryForm.workplace.trim() || !workHistoryForm.position.trim()) {
      setNotice({ type: "error", text: "محل خدمت و سمت سازمانی را وارد کنید." });
      return;
    }
    if (editingWorkHistoryId === null) {
      setWorkHistory((current) => [...current, { ...workHistoryForm, id: Date.now() }]);
    } else {
      setWorkHistory((current) => current.map((row) => row.id === editingWorkHistoryId ? { ...row, ...workHistoryForm } : row));
    }
    resetWorkHistoryForm();
    setWorkHistoryModalOpen(false);
  }

  function editWorkHistoryRow(row: WorkHistoryRow) {
    setWorkHistoryForm({ workplace: row.workplace, position: row.position, fromDate: row.fromDate, toDate: row.toDate });
    setEditingWorkHistoryId(row.id);
    setWorkHistoryModalOpen(true);
  }

  function openWorkHistoryCreate() {
    resetWorkHistoryForm();
    setWorkHistoryModalOpen(true);
  }

  function openSectionEdit(sectionIndex: number) {
    sectionEditBackup.current = { ...form };
    setSectionEdit(sectionIndex);
  }

  function closeSectionEdit() {
    if (saving) return;
    if (sectionEditBackup.current) setForm(sectionEditBackup.current);
    sectionEditBackup.current = null;
    setSectionEdit(null);
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
      if (!isValidIranianNationalCode(form.codeMelli)) return "کد ملی واردشده معتبر نیست.";
      if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2 || form.fatherName.trim().length < 2) return "نام، نام خانوادگی و نام پدر را کامل وارد کنید.";
      if (!form.shomareShenasnameh.trim()) return "شماره شناسنامه را وارد کنید.";
      if (!form.life || !form.jensiat) return "وضعیت حیات و جنسیت را انتخاب کنید.";
    }
    if (currentStep === 1 && certificateDescriptionInvalid) {
      return "توضیحات شناسنامه باید بیشتر از ۵ کاراکتر باشد.";
    }
    if (currentStep === 2) {
      if (form.shoghl.trim().length < 2) return "شغل را وارد کنید.";
      if (!form.taahol || !form.dinMazhab || !form.rohani || !form.nezamVazifeh) return "وضعیت‌های تأهل، دین و مذهب، روحانیت و نظام وظیفه را انتخاب کنید.";
      if (form.telHamrah && !/^09\d{9}$/.test(form.telHamrah)) return "شماره همراه معتبر نیست.";
    }
    return "";
  }

  async function saveDetailSection() {
    if (sectionEdit === null || saving || !form.personId) return;
    const validationError = stepError(sectionEdit);
    if (validationError) {
      setNotice({ type: "error", text: validationError });
      return;
    }

    setSaving(true);
    try {
      await readJson(await fetch("/api/persons", {
        method: form.registrationState === 1 ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyFromForm()),
      }));
      const editedTitle = steps[sectionEdit].title;
      await loadPersonForm(form.personId);
      sectionEditBackup.current = null;
      setSectionEdit(null);
      setNotice({ type: "success", text: `بخش «${editedTitle}» با موفقیت به‌روزرسانی شد.` });
      await loadPersons(search, stateFilter, page, pageSize);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "به‌روزرسانی اطلاعات انجام نشد." });
    } finally {
      setSaving(false);
    }
  }

  async function nextStep() {
    const error = stepError(step);
    if (error) {
      setNotice({ type: "error", text: error });
      return;
    }
    setSaving(true);
    try {
      if (step === 0) {
        const validation = await readJson(await fetch(
          `/api/persons?mode=validate-national-code&nationalCode=${encodeURIComponent(form.codeMelli)}`,
          { cache: "no-store" },
        ));
        if (validation.isValid !== true) {
          setNotice({ type: "error", text: "کد ملی واردشده معتبر نیست." });
          return;
        }
      }
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
    ["شهرستان تولد", cityTitle(form.mahalTavalod)],
    ["شهرستان صدور", cityTitle(form.mahalSodor)],
    ["سریال شناسنامه", [form.serialHarf, form.serialSeri, form.serialCode].filter(Boolean).join(" - ") || "—"],
    ["وضعیت شناسنامه", lookupTitle(PERSON_DFN_PID.certificateStatus, form.almosana)],
    ["نام و نام خانوادگی قبلی", `${form.firstNameOld} ${form.lastNameOld}`.trim() || "—"],
    ["توضیحات دارد یا ندارد", lookupTitle(PERSON_DFN_PID.descriptionAvailability, form.taghyiratShenasnamehSet)],
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
  const detailName = `${form.firstName} ${form.lastName}`.trim() || "پیش‌نویس بدون نام";
  const detailSections: Array<{
    title: string;
    subtitle: string;
    fields: Array<{ label: string; value: string }>;
  }> = [
    {
      title: steps[0].title,
      subtitle: steps[0].subtitle,
      fields: [
        { label: "نام", value: form.firstName },
        { label: "نام خانوادگی", value: form.lastName },
        { label: "نام پدر", value: form.fatherName },
        { label: "کد ملی", value: form.codeMelli },
        { label: "شماره شناسنامه", value: form.shomareShenasnameh },
        { label: "تاریخ تولد", value: form.tarikhTavalod },
        { label: "جنسیت", value: lookupTitle(PERSON_DFN_PID.gender, form.jensiat) },
        { label: "وضعیت حیات", value: lookupTitle(PERSON_DFN_PID.life, form.life) },
        { label: "تاریخ فوت", value: form.tarikhFoat },
        { label: "کد ملی سرپرست", value: form.codeMelliSarparast },
        { label: "نسبت با سرپرست", value: lookupTitle(PERSON_DFN_PID.relation, form.nesbat) },
      ],
    },
    {
      title: steps[1].title,
      subtitle: steps[1].subtitle,
      fields: [
        { label: "شهرستان تولد", value: cityTitle(form.mahalTavalod) },
        { label: "شهرستان صدور", value: cityTitle(form.mahalSodor) },
        { label: "حرف سریال", value: form.serialHarf },
        { label: "سری شناسنامه", value: form.serialSeri },
        { label: "شماره سریال", value: form.serialCode },
        { label: "وضعیت شناسنامه", value: lookupTitle(PERSON_DFN_PID.certificateStatus, form.almosana) },
        { label: "نام قبلی", value: form.firstNameOld },
        { label: "نام خانوادگی قبلی", value: form.lastNameOld },
        { label: "توضیحات دارد یا ندارد", value: lookupTitle(PERSON_DFN_PID.descriptionAvailability, form.taghyiratShenasnamehSet) },
        { label: "توضیحات شناسنامه", value: form.taghyiratShenasnameh },
      ],
    },
    {
      title: steps[2].title,
      subtitle: steps[2].subtitle,
      fields: [
        { label: "شغل", value: form.shoghl },
        { label: "وضعیت تأهل", value: lookupTitle(PERSON_DFN_PID.maritalStatus, form.taahol) },
        { label: "دین و مذهب", value: lookupTitle(PERSON_DFN_PID.religionSect, form.dinMazhab) },
        { label: "وضعیت روحانیت", value: lookupTitle(PERSON_DFN_PID.clergyStatus, form.rohani) },
        { label: "وضعیت نظام وظیفه", value: lookupTitle(PERSON_DFN_PID.militaryStatus, form.nezamVazifeh) },
        { label: "تاریخ شروع خدمت", value: form.tarikhShoro },
        { label: "تاریخ پایان خدمت", value: form.tarikhPayan },
        { label: "نوع معافیت", value: lookupTitle(PERSON_DFN_PID.exemptionType, form.noeMoaafiat) },
        { label: "تاریخ معافیت", value: form.tarikhMoaafiat },
        { label: "تلفن همراه", value: form.telHamrah },
        { label: "تلفن ضروری", value: form.telZaruri },
        { label: "ایمیل", value: form.email },
        { label: "شرح معافیت", value: form.sharhMoaafiat },
      ],
    },
  ];

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
                <tr
                  key={person.PersonId}
                  className={styles.clickableRow}
                  onClick={() => void openDetail(person)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void openDetail(person);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`مشاهده مشخصات ${`${person.FirstName} ${person.LastName}`.trim()}`}
                >
                  <td><div className={styles.personCell}>
                    {isStoredImageFile(person.ImagePath) ? <img src={`/api/persons/image?file=${encodeURIComponent(person.ImagePath || "")}`} alt="" /> : <span className={styles.avatar}>{person.FirstName.trim().slice(0, 1) || "ش"}</span>}
                    <div><strong>{`${person.FirstName} ${person.LastName}`.trim() || "پیش‌نویس بدون نام"}</strong><small>{person.JensiatName || "جنسیت ثبت نشده"}</small></div>
                  </div></td>
                  <td><div className={styles.detailsCell}><span>{person.CodeMelli || "کد ملی ثبت نشده"}</span><small>نام پدر: {person.FatherName || "—"}</small></div></td>
                  <td><div className={styles.detailsCell}><span>{person.Shoghl || "شغل ثبت نشده"}</span><small>{person.TelHamrah || "شماره تماس ثبت نشده"}</small></div></td>
                  <td><span className={`${styles.status} ${Number(person.RegistrationState) === 1 ? styles.finalStatus : styles.draftStatus}`}><i />{Number(person.RegistrationState) === 1 ? "ثبت نهایی" : "پیش‌نویس"}</span></td>
                  <td className={styles.dateCell}>{person.FinalizedDateTime || person.CreateDateTime || "—"}</td>
                  <td><div className={styles.rowActions}>
                    <button className={styles.editAction} type="button" onClick={(event) => { event.stopPropagation(); void openPerson(person); }} title={Number(person.RegistrationState) === 1 ? "ویرایش اطلاعات" : "ادامه تکمیل"}><Icon name="edit" /></button>
                    <button className={styles.deleteAction} type="button" onClick={(event) => { event.stopPropagation(); setDeleteTarget(person); }} title="حذف شخص"><Icon name="trash" /></button>
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

      {detailOpen && (
        <div className={styles.detailBackdrop}>
          <section className={styles.detailModal} role="dialog" aria-modal="true" aria-label={`مشخصات ${detailName}`}>
            <header className={styles.detailHeader}>
              <div className={styles.detailPersonTitle}>
                <div>
                  <h2>{detailName}</h2>
                  <span>شماره پرونده {form.personId.toLocaleString("fa-IR")}</span>
                </div>
              </div>
              <div className={styles.detailHeaderActions}>
                <span className={`${styles.status} ${form.registrationState === 1 ? styles.finalStatus : styles.draftStatus}`}><i />{form.registrationState === 1 ? "ثبت نهایی" : "پیش‌نویس"}</span>
                <button type="button" className={styles.detailCloseButton} onClick={closeDetail} aria-label="بستن مشخصات"><Icon name="close" /></button>
              </div>
            </header>

            <nav className={styles.detailTabs} aria-label="بخش‌های پرونده" role="tablist">
              {tableDetailTabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.detailTab} ${detailTab === tab.id ? styles.detailTabActive : ""}`}
                    onClick={() => setDetailTab(tab.id)}
                    aria-selected={detailTab === tab.id}
                    role="tab"
                  >
                    <span className={styles.detailTabIcon}><Icon name={tab.id === "details" ? "persons" : "file"} /></span>
                    {tab.title}
                  </button>
                );
              })}
              <label className={styles.detailTabPicker}>
                <span>بخش جاری</span>
                <SearchableDropdown
                  value={detailTab}
                  options={detailTabs.map((tab) => ({ value: tab.id, label: tab.title }))}
                  onChange={(value) => setDetailTab(value as DetailTabId)}
                  placeholder="انتخاب بخش"
                  searchPlaceholder="جست‌وجوی عنوان بخش..."
                  ariaLabel="انتخاب بخش پرونده"
                  menuWidth={300}
                  compact
                />
              </label>
            </nav>

            {loadingDetail ? (
              <div className={styles.detailLoading}><span className={styles.spinner} />در حال دریافت مشخصات فرد...</div>
            ) : detailTab === "details" ? (
              <div className={styles.detailBody}>
                <div className={styles.detailLayout}>
                  <aside className={styles.detailSidebar}>
                    <div className={styles.detailSidebarTitle}><span>تصویر پرسنلی</span><small>نمایش تصویر ثبت‌شده فرد</small></div>
                    <div className={styles.detailSidebarPhoto}>
                      {shownImage ? <img src={shownImage} alt={`تصویر پرسنلی ${detailName}`} /> : <><Icon name="camera" /><strong>تصویر ثبت نشده است</strong></>}
                    </div>
                    <div className={styles.detailSidebarInfo}>
                      <div><span>شماره پرونده</span><strong>{form.personId.toLocaleString("fa-IR")}</strong></div>
                      <div><span>کد ملی</span><strong>{form.codeMelli || "—"}</strong></div>
                      <div><span>وضعیت پرونده</span><strong>{form.registrationState === 1 ? "ثبت نهایی" : "پیش‌نویس"}</strong></div>
                    </div>
                  </aside>

                  <section className={styles.detailReviewPanel}>
                    <header>
                      <div><span>مشاهده اطلاعات ثبت‌شده</span><h3>{detailName}</h3></div>
                      <span>فقط خواندنی</span>
                    </header>
                    <div className={styles.detailReviewContent}>
                      {detailSections.map((section, sectionIndex) => (
                        <section className={styles.detailReviewSection} key={section.title}>
                          <div className={styles.detailReviewSectionTitle}>
                            <span>{(sectionIndex + 1).toLocaleString("fa-IR")}</span>
                            <div><h4>{section.title}</h4><p>{section.subtitle}</p></div>
                            <button type="button" onClick={() => openSectionEdit(sectionIndex)}><Icon name="edit" />ویرایش</button>
                          </div>
                          <div className={styles.detailReviewRows}>
                            {section.fields.map((field) => (
                              <div className={styles.detailReviewRow} key={field.label}>
                                <span>{field.label}</span>
                                <strong>{field.value || "—"}</strong>
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : detailTab === "family" ? (
              <div className={styles.detailBody}>
                <section className={styles.familyPanel}>
                  <header className={styles.familyPanelHeader}>
                    <div><span>اطلاعات خانوادگی</span><h3>همسر و فرزندان</h3></div>
                    <span>۵ ردیف فرزند</span>
                  </header>
                  <div className={styles.familySummary}>
                    <div><span>نام و نام خانوادگی همسر</span><strong>ثبت نشده</strong></div>
                    <div><span>شغل همسر</span><strong>ثبت نشده</strong></div>
                    <div><span>تعداد فرزندان</span><strong>۰</strong></div>
                  </div>
                  <div className={styles.familyTableWrap}>
                    <table className={styles.familyTable}>
                      <thead><tr><th>ردیف</th><th>نام و نام خانوادگی</th><th>شغل</th><th>نسبت</th></tr></thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((rowNumber) => (
                          <tr key={rowNumber}>
                            <td>{rowNumber.toLocaleString("fa-IR")}</td>
                            <td>—</td>
                            <td>—</td>
                            <td>فرزند</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : detailTab === "work-history" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div><span>سوابق شغلی</span><h3>محل خدمت و سمت‌های سازمانی</h3></div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openWorkHistoryCreate}><Icon name="plus" />سابقه جدید</button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={styles.workHistoryTable}>
                      <thead><tr><th>ردیف</th><th>محل خدمت</th><th>سمت (پست سازمانی)</th><th>از تاریخ</th><th>تا تاریخ</th><th>عملیات</th></tr></thead>
                      <tbody>
                        {workHistory.map((row, index) => (
                          <tr key={row.id}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td><td>{row.workplace}</td><td>{row.position}</td><td>{row.fromDate || "—"}</td><td>{row.toDate || "تا اکنون"}</td>
                            <td><div className={styles.workHistoryActions}><button type="button" className={styles.editAction} onClick={() => editWorkHistoryRow(row)} title="ویرایش"><Icon name="edit" /></button><button type="button" className={styles.deleteAction} onClick={() => setWorkHistory((current) => current.filter((item) => item.id !== row.id))} title="حذف"><Icon name="trash" /></button></div></td>
                          </tr>
                        ))}
                        {workHistory.length === 0 && <tr><td colSpan={6} className={styles.workHistoryEmpty}>هنوز سابقه شغلی ثبت نشده است.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : null}

            {workHistoryModalOpen && detailTab === "work-history" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingWorkHistoryId === null ? "افزودن سابقه شغلی" : "ویرایش سابقه شغلی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>سوابق شغلی</small><h3>{editingWorkHistoryId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                    </div>
                    <button type="button" onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>
                  <div className={styles.workHistoryForm}>
                    <TextField label="محل خدمت" value={workHistoryForm.workplace} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, workplace: value }))} />
                    <TextField label="سمت (پست سازمانی)" value={workHistoryForm.position} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, position: value }))} />
                    <InputPersianDate label="از تاریخ" value={workHistoryForm.fromDate} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, fromDate: value ?? "" }))} placeholder="انتخاب تاریخ شروع" />
                    <InputPersianDate label="تا تاریخ" value={workHistoryForm.toDate} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, toDate: value ?? "" }))} placeholder="تا اکنون" />
                  </div>
                  <footer>
                    <button type="button" className={styles.workHistoryConfirmButton} onClick={saveWorkHistoryRow}><Icon name="check" />{editingWorkHistoryId === null ? "افزودن سابقه" : "ذخیره ویرایش"}</button>
                    <button type="button" className={styles.cancelButton} onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }}>انصراف</button>
                  </footer>
                </section>
              </div>
            )}

            {sectionEdit !== null && (
              <div className={styles.sectionEditBackdrop}>
                <section className={styles.sectionEditModal} role="dialog" aria-modal="true" aria-label={`ویرایش ${steps[sectionEdit].title}`}>
                  <header>
                    <div><span>ویرایش بخش</span><h3>{steps[sectionEdit].title}</h3><p>{steps[sectionEdit].subtitle}</p></div>
                    <button type="button" onClick={closeSectionEdit} disabled={saving} aria-label="بستن ویرایش"><Icon name="close" /></button>
                  </header>

                  <div className={styles.sectionEditBody}>
                    {sectionEdit === 0 && <div className={styles.formGrid}>
                      <TextField label="نام" value={form.firstName} onChange={(value) => change("firstName", value)} required maxLength={150} />
                      <TextField label="نام خانوادگی" value={form.lastName} onChange={(value) => change("lastName", value)} required maxLength={150} />
                      <TextField label="نام پدر" value={form.fatherName} onChange={(value) => change("fatherName", value)} required maxLength={150} />
                      <TextField label="کد ملی" value={form.codeMelli} onChange={(value) => change("codeMelli", value)} required numeric error={form.codeMelli.length === 10 && !isValidIranianNationalCode(form.codeMelli)} maxLength={10} placeholder="۱۰ رقم" />
                      <TextField label="شماره شناسنامه" value={form.shomareShenasnameh} onChange={(value) => change("shomareShenasnameh", value)} required maxLength={20} />
                      <InputPersianDate label="تاریخ تولد" value={form.tarikhTavalod} onChange={(value) => change("tarikhTavalod", value ?? "")} placeholder="انتخاب تاریخ تولد" />
                      <label className={styles.field}><span>جنسیت<i>*</i></span><SearchableDropdown value={form.jensiat} options={definitionOptions(PERSON_DFN_PID.gender)} onChange={(value) => change("jensiat", value)} compact /></label>
                      <label className={styles.field}><span>وضعیت حیات<i>*</i></span><SearchableDropdown value={form.life} options={definitionOptions(PERSON_DFN_PID.life)} onChange={(value) => change("life", value)} compact /></label>
                      <InputPersianDate label="تاریخ فوت" value={form.tarikhFoat} onChange={(value) => change("tarikhFoat", value ?? "")} placeholder="در صورت نیاز" />
                      <label className={styles.field}>
                        <span>کد ملی سرپرست</span>
                        <SearchableDropdown
                          value={form.codeMelliSarparast}
                          options={mainPersonOptions}
                          onChange={(value) => {
                            setSelectedMainPerson(mainPersons.find((item) => item.CodeMelli === value) ?? null);
                            change("codeMelliSarparast", value);
                            if (!value) change("nesbat", "");
                          }}
                          onSearchChange={searchMainPersonOptions}
                          searchDelayMs={3000}
                          searching={mainPersonsSearching}
                          onClear={() => {
                            setSelectedMainPerson(null);
                            change("codeMelliSarparast", "");
                            change("nesbat", "");
                          }}
                          clearAriaLabel="حذف سرپرست انتخاب‌شده"
                          placeholder="انتخاب سرپرست (اختیاری)"
                          searchPlaceholder="جست‌وجوی نام یا کد ملی..."
                          ariaLabel="انتخاب کد ملی سرپرست"
                          compact
                        />
                      </label>
                      <label className={styles.field}><span>نسبت با سرپرست</span><SearchableDropdown value={form.nesbat} options={definitionOptions(PERSON_DFN_PID.relation)} onChange={(value) => change("nesbat", value)} compact /></label>
                    </div>}

                    {sectionEdit === 1 && <div className={styles.formGrid}>
                      <label className={styles.field}><span>شهرستان تولد</span><SearchableDropdown value={form.mahalTavalod} options={cityOptions} onChange={(value) => change("mahalTavalod", value)} searchPlaceholder="جست‌وجوی شهرستان..." compact /></label>
                      <label className={styles.field}><span>شهرستان صدور</span><SearchableDropdown value={form.mahalSodor} options={cityOptions} onChange={(value) => change("mahalSodor", value)} searchPlaceholder="جست‌وجوی شهرستان..." compact /></label>
                      <TextField label="حرف سریال" value={form.serialHarf} onChange={(value) => change("serialHarf", value)} maxLength={3} />
                      <TextField label="سری شناسنامه" value={form.serialSeri} onChange={(value) => change("serialSeri", value)} maxLength={50} />
                      <TextField label="شماره سریال" value={form.serialCode} onChange={(value) => change("serialCode", value)} maxLength={50} />
                      <label className={styles.field}><span>وضعیت شناسنامه</span><SearchableDropdown value={form.almosana} options={definitionOptions(PERSON_DFN_PID.certificateStatus)} onChange={(value) => change("almosana", value)} compact /></label>
                      <TextField label="نام قبلی" value={form.firstNameOld} onChange={(value) => change("firstNameOld", value)} maxLength={250} />
                      <TextField label="نام خانوادگی قبلی" value={form.lastNameOld} onChange={(value) => change("lastNameOld", value)} maxLength={150} />
                      <label className={styles.field}><span>توضیحات دارد یا ندارد</span><SearchableDropdown value={form.taghyiratShenasnamehSet} options={definitionOptions(PERSON_DFN_PID.descriptionAvailability)} onChange={(value) => change("taghyiratShenasnamehSet", value)} compact /></label>
                      <TextAreaField label="توضیحات شناسنامه" value={form.taghyiratShenasnameh} onChange={(value) => change("taghyiratShenasnameh", value)} required={certificateDescriptionRequired} error={certificateDescriptionInvalid} hint={certificateDescriptionRequired ? "در صورت انتخاب «دارد»، حداقل ۶ کاراکتر وارد کنید." : undefined} />
                    </div>}

                    {sectionEdit === 2 && <div className={styles.formGrid}>
                      <TextField label="شغل" value={form.shoghl} onChange={(value) => change("shoghl", value)} required maxLength={50} />
                      <label className={styles.field}><span>وضعیت تأهل<i>*</i></span><SearchableDropdown value={form.taahol} options={definitionOptions(PERSON_DFN_PID.maritalStatus)} onChange={(value) => change("taahol", value)} compact /></label>
                      <label className={styles.field}><span>دین و مذهب<i>*</i></span><SearchableDropdown value={form.dinMazhab} options={definitionOptions(PERSON_DFN_PID.religionSect)} onChange={(value) => change("dinMazhab", value)} compact /></label>
                      <label className={styles.field}><span>وضعیت روحانیت<i>*</i></span><SearchableDropdown value={form.rohani} options={definitionOptions(PERSON_DFN_PID.clergyStatus)} onChange={(value) => change("rohani", value)} compact /></label>
                      <label className={styles.field}><span>وضعیت نظام وظیفه<i>*</i></span><SearchableDropdown value={form.nezamVazifeh} options={definitionOptions(PERSON_DFN_PID.militaryStatus)} onChange={(value) => change("nezamVazifeh", value)} compact /></label>
                      <InputPersianDate label="تاریخ شروع خدمت" value={form.tarikhShoro} onChange={(value) => change("tarikhShoro", value ?? "")} placeholder="انتخاب تاریخ شروع" />
                      <InputPersianDate label="تاریخ پایان خدمت" value={form.tarikhPayan} onChange={(value) => change("tarikhPayan", value ?? "")} placeholder="انتخاب تاریخ پایان" />
                      <label className={styles.field}><span>نوع معافیت</span><SearchableDropdown value={form.noeMoaafiat} options={definitionOptions(PERSON_DFN_PID.exemptionType)} onChange={(value) => change("noeMoaafiat", value)} compact /></label>
                      <InputPersianDate label="تاریخ معافیت" value={form.tarikhMoaafiat} onChange={(value) => change("tarikhMoaafiat", value ?? "")} placeholder="انتخاب تاریخ معافیت" />
                      <TextField label="تلفن همراه" value={form.telHamrah} onChange={(value) => change("telHamrah", value)} placeholder="09xxxxxxxxx" maxLength={11} numeric largeLabel />
                      <TextField label="تلفن ضروری" value={form.telZaruri} onChange={(value) => change("telZaruri", value)} maxLength={15} numeric largeLabel />
                      <TextField label="ایمیل" value={form.email} onChange={(value) => change("email", value)} type="email" maxLength={1500} largeLabel />
                      <TextAreaField label="شرح معافیت" value={form.sharhMoaafiat} onChange={(value) => change("sharhMoaafiat", value)} largeLabel />
                    </div>}
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} onClick={closeSectionEdit} disabled={saving}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveDetailSection()} disabled={saving}>
                      {saving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      تأیید و به‌روزرسانی
                    </button>
                  </footer>
                </section>
              </div>
            )}
          </section>
        </div>
      )}

      {wizardOpen && (
        <div className={`${styles.modalBackdrop} ${form.personId ? styles.editModalBackdrop : ""}`}>
          <section className={`${styles.wizardModal} ${form.personId ? styles.wizardEditModal : ""}`} role="dialog" aria-modal="true" aria-label="فرم ثبت شخص">
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
                  <TextField
                    label="کد ملی"
                    value={form.codeMelli}
                    onChange={(value) => change("codeMelli", value)}
                    required
                    numeric
                    error={form.codeMelli.length === 10 && !isValidIranianNationalCode(form.codeMelli)}
                    hint={form.codeMelli.length === 10 && !isValidIranianNationalCode(form.codeMelli) ? "کد ملی واردشده معتبر نیست." : undefined}
                    maxLength={10}
                    placeholder="۱۰ رقم"
                  />
                  <TextField label="شماره شناسنامه" value={form.shomareShenasnameh} onChange={(value) => change("shomareShenasnameh", value)} required maxLength={20} />
                  <InputPersianDate label="تاریخ تولد" value={form.tarikhTavalod} onChange={(value) => change("tarikhTavalod", value ?? "")} placeholder="انتخاب تاریخ تولد" />
                  <label className={styles.field}><span>جنسیت<i>*</i></span><SearchableDropdown value={form.jensiat} options={definitionOptions(PERSON_DFN_PID.gender)} onChange={(value) => change("jensiat", value)} compact /></label>
                  <label className={styles.field}><span>وضعیت حیات<i>*</i></span><SearchableDropdown value={form.life} options={definitionOptions(PERSON_DFN_PID.life)} onChange={(value) => change("life", value)} compact /></label>
                  <InputPersianDate label="تاریخ فوت" value={form.tarikhFoat} onChange={(value) => change("tarikhFoat", value ?? "")} placeholder="در صورت نیاز" />
                  <label className={styles.field}>
                    <span>کد ملی سرپرست</span>
                    <SearchableDropdown
                      value={form.codeMelliSarparast}
                      options={mainPersonOptions}
                      onChange={(value) => {
                        setSelectedMainPerson(
                          mainPersons.find((item) => item.CodeMelli === value) ?? null,
                        );
                        change("codeMelliSarparast", value);
                        if (!value) change("nesbat", "");
                      }}
                      onSearchChange={searchMainPersonOptions}
                      searchDelayMs={3000}
                      searching={mainPersonsSearching}
                      onClear={() => {
                        setSelectedMainPerson(null);
                        change("codeMelliSarparast", "");
                        change("nesbat", "");
                      }}
                      clearAriaLabel="حذف سرپرست انتخاب‌شده"
                      placeholder="انتخاب سرپرست (اختیاری)"
                      searchPlaceholder="جست‌وجوی نام یا کد ملی..."
                      ariaLabel="انتخاب کد ملی سرپرست"
                      compact
                    />
                  </label>
                  <label className={styles.field}><span>نسبت با سرپرست</span><SearchableDropdown value={form.nesbat} options={definitionOptions(PERSON_DFN_PID.relation)} onChange={(value) => change("nesbat", value)} compact /></label>
                </div>}

                {step === 1 && <div className={styles.formGrid}>
                  <label className={styles.field}><span>شهرستان تولد</span><SearchableDropdown value={form.mahalTavalod} options={cityOptions} onChange={(value) => change("mahalTavalod", value)} searchPlaceholder="جست‌وجوی شهرستان..." compact /></label>
                  <label className={styles.field}><span>شهرستان صدور</span><SearchableDropdown value={form.mahalSodor} options={cityOptions} onChange={(value) => change("mahalSodor", value)} searchPlaceholder="جست‌وجوی شهرستان..." compact /></label>
                  <TextField label="حرف سریال" value={form.serialHarf} onChange={(value) => change("serialHarf", value)} maxLength={3} />
                  <TextField label="سری شناسنامه" value={form.serialSeri} onChange={(value) => change("serialSeri", value)} maxLength={50} />
                  <TextField label="شماره سریال" value={form.serialCode} onChange={(value) => change("serialCode", value)} maxLength={50} />
                  <label className={styles.field}><span>وضعیت شناسنامه</span><SearchableDropdown value={form.almosana} options={definitionOptions(PERSON_DFN_PID.certificateStatus)} onChange={(value) => change("almosana", value)} compact /></label>
                  <TextField label="نام قبلی" value={form.firstNameOld} onChange={(value) => change("firstNameOld", value)} maxLength={250} />
                  <TextField label="نام خانوادگی قبلی" value={form.lastNameOld} onChange={(value) => change("lastNameOld", value)} maxLength={150} />
                  <label className={styles.field}><span>توضیحات دارد یا ندارد</span><SearchableDropdown value={form.taghyiratShenasnamehSet} options={definitionOptions(PERSON_DFN_PID.descriptionAvailability)} onChange={(value) => change("taghyiratShenasnamehSet", value)} compact /></label>
                  <TextAreaField
                    label="توضیحات شناسنامه"
                    value={form.taghyiratShenasnameh}
                    onChange={(value) => change("taghyiratShenasnameh", value)}
                    required={certificateDescriptionRequired}
                    error={certificateDescriptionInvalid}
                    hint={certificateDescriptionRequired ? "در صورت انتخاب «دارد»، حداقل ۶ کاراکتر وارد کنید." : undefined}
                  />
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
                  <TextField label="تلفن همراه" value={form.telHamrah} onChange={(value) => change("telHamrah", value)} placeholder="09xxxxxxxxx" maxLength={11} numeric largeLabel />
                  <TextField label="تلفن ضروری" value={form.telZaruri} onChange={(value) => change("telZaruri", value)} maxLength={15} numeric largeLabel />
                  <TextField label="ایمیل" value={form.email} onChange={(value) => change("email", value)} type="email" maxLength={1500} largeLabel />
                  <TextAreaField label="شرح معافیت" value={form.sharhMoaafiat} onChange={(value) => change("sharhMoaafiat", value)} largeLabel />
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
