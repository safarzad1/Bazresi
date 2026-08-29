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
  MaharatRayaneh: string | null;
  VazeyatJesmani: string | null;
  AddressManzel: string | null;
  TelSabet: string | null;
  CodeShahrestan: number | null;
  AddressKar: string | null;
  TelKar: string | null;

  NoeTahsil: string | null;
  SathTahsilHozavi: string | null;
  HamtarazTahsil: string | null;
  MahalTahsil: string | null;
  BalatarinMadrakTahsil: string | null;
  MahalAkhzMadrak: string | null;
  TarikhAkhzMadrak: string | null;

  VazeyatEshteghal: string | null;
  MahalKhedmatFeli: number | null;
  OnvanPostSazmani: string | null;
  TarikhEntesab: string | null;
  AkharinMahalKhedmat: number | null;
  AkharinPostSazmani: string | null;
  ModdatEntesab: string | null;
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
  maharatRayaneh: string;
  vazeyatJesmani: string;
  addressManzel: string;
  telSabet: string;
  codeShahrestan: string;
  addressKar: string;
  telKar: string;

  noeTahsil: string;
  sathTahsilHozavi: string;
  hamtarazTahsil: string;
  mahalTahsil: string;
  balatarinMadrakTahsil: string;
  mahalAkhzMadrak: string;
  tarikhAkhzMadrak: string;

  vazeyatEshteghal: string;
  mahalKhedmatFeli: string;
  onvanPostSazmani: string;
  tarikhEntesab: string;
  akharinMahalKhedmat: string;
  akharinPostSazmani: string;
  moddatEntesab: string;
};

type IsargariRow = {
  ID: number;
  PersonId: number;
  JebheSal: number | null; JebheMah: number | null; JebheRoz: number | null;
  Janbaz: boolean; DarsadJanbazi: number | null; MarjaTaeid: string | null;
  Azadeh: boolean; AsaratSal: number | null; AsaratMah: number | null; AsaratRoz: number | null;
  KhanevadeShahid: boolean; NameShahid: string | null; TarikhMahalShahadat: string | null; NesbatBaShahid: string | null;
};

type IsargariForm = {
  id: number; jebheSal: string; jebheMah: string; jebheRoz: string;
  janbaz: boolean; darsadJanbazi: string; marjaTaeid: string;
  azadeh: boolean; asaratSal: string; asaratMah: string; asaratRoz: string;
  khanevadeShahid: boolean; nameShahid: string; tarikhMahalShahadat: string; nesbatBaShahid: string;
};


type HamsarRow = {
  ID: number;
  PersonId: number;
  NameHamsar: string;
  ShoghlHamsar: string | null;
};

type HamsarForm = {
  nameHamsar: string;
  shoghlHamsar: string;
};

type FarzandRow = {
  ID: number;
  PersonId: number;
  NameFarzand: string;
  ShoghlFarzand: string | null;
};

type FarzandForm = {
  id: number;
  nameFarzand: string;
  shoghlFarzand: string;
};

type WorkHistoryRow = {
  ID: number;
  PersonId: number;
  Mahal: number | null;
  MahalName: string | null;
  SematPostSazmani: string | null;
  AzTarikh: string | null;
  TaTarikh: string | null;
  CreateUserId: string | null;
  CreateDateTime: string | null;
  EditUserId: string | null;
  EditDateTime: string | null;
};

type WorkHistoryForm = {
  id: number;
  mahal: string;
  sematPostSazmani: string;
  azTarikh: string;
  taTarikh: string;
};

type SabegeNezaratRow = {
  ID: number;
  PersonId: number;
  DoreEntekhabat: string;
  SematEntekhabat: string;
  Mahal: number;
  MahalName: string | null;
};

type SabegeNezaratForm = {
  id: number;
  doreEntekhabat: string;
  sematEntekhabat: string;
  mahal: string;
};

type SabegheFaliyatEjtemaiRow = {
  ID: number;
  PersonId: number;
  NameNahadTashakolHezb: string;
  Mahal: number;
  MahalName: string | null;
  AzTarikh: string | null;
  TaTarikh: string | null;
  Molahazat: string | null;
};

type SabegheFaliyatEjtemaiForm = {
  id: number;
  nameNahadTashakolHezb: string;
  mahal: string;
  azTarikh: string;
  taTarikh: string;
  molahazat: string;
};


type SabegheEntekhabatRow = {
  ID: number;
  PersonId: number;
  NoeEntekhabat: string;
  HozeEntekhabieh: string;
  Natijeh: string | null;
};

type SabegheEntekhabatForm = {
  id: number;
  noeEntekhabat: string;
  hozeEntekhabieh: string;
  natijeh: string;
};

type DoreAmozeshiRow = {
  ID: number;
  PersonId: number;
  NameDore: string;
  ModatSaat: number;
  NameMarkazMahalAmozesh: string;
  NoeMadrak: number;
  NoeMadrakName: string | null;
  TarikhAkhzMadrak: string | null;
};

type DoreAmozeshiForm = {
  id: number;
  nameDore: string;
  modatSaat: string;
  nameMarkazMahalAmozesh: string;
  noeMadrak: string;
  tarikhAkhzMadrak: string;
};

const emptyIsargariForm: IsargariForm = {
  id: 0, jebheSal: "", jebheMah: "", jebheRoz: "",
  janbaz: false, darsadJanbazi: "", marjaTaeid: "",
  azadeh: false, asaratSal: "", asaratMah: "", asaratRoz: "",
  khanevadeShahid: false, nameShahid: "", tarikhMahalShahadat: "", nesbatBaShahid: "",
};


const emptyHamsarForm: HamsarForm = {
  nameHamsar: "",
  shoghlHamsar: "",
};

const emptyFarzandForm: FarzandForm = {
  id: 0,
  nameFarzand: "",
  shoghlFarzand: "",
};

const emptyWorkHistoryForm: WorkHistoryForm = {
  id: 0,
  mahal: "",
  sematPostSazmani: "",
  azTarikh: "",
  taTarikh: "",
};

const emptySabegeNezaratForm: SabegeNezaratForm = {
  id: 0,
  doreEntekhabat: "",
  sematEntekhabat: "",
  mahal: "",
};

const emptySabegheFaliyatEjtemaiForm: SabegheFaliyatEjtemaiForm = {
  id: 0,
  nameNahadTashakolHezb: "",
  mahal: "",
  azTarikh: "",
  taTarikh: "",
  molahazat: "",
};


const emptySabegheEntekhabatForm: SabegheEntekhabatForm = {
  id: 0,
  noeEntekhabat: "",
  hozeEntekhabieh: "",
  natijeh: "",
};

const emptyDoreAmozeshiForm: DoreAmozeshiForm = {
  id: 0,
  nameDore: "",
  modatSaat: "",
  nameMarkazMahalAmozesh: "",
  noeMadrak: "",
  tarikhAkhzMadrak: "",
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
  maharatRayaneh: "",
  vazeyatJesmani: "",
  addressManzel: "",
  telSabet: "",
  codeShahrestan: "",
  addressKar: "",
  telKar: "",

  noeTahsil: "",
  sathTahsilHozavi: "",
  hamtarazTahsil: "",
  mahalTahsil: "",
  balatarinMadrakTahsil: "",
  mahalAkhzMadrak: "",
  tarikhAkhzMadrak: "",

  vazeyatEshteghal: "",
  mahalKhedmatFeli: "",
  onvanPostSazmani: "",
  tarikhEntesab: "",
  akharinMahalKhedmat: "",
  akharinPostSazmani: "",
  moddatEntesab: "",
};

const steps = [
  { title: "مشخصات فردی", subtitle: "اطلاعات اصلی و هویتی" },
  { title: "جزئیات شناسنامه", subtitle: "محل، سریال و تغییرات شناسنامه" },
  { title: "خدمت، تحصیل و اشتغال", subtitle: "نظام وظیفه، سوابق تحصیلی و وضعیت شغلی" },
  { title: "وضعیت عمومی", subtitle: "تأهل، مذهب، روحانیت و شغل" },
  { title: "اطلاعات تکمیلی", subtitle: "تماس، نشانی، رایانه و وضعیت جسمانی" },
];

const detailTabs = [
  { id: "details", title: "مشخصات فردی", isTable: true },
  { id: "sacrifice", title: "سابقه ایثارگری", isTable: true },
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
const wizardRemainingSections: Array<{ id: DetailTabId; title: string; subtitle: string }> = [
  { id: "sacrifice", title: "سابقه ایثارگری", subtitle: "جبهه، جانبازی، آزادگی و خانواده شهید" },
  { id: "family", title: "همسر و فرزندان", subtitle: "اطلاعات همسر و جدول فرزندان" },
  { id: "work-history", title: "سوابق شغلی", subtitle: "محل خدمت، سمت و تاریخ‌ها" },
  { id: "election-supervision", title: "سوابق نظارتی انتخابات", subtitle: "دوره، سمت انتخاباتی و محل" },
  { id: "social-activities", title: "فعالیت‌های اجتماعی", subtitle: "نهاد، محل فعالیت و مدت فعالیت" },
  { id: "training", title: "دوره‌های آموزشی", subtitle: "دوره‌های عمومی و تخصصی" },
  { id: "candidacy", title: "داوطلبی در انتخابات", subtitle: "نوع انتخابات، حوزه و نتیجه" },
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
    maharatRayaneh: person.MaharatRayaneh ?? "",
    vazeyatJesmani: person.VazeyatJesmani ?? "",
    addressManzel: person.AddressManzel ?? "",
    telSabet: person.TelSabet ?? "",
    codeShahrestan: value(person.CodeShahrestan),
    addressKar: person.AddressKar ?? "",
    telKar: person.TelKar ?? "",

    noeTahsil: person.NoeTahsil ?? "",
    sathTahsilHozavi: person.SathTahsilHozavi ?? "",
    hamtarazTahsil: person.HamtarazTahsil ?? "",
    mahalTahsil: person.MahalTahsil ?? "",
    balatarinMadrakTahsil: person.BalatarinMadrakTahsil ?? "",
    mahalAkhzMadrak: person.MahalAkhzMadrak ?? "",
    tarikhAkhzMadrak: person.TarikhAkhzMadrak ?? "",

    vazeyatEshteghal: person.VazeyatEshteghal ?? "",
    mahalKhedmatFeli: value(person.MahalKhedmatFeli),
    onvanPostSazmani: person.OnvanPostSazmani ?? "",
    tarikhEntesab: person.TarikhEntesab ?? "",
    akharinMahalKhedmat: value(person.AkharinMahalKhedmat),
    akharinPostSazmani: person.AkharinPostSazmani ?? "",
    moddatEntesab: person.ModdatEntesab ?? "",
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
  const [wizardDetailSection, setWizardDetailSection] = useState<DetailTabId | null>(null);
  const [hamsar, setHamsar] = useState<HamsarRow | null>(null);
  const [hamsarForm, setHamsarForm] = useState<HamsarForm>(emptyHamsarForm);
  const [hamsarLoading, setHamsarLoading] = useState(false);
  const [hamsarSaving, setHamsarSaving] = useState(false);
  const [hamsarModalOpen, setHamsarModalOpen] = useState(false);
  const [hamsarDeleteOpen, setHamsarDeleteOpen] = useState(false);

  const [farzandan, setFarzandan] = useState<FarzandRow[]>([]);
  const [farzandForm, setFarzandForm] = useState<FarzandForm>(emptyFarzandForm);
  const [farzandLoading, setFarzandLoading] = useState(false);
  const [farzandSaving, setFarzandSaving] = useState(false);
  const [farzandModalOpen, setFarzandModalOpen] = useState(false);
  const [farzandDeleteTarget, setFarzandDeleteTarget] = useState<FarzandRow | null>(null);
  const [isargari, setIsargari] = useState<IsargariRow | null>(null);
  const [isargariForm, setIsargariForm] = useState<IsargariForm>(emptyIsargariForm);
  const [isargariLoading, setIsargariLoading] = useState(false);
  const [isargariSaving, setIsargariSaving] = useState(false);
  const [isargariModalOpen, setIsargariModalOpen] = useState(false);
  const [isargariDeleteOpen, setIsargariDeleteOpen] = useState(false);
  const [workHistory, setWorkHistory] = useState<WorkHistoryRow[]>([]);
  const [workHistoryForm, setWorkHistoryForm] = useState<WorkHistoryForm>(emptyWorkHistoryForm);
  const [workHistoryLoading, setWorkHistoryLoading] = useState(false);
  const [workHistorySaving, setWorkHistorySaving] = useState(false);
  const [editingWorkHistoryId, setEditingWorkHistoryId] = useState<number | null>(null);
  const [workHistoryModalOpen, setWorkHistoryModalOpen] = useState(false);
  const [workHistoryDeleteTarget, setWorkHistoryDeleteTarget] = useState<WorkHistoryRow | null>(null);
  const [sabegeNezarat, setSabegeNezarat] = useState<SabegeNezaratRow[]>([]);
  const [sabegeNezaratForm, setSabegeNezaratForm] = useState<SabegeNezaratForm>(emptySabegeNezaratForm);
  const [sabegeNezaratLoading, setSabegeNezaratLoading] = useState(false);
  const [sabegeNezaratSaving, setSabegeNezaratSaving] = useState(false);
  const [editingSabegeNezaratId, setEditingSabegeNezaratId] = useState<number | null>(null);
  const [sabegeNezaratModalOpen, setSabegeNezaratModalOpen] = useState(false);
  const [sabegeNezaratDeleteTarget, setSabegeNezaratDeleteTarget] = useState<SabegeNezaratRow | null>(null);
  const [sabegheFaliyatEjtemai, setSabegheFaliyatEjtemai] = useState<SabegheFaliyatEjtemaiRow[]>([]);
  const [sabegheFaliyatEjtemaiForm, setSabegheFaliyatEjtemaiForm] = useState<SabegheFaliyatEjtemaiForm>(emptySabegheFaliyatEjtemaiForm);
  const [sabegheFaliyatEjtemaiLoading, setSabegheFaliyatEjtemaiLoading] = useState(false);
  const [sabegheFaliyatEjtemaiSaving, setSabegheFaliyatEjtemaiSaving] = useState(false);
  const [editingSabegheFaliyatEjtemaiId, setEditingSabegheFaliyatEjtemaiId] = useState<number | null>(null);
  const [sabegheFaliyatEjtemaiModalOpen, setSabegheFaliyatEjtemaiModalOpen] = useState(false);
  const [sabegheFaliyatEjtemaiDeleteTarget, setSabegheFaliyatEjtemaiDeleteTarget] = useState<SabegheFaliyatEjtemaiRow | null>(null);
  const [doreAmozeshi, setDoreAmozeshi] = useState<DoreAmozeshiRow[]>([]);
  const [doreAmozeshiForm, setDoreAmozeshiForm] = useState<DoreAmozeshiForm>(emptyDoreAmozeshiForm);
  const [doreAmozeshiLoading, setDoreAmozeshiLoading] = useState(false);
  const [doreAmozeshiSaving, setDoreAmozeshiSaving] = useState(false);
  const [editingDoreAmozeshiId, setEditingDoreAmozeshiId] = useState<number | null>(null);
  const [doreAmozeshiModalOpen, setDoreAmozeshiModalOpen] = useState(false);
  const [doreAmozeshiDeleteTarget, setDoreAmozeshiDeleteTarget] = useState<DoreAmozeshiRow | null>(null);
  const [sabegheEntekhabat, setSabegheEntekhabat] = useState<SabegheEntekhabatRow[]>([]);
  const [sabegheEntekhabatForm, setSabegheEntekhabatForm] = useState<SabegheEntekhabatForm>(emptySabegheEntekhabatForm);
  const [sabegheEntekhabatLoading, setSabegheEntekhabatLoading] = useState(false);
  const [sabegheEntekhabatSaving, setSabegheEntekhabatSaving] = useState(false);
  const [editingSabegheEntekhabatId, setEditingSabegheEntekhabatId] = useState<number | null>(null);
  const [sabegheEntekhabatModalOpen, setSabegheEntekhabatModalOpen] = useState(false);
  const [sabegheEntekhabatDeleteTarget, setSabegheEntekhabatDeleteTarget] = useState<SabegheEntekhabatRow | null>(null);
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

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "work-history" || form.personId <= 0) return;
    void loadWorkHistory(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "election-supervision" || form.personId <= 0) return;
    void loadSabegeNezarat(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "social-activities" || form.personId <= 0) return;
    void loadSabegheFaliyatEjtemai(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "sacrifice" || form.personId <= 0) return;
    void loadIsargari(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "family" || form.personId <= 0) return;
    void loadFamily(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "training" || form.personId <= 0) return;
    void loadDoreAmozeshi(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  useEffect(() => {
    if (!(detailOpen || wizardOpen) || detailTab !== "candidacy" || form.personId <= 0) return;
    void loadSabegheEntekhabat(form.personId);
  }, [detailOpen, wizardOpen, detailTab, form.personId]);

  function change<K extends keyof PersonForm>(key: K, value: PersonForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setDetailOpen(false);
    setWizardDetailSection(null);
    setDetailTab("details");
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
    setWorkHistory([]);
    setWorkHistoryDeleteTarget(null);
    resetWorkHistoryForm();
    setWorkHistoryModalOpen(false);
    setSabegeNezarat([]);
    setSabegeNezaratDeleteTarget(null);
    resetSabegeNezaratForm();
    setSabegeNezaratModalOpen(false);
    setSabegheFaliyatEjtemai([]);
    setSabegheFaliyatEjtemaiDeleteTarget(null);
    resetSabegheFaliyatEjtemaiForm();
    setSabegheFaliyatEjtemaiModalOpen(false);
    setDoreAmozeshi([]);
    setDoreAmozeshiDeleteTarget(null);
    resetDoreAmozeshiForm();
    setDoreAmozeshiModalOpen(false);
    setSabegheEntekhabat([]);
    setSabegheEntekhabatDeleteTarget(null);
    resetSabegheEntekhabatForm();
    setSabegheEntekhabatModalOpen(false);
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
    setWizardDetailSection(null);
    setDetailTab("details");
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

  function resetIsargariForm(row: IsargariRow | null = null) {
    if (!row) { setIsargariForm(emptyIsargariForm); return; }
    setIsargariForm({
      id: row.ID,
      jebheSal: row.JebheSal == null ? "" : String(row.JebheSal),
      jebheMah: row.JebheMah == null ? "" : String(row.JebheMah),
      jebheRoz: row.JebheRoz == null ? "" : String(row.JebheRoz),
      janbaz: Boolean(row.Janbaz), darsadJanbazi: row.DarsadJanbazi == null ? "" : String(row.DarsadJanbazi), marjaTaeid: row.MarjaTaeid ?? "",
      azadeh: Boolean(row.Azadeh), asaratSal: row.AsaratSal == null ? "" : String(row.AsaratSal), asaratMah: row.AsaratMah == null ? "" : String(row.AsaratMah), asaratRoz: row.AsaratRoz == null ? "" : String(row.AsaratRoz),
      khanevadeShahid: Boolean(row.KhanevadeShahid), nameShahid: row.NameShahid ?? "", tarikhMahalShahadat: row.TarikhMahalShahadat ?? "", nesbatBaShahid: row.NesbatBaShahid ?? "",
    });
  }

  async function loadFamily(personId: number) {
    if (!personId) return;
    setHamsarLoading(true);
    setFarzandLoading(true);
    try {
      const [hamsarData, farzandData] = await Promise.all([
        readJson(await fetch(`/api/persons/hamsar?personId=${personId}`, { cache: "no-store" })),
        readJson(await fetch(`/api/persons/farzand?personId=${personId}`, { cache: "no-store" })),
      ]);
      setHamsar((hamsarData.row as HamsarRow | null | undefined) ?? null);
      setFarzandan((farzandData.rows as FarzandRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات همسر و فرزندان انجام نشد." });
    } finally {
      setHamsarLoading(false);
      setFarzandLoading(false);
    }
  }

  function openHamsarForm() {
    setHamsarForm({
      nameHamsar: hamsar?.NameHamsar ?? "",
      shoghlHamsar: hamsar?.ShoghlHamsar ?? "",
    });
    setHamsarModalOpen(true);
  }

  async function saveHamsarRow() {
    if (!hamsarForm.nameHamsar.trim()) {
      setNotice({ type: "error", text: "نام و نام خانوادگی همسر را وارد کنید." });
      return;
    }
    setHamsarSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/hamsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: form.personId,
          nameHamsar: hamsarForm.nameHamsar,
          shoghlHamsar: hamsarForm.shoghlHamsar,
        }),
      }));
      setHamsar((data.row as HamsarRow | null | undefined) ?? null);
      setHamsarModalOpen(false);
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات همسر ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره اطلاعات همسر انجام نشد." });
    } finally {
      setHamsarSaving(false);
    }
  }

  async function deleteHamsarRow() {
    if (!hamsar) return;
    setHamsarSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/hamsar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: form.personId }),
      }));
      setHamsar(null);
      setHamsarForm(emptyHamsarForm);
      setHamsarDeleteOpen(false);
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات همسر حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف اطلاعات همسر انجام نشد." });
    } finally {
      setHamsarSaving(false);
    }
  }

  function openFarzandCreate() {
    if (farzandan.length >= 5) {
      setNotice({ type: "error", text: "حداکثر ۵ فرزند مطابق فرم قابل ثبت است." });
      return;
    }
    setFarzandForm(emptyFarzandForm);
    setFarzandModalOpen(true);
  }

  function editFarzandRow(row: FarzandRow) {
    setFarzandForm({
      id: row.ID,
      nameFarzand: row.NameFarzand ?? "",
      shoghlFarzand: row.ShoghlFarzand ?? "",
    });
    setFarzandModalOpen(true);
  }

  async function saveFarzandRow() {
    if (!farzandForm.nameFarzand.trim()) {
      setNotice({ type: "error", text: "نام و نام خانوادگی فرزند را وارد کنید." });
      return;
    }
    setFarzandSaving(true);
    try {
      const method = farzandForm.id > 0 ? "PUT" : "POST";
      const data = await readJson(await fetch("/api/persons/farzand", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: farzandForm.id,
          personId: form.personId,
          nameFarzand: farzandForm.nameFarzand,
          shoghlFarzand: farzandForm.shoghlFarzand,
        }),
      }));
      setFarzandModalOpen(false);
      setFarzandForm(emptyFarzandForm);
      await loadFamily(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات فرزند ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره اطلاعات فرزند انجام نشد." });
    } finally {
      setFarzandSaving(false);
    }
  }

  async function deleteFarzandRow() {
    if (!farzandDeleteTarget) return;
    setFarzandSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/farzand", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: farzandDeleteTarget.ID, personId: form.personId }),
      }));
      setFarzandDeleteTarget(null);
      await loadFamily(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات فرزند حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف اطلاعات فرزند انجام نشد." });
    } finally {
      setFarzandSaving(false);
    }
  }

  async function loadIsargari(personId: number) {
    setIsargariLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/isargari?personId=${personId}`, { cache: "no-store" }));
      setIsargari((data.row as IsargariRow | null | undefined) ?? null);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت اطلاعات ایثارگری انجام نشد." });
    } finally { setIsargariLoading(false); }
  }

  function openIsargariEditor() { resetIsargariForm(isargari); setIsargariModalOpen(true); }

  async function saveIsargariRow() {
    if (!form.personId || isargariSaving) return;
    if (isargariForm.janbaz) {
      const p = Number(isargariForm.darsadJanbazi);
      if (!Number.isInteger(p) || p < 1 || p > 100) { setNotice({ type: "error", text: "درصد جانبازی باید بین ۱ تا ۱۰۰ باشد." }); return; }
    }
    setIsargariSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/isargari", {
        method: isargari ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...isargariForm, personId: form.personId }),
      }));
      setIsargari((data.row as IsargariRow | null | undefined) ?? null);
      setIsargariModalOpen(false);
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات ایثارگری ذخیره شد.") });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره اطلاعات ایثارگری انجام نشد." }); }
    finally { setIsargariSaving(false); }
  }

  async function confirmDeleteIsargari() {
    if (!form.personId || isargariSaving) return;
    setIsargariSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/isargari", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: form.personId }) }));
      setIsargari(null); setIsargariDeleteOpen(false); resetIsargariForm();
      setNotice({ type: "success", text: String(data.message ?? "اطلاعات ایثارگری حذف شد.") });
    } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف اطلاعات ایثارگری انجام نشد." }); }
    finally { setIsargariSaving(false); }
  }

  function resetWorkHistoryForm() {
    setWorkHistoryForm(emptyWorkHistoryForm);
    setEditingWorkHistoryId(null);
  }

  async function loadWorkHistory(personId: number) {
    if (!personId) return;
    setWorkHistoryLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/shoghl?personId=${personId}`, { cache: "no-store" }));
      setWorkHistory((data.rows as WorkHistoryRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت سوابق شغلی انجام نشد." });
    } finally {
      setWorkHistoryLoading(false);
    }
  }


  async function saveWorkHistoryRow() {
    if (!workHistoryForm.mahal) {
      setNotice({ type: "error", text: "محل خدمت (شهرستان) را انتخاب کنید." });
      return;
    }
    if (!workHistoryForm.sematPostSazmani.trim()) {
      setNotice({ type: "error", text: "سمت (پست سازمانی) را وارد کنید." });
      return;
    }
    if (workHistoryForm.azTarikh && workHistoryForm.taTarikh && workHistoryForm.taTarikh < workHistoryForm.azTarikh) {
      setNotice({ type: "error", text: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد." });
      return;
    }

    setWorkHistorySaving(true);
    try {
      const method = editingWorkHistoryId === null ? "POST" : "PUT";
      const payload = {
        ...workHistoryForm,
        id: editingWorkHistoryId ?? 0,
        personId: form.personId,
      };
      const data = await readJson(await fetch("/api/persons/shoghl", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));

      resetWorkHistoryForm();
      setWorkHistoryModalOpen(false);
      await loadWorkHistory(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه شغلی ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره سابقه شغلی انجام نشد." });
    } finally {
      setWorkHistorySaving(false);
    }
  }

  function editWorkHistoryRow(row: WorkHistoryRow) {
    setWorkHistoryForm({
      id: row.ID,
      mahal: row.Mahal === null ? "" : String(row.Mahal),
      sematPostSazmani: row.SematPostSazmani ?? "",
      azTarikh: row.AzTarikh ?? "",
      taTarikh: row.TaTarikh ?? "",
    });
    setEditingWorkHistoryId(row.ID);
    setWorkHistoryModalOpen(true);
  }

  function openWorkHistoryCreate() {
    resetWorkHistoryForm();
    setWorkHistoryModalOpen(true);
  }

  async function confirmDeleteWorkHistory() {
    if (!workHistoryDeleteTarget) return;
    setWorkHistorySaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/shoghl", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: workHistoryDeleteTarget.ID, personId: form.personId }),
      }));
      setWorkHistoryDeleteTarget(null);
      await loadWorkHistory(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه شغلی حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف سابقه شغلی انجام نشد." });
    } finally {
      setWorkHistorySaving(false);
    }
  }

  function resetSabegeNezaratForm() {
    setSabegeNezaratForm(emptySabegeNezaratForm);
    setEditingSabegeNezaratId(null);
  }

  async function loadSabegeNezarat(personId: number) {
    if (!personId) return;
    setSabegeNezaratLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/sabege-nezarat?personId=${personId}`, { cache: "no-store" }));
      setSabegeNezarat((data.rows as SabegeNezaratRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت سوابق نظارتی و اجرایی انجام نشد." });
    } finally {
      setSabegeNezaratLoading(false);
    }
  }

  function openSabegeNezaratCreate() {
    resetSabegeNezaratForm();
    setSabegeNezaratModalOpen(true);
  }

  function editSabegeNezaratRow(row: SabegeNezaratRow) {
    setSabegeNezaratForm({
      id: row.ID,
      doreEntekhabat: row.DoreEntekhabat ?? "",
      sematEntekhabat: row.SematEntekhabat ?? "",
      mahal: row.Mahal ? String(row.Mahal) : "",
    });
    setEditingSabegeNezaratId(row.ID);
    setSabegeNezaratModalOpen(true);
  }

  async function saveSabegeNezaratRow() {
    if (!sabegeNezaratForm.doreEntekhabat.trim()) {
      setNotice({ type: "error", text: "دوره انتخاباتی را وارد کنید." });
      return;
    }
    if (!sabegeNezaratForm.sematEntekhabat.trim()) {
      setNotice({ type: "error", text: "سمت انتخاباتی را وارد کنید." });
      return;
    }
    if (!sabegeNezaratForm.mahal) {
      setNotice({ type: "error", text: "محل را انتخاب کنید." });
      return;
    }

    setSabegeNezaratSaving(true);
    try {
      const method = editingSabegeNezaratId === null ? "POST" : "PUT";
      const payload = {
        id: editingSabegeNezaratId ?? 0,
        personId: form.personId,
        doreEntekhabat: sabegeNezaratForm.doreEntekhabat,
        sematEntekhabat: sabegeNezaratForm.sematEntekhabat,
        mahal: Number(sabegeNezaratForm.mahal),
      };
      const data = await readJson(await fetch("/api/persons/sabege-nezarat", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      resetSabegeNezaratForm();
      setSabegeNezaratModalOpen(false);
      await loadSabegeNezarat(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه نظارتی ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره سابقه نظارتی انجام نشد." });
    } finally {
      setSabegeNezaratSaving(false);
    }
  }

  async function confirmDeleteSabegeNezarat() {
    if (!sabegeNezaratDeleteTarget) return;
    setSabegeNezaratSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/sabege-nezarat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sabegeNezaratDeleteTarget.ID, personId: form.personId }),
      }));
      setSabegeNezaratDeleteTarget(null);
      await loadSabegeNezarat(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه نظارتی حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف سابقه نظارتی انجام نشد." });
    } finally {
      setSabegeNezaratSaving(false);
    }
  }

  function resetSabegheFaliyatEjtemaiForm() {
    setSabegheFaliyatEjtemaiForm(emptySabegheFaliyatEjtemaiForm);
    setEditingSabegheFaliyatEjtemaiId(null);
  }

  async function loadSabegheFaliyatEjtemai(personId: number) {
    if (!personId) return;
    setSabegheFaliyatEjtemaiLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/sabeghe-faliyat-ejtemai?personId=${personId}`, { cache: "no-store" }));
      setSabegheFaliyatEjtemai((data.rows as SabegheFaliyatEjtemaiRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت سوابق فعالیت‌های اجتماعی انجام نشد." });
    } finally {
      setSabegheFaliyatEjtemaiLoading(false);
    }
  }

  function openSabegheFaliyatEjtemaiCreate() {
    resetSabegheFaliyatEjtemaiForm();
    setSabegheFaliyatEjtemaiModalOpen(true);
  }

  function editSabegheFaliyatEjtemaiRow(row: SabegheFaliyatEjtemaiRow) {
    setSabegheFaliyatEjtemaiForm({
      id: row.ID,
      nameNahadTashakolHezb: row.NameNahadTashakolHezb ?? "",
      mahal: row.Mahal ? String(row.Mahal) : "",
      azTarikh: row.AzTarikh ?? "",
      taTarikh: row.TaTarikh ?? "",
      molahazat: row.Molahazat ?? "",
    });
    setEditingSabegheFaliyatEjtemaiId(row.ID);
    setSabegheFaliyatEjtemaiModalOpen(true);
  }

  async function saveSabegheFaliyatEjtemaiRow() {
    if (!sabegheFaliyatEjtemaiForm.nameNahadTashakolHezb.trim()) {
      setNotice({ type: "error", text: "نام نهاد، تشکل یا حزب را وارد کنید." });
      return;
    }
    if (!sabegheFaliyatEjtemaiForm.mahal) {
      setNotice({ type: "error", text: "محل فعالیت را انتخاب کنید." });
      return;
    }

    setSabegheFaliyatEjtemaiSaving(true);
    try {
      const method = editingSabegheFaliyatEjtemaiId === null ? "POST" : "PUT";
      const payload = {
        id: editingSabegheFaliyatEjtemaiId ?? 0,
        personId: form.personId,
        nameNahadTashakolHezb: sabegheFaliyatEjtemaiForm.nameNahadTashakolHezb,
        mahal: Number(sabegheFaliyatEjtemaiForm.mahal),
        azTarikh: sabegheFaliyatEjtemaiForm.azTarikh,
        taTarikh: sabegheFaliyatEjtemaiForm.taTarikh,
        molahazat: sabegheFaliyatEjtemaiForm.molahazat,
      };
      const data = await readJson(await fetch("/api/persons/sabeghe-faliyat-ejtemai", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      resetSabegheFaliyatEjtemaiForm();
      setSabegheFaliyatEjtemaiModalOpen(false);
      await loadSabegheFaliyatEjtemai(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه فعالیت اجتماعی ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره سابقه فعالیت اجتماعی انجام نشد." });
    } finally {
      setSabegheFaliyatEjtemaiSaving(false);
    }
  }

  async function confirmDeleteSabegheFaliyatEjtemai() {
    if (!sabegheFaliyatEjtemaiDeleteTarget) return;
    setSabegheFaliyatEjtemaiSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/sabeghe-faliyat-ejtemai", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sabegheFaliyatEjtemaiDeleteTarget.ID, personId: form.personId }),
      }));
      setSabegheFaliyatEjtemaiDeleteTarget(null);
      await loadSabegheFaliyatEjtemai(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه فعالیت اجتماعی حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف سابقه فعالیت اجتماعی انجام نشد." });
    } finally {
      setSabegheFaliyatEjtemaiSaving(false);
    }
  }

  function resetDoreAmozeshiForm() {
    setDoreAmozeshiForm(emptyDoreAmozeshiForm);
    setEditingDoreAmozeshiId(null);
  }

  async function loadDoreAmozeshi(personId: number) {
    if (!personId) return;
    setDoreAmozeshiLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/dore-amoozeshi?personId=${personId}`, { cache: "no-store" }));
      setDoreAmozeshi((data.rows as DoreAmozeshiRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت دوره‌های آموزشی انجام نشد." });
    } finally {
      setDoreAmozeshiLoading(false);
    }
  }

  function openDoreAmozeshiCreate() {
    resetDoreAmozeshiForm();
    setDoreAmozeshiModalOpen(true);
  }

  function editDoreAmozeshiRow(row: DoreAmozeshiRow) {
    setDoreAmozeshiForm({
      id: row.ID,
      nameDore: row.NameDore ?? "",
      modatSaat: row.ModatSaat ? String(row.ModatSaat) : "",
      nameMarkazMahalAmozesh: row.NameMarkazMahalAmozesh ?? "",
      noeMadrak: row.NoeMadrak ? String(row.NoeMadrak) : "",
      tarikhAkhzMadrak: row.TarikhAkhzMadrak ?? "",
    });
    setEditingDoreAmozeshiId(row.ID);
    setDoreAmozeshiModalOpen(true);
  }

  async function saveDoreAmozeshiRow() {
    if (!doreAmozeshiForm.nameDore.trim()) {
      setNotice({ type: "error", text: "نام دوره را وارد کنید." });
      return;
    }
    const hours = Number(doreAmozeshiForm.modatSaat.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))));
    if (!Number.isFinite(hours) || hours <= 0) {
      setNotice({ type: "error", text: "مدت دوره به ساعت را صحیح وارد کنید." });
      return;
    }
    if (!doreAmozeshiForm.nameMarkazMahalAmozesh.trim()) {
      setNotice({ type: "error", text: "نام مرکز و محل آموزش را وارد کنید." });
      return;
    }
    if (!doreAmozeshiForm.noeMadrak) {
      setNotice({ type: "error", text: "نوع مدرک را انتخاب کنید." });
      return;
    }

    setDoreAmozeshiSaving(true);
    try {
      const method = editingDoreAmozeshiId === null ? "POST" : "PUT";
      const payload = {
        id: editingDoreAmozeshiId ?? 0,
        personId: form.personId,
        nameDore: doreAmozeshiForm.nameDore,
        modatSaat: hours,
        nameMarkazMahalAmozesh: doreAmozeshiForm.nameMarkazMahalAmozesh,
        noeMadrak: Number(doreAmozeshiForm.noeMadrak),
        tarikhAkhzMadrak: doreAmozeshiForm.tarikhAkhzMadrak,
      };
      const data = await readJson(await fetch("/api/persons/dore-amoozeshi", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      resetDoreAmozeshiForm();
      setDoreAmozeshiModalOpen(false);
      await loadDoreAmozeshi(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "دوره آموزشی ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره دوره آموزشی انجام نشد." });
    } finally {
      setDoreAmozeshiSaving(false);
    }
  }

  async function confirmDeleteDoreAmozeshi() {
    if (!doreAmozeshiDeleteTarget) return;
    setDoreAmozeshiSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/dore-amoozeshi", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doreAmozeshiDeleteTarget.ID, personId: form.personId }),
      }));
      setDoreAmozeshiDeleteTarget(null);
      await loadDoreAmozeshi(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "دوره آموزشی حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف دوره آموزشی انجام نشد." });
    } finally {
      setDoreAmozeshiSaving(false);
    }
  }


  function resetSabegheEntekhabatForm() {
    setSabegheEntekhabatForm(emptySabegheEntekhabatForm);
    setEditingSabegheEntekhabatId(null);
  }

  async function loadSabegheEntekhabat(personId: number) {
    if (!personId) return;
    setSabegheEntekhabatLoading(true);
    try {
      const data = await readJson(await fetch(`/api/persons/sabeghe-entekhabat?personId=${personId}`, { cache: "no-store" }));
      setSabegheEntekhabat((data.rows as SabegheEntekhabatRow[] | undefined) ?? []);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "دریافت سوابق داوطلبی در انتخابات انجام نشد." });
    } finally {
      setSabegheEntekhabatLoading(false);
    }
  }

  function openSabegheEntekhabatCreate() {
    resetSabegheEntekhabatForm();
    setSabegheEntekhabatModalOpen(true);
  }

  function editSabegheEntekhabatRow(row: SabegheEntekhabatRow) {
    setSabegheEntekhabatForm({
      id: row.ID,
      noeEntekhabat: row.NoeEntekhabat ?? "",
      hozeEntekhabieh: row.HozeEntekhabieh ?? "",
      natijeh: row.Natijeh ?? "",
    });
    setEditingSabegheEntekhabatId(row.ID);
    setSabegheEntekhabatModalOpen(true);
  }

  async function saveSabegheEntekhabatRow() {
    if (!sabegheEntekhabatForm.noeEntekhabat.trim()) {
      setNotice({ type: "error", text: "نوع انتخابات را وارد کنید." });
      return;
    }
    if (!sabegheEntekhabatForm.hozeEntekhabieh.trim()) {
      setNotice({ type: "error", text: "حوزه انتخابیه را وارد کنید." });
      return;
    }

    setSabegheEntekhabatSaving(true);
    try {
      const method = editingSabegheEntekhabatId === null ? "POST" : "PUT";
      const payload = {
        id: editingSabegheEntekhabatId ?? 0,
        personId: form.personId,
        noeEntekhabat: sabegheEntekhabatForm.noeEntekhabat,
        hozeEntekhabieh: sabegheEntekhabatForm.hozeEntekhabieh,
        natijeh: sabegheEntekhabatForm.natijeh,
      };
      const data = await readJson(await fetch("/api/persons/sabeghe-entekhabat", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }));
      resetSabegheEntekhabatForm();
      setSabegheEntekhabatModalOpen(false);
      await loadSabegheEntekhabat(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه داوطلبی ذخیره شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "ذخیره سابقه داوطلبی انجام نشد." });
    } finally {
      setSabegheEntekhabatSaving(false);
    }
  }

  async function confirmDeleteSabegheEntekhabat() {
    if (!sabegheEntekhabatDeleteTarget) return;
    setSabegheEntekhabatSaving(true);
    try {
      const data = await readJson(await fetch("/api/persons/sabeghe-entekhabat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sabegheEntekhabatDeleteTarget.ID, personId: form.personId }),
      }));
      setSabegheEntekhabatDeleteTarget(null);
      await loadSabegheEntekhabat(form.personId);
      setNotice({ type: "success", text: String(data.message ?? "سابقه داوطلبی حذف شد.") });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "حذف سابقه داوطلبی انجام نشد." });
    } finally {
      setSabegheEntekhabatSaving(false);
    }
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
    setWizardDetailSection(null);
    setDetailTab("details");
    setWizardOpen(false);
    setFinalConfirm(false);
    setSelectedImage(null);
    setPreviewUrl("");
  }

  function openWizardRemainingSection(tab: DetailTabId) {
    if (!form.personId || saving || loadingDetail) return;
    setFinalConfirm(false);
    setSectionEdit(null);
    sectionEditBackup.current = null;
    setDetailTab(tab);
    setWizardDetailSection(tab);
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
      if (!form.nezamVazifeh) return "وضعیت نظام وظیفه را انتخاب کنید.";
    }
    if (currentStep === 3) {
      if (form.shoghl.trim().length < 2) return "شغل را وارد کنید.";
      if (!form.taahol || !form.dinMazhab || !form.rohani) return "وضعیت تأهل، دین و مذهب و وضعیت روحانیت را انتخاب کنید.";
    }
    if (currentStep === 4) {
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

      if (step === 3) {
        const personId = await saveDraft(false);
        if (personId) {
          setDetailTab("sacrifice");
          setWizardDetailSection("sacrifice");
        }
        return;
      }

      if (step === 4) {
        if (form.registrationState === 0) await saveDraft(false);
        setStep(5);
        return;
      }

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
    const error = stepError(0) || stepError(2) || stepError(3);
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

  const militaryStatusTitle = lookupTitle(PERSON_DFN_PID.militaryStatus, form.nezamVazifeh);
  const militaryIsExempt = militaryStatusTitle.includes("معاف");
  const militaryIsCompleted = Boolean(form.nezamVazifeh) && !militaryIsExempt;

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
    ["نوع تحصیل", form.noeTahsil || "—"],
    ["سطح تحصیل حوزوی", form.sathTahsilHozavi || "—"],
    ["همتراز (معادل)", form.hamtarazTahsil || "—"],
    ["محل تحصیل", form.mahalTahsil || "—"],
    ["بالاترین مدرک تحصیلی", form.balatarinMadrakTahsil || "—"],
    ["محل اخذ مدرک", form.mahalAkhzMadrak || "—"],
    ["تاریخ اخذ مدرک", form.tarikhAkhzMadrak || "—"],
    ["وضعیت اشتغال", form.vazeyatEshteghal || "—"],
    ["محل خدمت فعلی", cityTitle(form.mahalKhedmatFeli)],
    ["عنوان پست سازمانی", form.onvanPostSazmani || "—"],
    ["تاریخ انتصاب", form.tarikhEntesab || "—"],
    ["آخرین محل خدمت", cityTitle(form.akharinMahalKhedmat)],
    ["آخرین پست سازمانی", form.akharinPostSazmani || "—"],
    ["مدت انتصاب", form.moddatEntesab || "—"],
    ["مهارت رایانه در امور اداری", form.maharatRayaneh || "—"],
    ["وضعیت جسمانی", form.vazeyatJesmani || "—"],
    ["آدرس محل سکونت", form.addressManzel || "—"],
    ["تلفن ثابت", form.telSabet || "—"],
    ["کد شهرستان", cityTitle(form.codeShahrestan)],
    ["شماره همراه", form.telHamrah || "—"],
    ["تماس ضروری", form.telZaruri || "—"],
    ["آدرس محل کار", form.addressKar || "—"],
    ["تلفن محل کار", form.telKar || "—"],
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
  const wizardStageNumber =
    wizardDetailSection
      ? 5 + Math.max(0, wizardRemainingSections.findIndex((item) => item.id === wizardDetailSection))
      : step === 4
        ? 12
        : step === 5
          ? 13
          : step + 1;
  const wizardProgressValue = Math.round((wizardStageNumber / 13) * 100);
  const currentWizardStageTitle =
    wizardDetailSection
      ? wizardRemainingSections.find((item) => item.id === wizardDetailSection)?.title ?? "اطلاعات پرونده"
      : step === 4
        ? "اطلاعات تکمیلی"
        : step === 5
          ? "تصویر و بازبینی"
          : steps[step]?.title ?? "ثبت اطلاعات";

  const currentWizardStageSubtitle =
    wizardDetailSection
      ? wizardRemainingSections.find((item) => item.id === wizardDetailSection)?.subtitle ?? ""
      : step === 4
        ? "تماس، نشانی، رایانه و وضعیت جسمانی"
        : step === 5
          ? "تصویر پرسنلی و مرور نهایی پرونده"
          : steps[step]?.subtitle ?? "";
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
        { label: "مهارت رایانه در امور اداری", value: form.maharatRayaneh },
        { label: "وضعیت جسمانی", value: form.vazeyatJesmani },
        { label: "آدرس محل سکونت", value: form.addressManzel },
        { label: "تلفن ثابت", value: form.telSabet },
        { label: "کد شهرستان", value: cityTitle(form.codeShahrestan) },
        { label: "تلفن همراه", value: form.telHamrah },
        { label: "تلفن ضروری", value: form.telZaruri },
        { label: "آدرس محل کار", value: form.addressKar },
        { label: "تلفن محل کار", value: form.telKar },
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
                    <button className={styles.caseAction} type="button" onClick={(event) => { event.stopPropagation(); window.location.assign(`/Admin/Persons/CaseFile?personId=${person.PersonId}`); }} title="پرونده الکترونیکی"><Icon name="file" /></button>
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
            ) : detailTab === "sacrifice" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div><span>سابقه ایثارگری</span><h3>جبهه، جانبازی، آزادگی و خانواده شهید</h3><small>{isargari ? "اطلاعات ثبت شده است" : "هنوز اطلاعاتی ثبت نشده است"}</small></div>
                    <div className={styles.workHistoryActions}>
                      <button type="button" className={styles.workHistoryAddButton} onClick={openIsargariEditor} disabled={isargariLoading || isargariSaving}><Icon name={isargari ? "edit" : "plus"} />{isargari ? "ویرایش" : "ثبت اطلاعات"}</button>
                      {isargari && <button type="button" className={styles.deleteAction} onClick={() => setIsargariDeleteOpen(true)} title="حذف" disabled={isargariSaving}><Icon name="trash" /></button>}
                    </div>
                  </header>
                  {isargariLoading ? (
                    <div className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت اطلاعات ایثارگری...</div>
                  ) : !isargari ? (
                    <div className={styles.isargariEmptyState}>
                      <Icon name="file" />
                      <strong>اطلاعات ایثارگری ثبت نشده است</strong>
                      <span>برای ثبت اطلاعات از دکمه «ثبت اطلاعات» استفاده کنید.</span>
                    </div>
                  ) : (
                    <div className={styles.isargariSummaryGrid}>
                      <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                        <span>میزان حضور در جبهه‌های حق علیه باطل</span>
                        <strong>{`${isargari.JebheSal ?? 0} سال، ${isargari.JebheMah ?? 0} ماه، ${isargari.JebheRoz ?? 0} روز`}</strong>
                      </div>

                      <div className={styles.isargariSummaryItem}>
                        <span>جانباز</span>
                        <strong>{isargari.Janbaz ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.Janbaz && (
                        <>
                          <div className={styles.isargariSummaryItem}>
                            <span>درصد جانبازی</span>
                            <strong>{`${isargari.DarsadJanbazi ?? 0}٪`}</strong>
                          </div>
                          <div className={styles.isargariSummaryItem}>
                            <span>مرجع تأییدکننده</span>
                            <strong>{isargari.MarjaTaeid || "—"}</strong>
                          </div>
                        </>
                      )}

                      <div className={styles.isargariSummaryItem}>
                        <span>آزاده</span>
                        <strong>{isargari.Azadeh ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.Azadeh && (
                        <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                          <span>جمع مدت اسارت</span>
                          <strong>{`${isargari.AsaratSal ?? 0} سال، ${isargari.AsaratMah ?? 0} ماه، ${isargari.AsaratRoz ?? 0} روز`}</strong>
                        </div>
                      )}

                      <div className={styles.isargariSummaryItem}>
                        <span>خانواده شهید</span>
                        <strong>{isargari.KhanevadeShahid ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.KhanevadeShahid && (
                        <>
                          <div className={styles.isargariSummaryItem}>
                            <span>نام شهید (شهدا)</span>
                            <strong>{isargari.NameShahid || "—"}</strong>
                          </div>
                          <div className={styles.isargariSummaryItem}>
                            <span>نسبت با شهید</span>
                            <strong>{isargari.NesbatBaShahid || "—"}</strong>
                          </div>
                          <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                            <span>تاریخ و محل شهادت</span>
                            <strong>{isargari.TarikhMahalShahadat || "—"}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </section>
              </div>
            ) : detailTab === "family" ? (
              <div className={styles.detailBody}>
                <section className={styles.familyPanel}>
                  <header className={styles.familyPanelHeader}>
                    <div>
                      <span>اطلاعات خانوادگی</span>
                      <h3>همسر و فرزندان</h3>
                    </div>
                    <span>{farzandan.length.toLocaleString("fa-IR")} فرزند ثبت‌شده</span>
                  </header>

                  <div className={styles.familySpouseCard}>
                    <div className={styles.familySpouseHeader}>
                      <div>
                        <span>اطلاعات همسر</span>
                        <small>نام و نام خانوادگی و شغل همسر</small>
                      </div>
                      <div className={styles.familyCardActions}>
                        <button type="button" className={styles.editAction} onClick={openHamsarForm} disabled={hamsarSaving || hamsarLoading} title={hamsar ? "ویرایش اطلاعات همسر" : "ثبت اطلاعات همسر"}>
                          <Icon name={hamsar ? "edit" : "plus"} />
                        </button>
                        {hamsar && (
                          <button type="button" className={styles.deleteAction} onClick={() => setHamsarDeleteOpen(true)} disabled={hamsarSaving} title="حذف اطلاعات همسر">
                            <Icon name="trash" />
                          </button>
                        )}
                      </div>
                    </div>

                    {hamsarLoading ? (
                      <div className={styles.familyEmpty}><span className={styles.spinner} /> در حال دریافت اطلاعات همسر...</div>
                    ) : hamsar ? (
                      <div className={styles.familySummary}>
                        <div><span>نام و نام خانوادگی همسر</span><strong>{hamsar.NameHamsar || "—"}</strong></div>
                        <div><span>شغل همسر</span><strong>{hamsar.ShoghlHamsar || "—"}</strong></div>
                        <div><span>تعداد فرزندان</span><strong>{farzandan.length.toLocaleString("fa-IR")}</strong></div>
                      </div>
                    ) : (
                      <div className={styles.familyEmpty}>اطلاعات همسر ثبت نشده است.</div>
                    )}
                  </div>

                  <section className={styles.familyChildrenCard}>
                    <header className={styles.familyChildrenHeader}>
                      <div>
                        <span>فرزندان</span>
                        <small>حداکثر ۵ ردیف مطابق فرم اطلاعات فردی</small>
                      </div>
                      <button type="button" className={styles.workHistoryAddButton} onClick={openFarzandCreate} disabled={farzandSaving || farzandan.length >= 5}>
                        <Icon name="plus" />فرزند جدید
                      </button>
                    </header>

                    <div className={styles.familyTableWrap}>
                      <table className={styles.familyTable}>
                        <thead>
                          <tr><th>ردیف</th><th>نام و نام خانوادگی</th><th>شغل</th><th>عملیات</th></tr>
                        </thead>
                        <tbody>
                          {farzandLoading && (
                            <tr><td colSpan={4} className={styles.familyEmpty}><span className={styles.spinner} /> در حال دریافت فرزندان...</td></tr>
                          )}
                          {!farzandLoading && farzandan.map((row, index) => (
                            <tr key={row.ID}>
                              <td>{(index + 1).toLocaleString("fa-IR")}</td>
                              <td><strong>{row.NameFarzand || "—"}</strong></td>
                              <td>{row.ShoghlFarzand || "—"}</td>
                              <td>
                                <div className={styles.workHistoryActions}>
                                  <button type="button" className={styles.editAction} onClick={() => editFarzandRow(row)} disabled={farzandSaving} title="ویرایش"><Icon name="edit" /></button>
                                  <button type="button" className={styles.deleteAction} onClick={() => setFarzandDeleteTarget(row)} disabled={farzandSaving} title="حذف"><Icon name="trash" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!farzandLoading && farzandan.length === 0 && (
                            <tr><td colSpan={4} className={styles.familyEmpty}>هنوز فرزندی ثبت نشده است.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
              </div>
            ) : detailTab === "work-history" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق شغلی</span>
                      <h3>محل خدمت، سمت و زمان خدمت</h3>
                      <small>{workHistory.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openWorkHistoryCreate} disabled={workHistorySaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>محل خدمت</th>
                          <th>سمت (پست سازمانی)</th>
                          <th>از تاریخ</th>
                          <th>تا تاریخ</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workHistoryLoading && (
                          <tr><td colSpan={6} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق شغلی...</td></tr>
                        )}
                        {!workHistoryLoading && workHistory.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.MahalName || (row.Mahal ? cityTitle(String(row.Mahal)) : "—")}</strong></td>
                            <td>{row.SematPostSazmani || "—"}</td>
                            <td>{row.AzTarikh || "—"}</td>
                            <td>{row.TaTarikh || "تا اکنون"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editWorkHistoryRow(row)} title="ویرایش" disabled={workHistorySaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setWorkHistoryDeleteTarget(row)} title="حذف" disabled={workHistorySaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!workHistoryLoading && workHistory.length === 0 && (
                          <tr><td colSpan={6} className={styles.workHistoryEmpty}>هنوز سابقه شغلی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : detailTab === "election-supervision" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق نظارتی و اجرایی انتخابات</span>
                      <h3>دوره، سمت انتخاباتی و محل</h3>
                      <small>{sabegeNezarat.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegeNezaratCreate} disabled={sabegeNezaratSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>دوره انتخاباتی</th>
                          <th>سمت انتخاباتی</th>
                          <th>محل</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegeNezaratLoading && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق نظارتی...</td></tr>
                        )}
                        {!sabegeNezaratLoading && sabegeNezarat.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.DoreEntekhabat || "—"}</strong></td>
                            <td>{row.SematEntekhabat || "—"}</td>
                            <td>{row.MahalName || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegeNezaratRow(row)} title="ویرایش" disabled={sabegeNezaratSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegeNezaratDeleteTarget(row)} title="حذف" disabled={sabegeNezaratSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegeNezaratLoading && sabegeNezarat.length === 0 && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}>هنوز سابقه نظارتی و اجرایی انتخابات ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : detailTab === "social-activities" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق فعالیت‌های اجتماعی</span>
                      <h3>نام نهاد، محل فعالیت، مدت فعالیت و ملاحظات</h3>
                      <small>{sabegheFaliyatEjtemai.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegheFaliyatEjtemaiCreate} disabled={sabegheFaliyatEjtemaiSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نام نهاد، تشکل یا حزب</th>
                          <th>محل فعالیت</th>
                          <th>از تاریخ</th>
                          <th>تا تاریخ</th>
                          <th>ملاحظات</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegheFaliyatEjtemaiLoading && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق فعالیت‌های اجتماعی...</td></tr>
                        )}
                        {!sabegheFaliyatEjtemaiLoading && sabegheFaliyatEjtemai.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NameNahadTashakolHezb || "—"}</strong></td>
                            <td>{row.MahalName || (row.Mahal ? cityTitle(String(row.Mahal)) : "—")}</td>
                            <td>{row.AzTarikh || "—"}</td>
                            <td>{row.TaTarikh || "—"}</td>
                            <td>{row.Molahazat || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegheFaliyatEjtemaiRow(row)} title="ویرایش" disabled={sabegheFaliyatEjtemaiSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegheFaliyatEjtemaiDeleteTarget(row)} title="حذف" disabled={sabegheFaliyatEjtemaiSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegheFaliyatEjtemaiLoading && sabegheFaliyatEjtemai.length === 0 && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}>هنوز سابقه فعالیت اجتماعی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : detailTab === "training" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>دوره‌های آموزشی عمومی و تخصصی</span>
                      <h3>نام دوره، مدت دوره، مرکز آموزش، نوع مدرک و تاریخ اخذ مدرک</h3>
                      <small>{doreAmozeshi.length.toLocaleString("fa-IR")} دوره ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openDoreAmozeshiCreate} disabled={doreAmozeshiSaving}>
                      <Icon name="plus" />دوره جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نام دوره</th>
                          <th>مدت دوره (ساعت)</th>
                          <th>نام مرکز و محل آموزش</th>
                          <th>نوع مدرک</th>
                          <th>تاریخ اخذ مدرک</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doreAmozeshiLoading && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت دوره‌های آموزشی...</td></tr>
                        )}
                        {!doreAmozeshiLoading && doreAmozeshi.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NameDore || "—"}</strong></td>
                            <td>{Number(row.ModatSaat || 0).toLocaleString("fa-IR")}</td>
                            <td>{row.NameMarkazMahalAmozesh || "—"}</td>
                            <td>{row.NoeMadrakName || lookupTitle(PERSON_DFN_PID.educationCertificateType, String(row.NoeMadrak)) || "—"}</td>
                            <td>{row.TarikhAkhzMadrak || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editDoreAmozeshiRow(row)} title="ویرایش" disabled={doreAmozeshiSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setDoreAmozeshiDeleteTarget(row)} title="حذف" disabled={doreAmozeshiSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!doreAmozeshiLoading && doreAmozeshi.length === 0 && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}>هنوز دوره آموزشی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : detailTab === "candidacy" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سابقه داوطلبی در انتخابات</span>
                      <h3>نوع انتخابات، حوزه انتخابیه و نتیجه</h3>
                      <small>{sabegheEntekhabat.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegheEntekhabatCreate} disabled={sabegheEntekhabatSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نوع انتخابات</th>
                          <th>حوزه انتخابیه</th>
                          <th>نتیجه</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegheEntekhabatLoading && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق داوطلبی...</td></tr>
                        )}
                        {!sabegheEntekhabatLoading && sabegheEntekhabat.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NoeEntekhabat || "—"}</strong></td>
                            <td>{row.HozeEntekhabieh || "—"}</td>
                            <td>{row.Natijeh || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegheEntekhabatRow(row)} title="ویرایش" disabled={sabegheEntekhabatSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegheEntekhabatDeleteTarget(row)} title="حذف" disabled={sabegheEntekhabatSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegheEntekhabatLoading && sabegheEntekhabat.length === 0 && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}>هنوز سابقه داوطلبی در انتخابات ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : null}


            {hamsarModalOpen && detailTab === "family" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label="اطلاعات همسر">
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="persons" /></span>
                      <div><small>اطلاعات خانوادگی</small><h3>{hamsar ? "ویرایش اطلاعات همسر" : "ثبت اطلاعات همسر"}</h3></div>
                    </div>
                    <button type="button" disabled={hamsarSaving} onClick={() => setHamsarModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                  </header>
                  <div className={styles.workHistoryForm}>
                    <TextField label="نام و نام خانوادگی همسر" value={hamsarForm.nameHamsar} onChange={(value) => setHamsarForm((current) => ({ ...current, nameHamsar: value }))} required maxLength={250} />
                    <TextField label="شغل همسر" value={hamsarForm.shoghlHamsar} onChange={(value) => setHamsarForm((current) => ({ ...current, shoghlHamsar: value }))} maxLength={250} />
                  </div>
                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={hamsarSaving} onClick={() => setHamsarModalOpen(false)}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} disabled={hamsarSaving} onClick={() => void saveHamsarRow()}>
                      {hamsarSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {hamsar ? "ذخیره تغییرات" : "ثبت اطلاعات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {farzandModalOpen && detailTab === "family" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label="اطلاعات فرزند">
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="persons" /></span>
                      <div><small>فرزندان</small><h3>{farzandForm.id > 0 ? "ویرایش فرزند" : "افزودن فرزند جدید"}</h3></div>
                    </div>
                    <button type="button" disabled={farzandSaving} onClick={() => setFarzandModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                  </header>
                  <div className={styles.workHistoryForm}>
                    <TextField label="نام و نام خانوادگی" value={farzandForm.nameFarzand} onChange={(value) => setFarzandForm((current) => ({ ...current, nameFarzand: value }))} required maxLength={250} />
                    <TextField label="شغل" value={farzandForm.shoghlFarzand} onChange={(value) => setFarzandForm((current) => ({ ...current, shoghlFarzand: value }))} maxLength={250} />
                  </div>
                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={farzandSaving} onClick={() => setFarzandModalOpen(false)}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} disabled={farzandSaving} onClick={() => void saveFarzandRow()}>
                      {farzandSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {farzandForm.id > 0 ? "ذخیره تغییرات" : "ثبت فرزند"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {hamsarDeleteOpen && hamsar && detailTab === "family" && (
              <ConfirmDialog
                tone="danger"
                title="حذف اطلاعات همسر"
                text={`اطلاعات «${hamsar.NameHamsar}» حذف شود؟`}
                confirmText="حذف شود"
                busy={hamsarSaving}
                onCancel={() => setHamsarDeleteOpen(false)}
                onConfirm={() => void deleteHamsarRow()}
              />
            )}

            {farzandDeleteTarget && detailTab === "family" && (
              <ConfirmDialog
                tone="danger"
                title="حذف فرزند"
                text={`اطلاعات «${farzandDeleteTarget.NameFarzand}» حذف شود؟`}
                confirmText="حذف شود"
                busy={farzandSaving}
                onCancel={() => setFarzandDeleteTarget(null)}
                onConfirm={() => void deleteFarzandRow()}
              />
            )}

            {isargariModalOpen && detailTab === "sacrifice" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={`${styles.workHistoryModal} ${styles.isargariModal}`} role="dialog" aria-modal="true" aria-label="اطلاعات ایثارگری">
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div>
                        <small>سابقه ایثارگری</small>
                        <h3>{isargari ? "ویرایش اطلاعات ایثارگری" : "ثبت اطلاعات ایثارگری"}</h3>
                      </div>
                    </div>
                    <button type="button" disabled={isargariSaving} onClick={() => setIsargariModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.isargariFormBody}>
                    <section className={styles.isargariFormSection}>
                      <div className={styles.isargariFormSectionTitle}>
                        <span>حضور در جبهه</span>
                        <small>میزان حضور در جبهه‌های حق علیه باطل</small>
                      </div>
                      <div className={styles.isargariDurationGrid}>
                        <TextField label="سال" value={isargariForm.jebheSal} onChange={(v) => setIsargariForm(c => ({...c, jebheSal:v}))} numeric maxLength={3} />
                        <TextField label="ماه" value={isargariForm.jebheMah} onChange={(v) => setIsargariForm(c => ({...c, jebheMah:v}))} numeric maxLength={2} />
                        <TextField label="روز" value={isargariForm.jebheRoz} onChange={(v) => setIsargariForm(c => ({...c, jebheRoz:v}))} numeric maxLength={2} />
                      </div>
                    </section>

                    <section className={styles.isargariFormSection}>
                      <div className={styles.isargariFormSectionTitle}>
                        <span>جانباز</span>
                        <small>وضعیت جانبازی و اطلاعات تأییدکننده</small>
                      </div>
                      <div className={styles.isargariFormGrid}>
                        <label className={`${styles.field} ${styles.isargariSelectField}`}>
                          <span>جانباز</span>
                          <select
                            value={isargariForm.janbaz ? "1" : "0"}
                            onChange={(e) => setIsargariForm(c => ({
                              ...c,
                              janbaz: e.target.value === "1",
                              darsadJanbazi: e.target.value === "1" ? c.darsadJanbazi : "",
                              marjaTaeid: e.target.value === "1" ? c.marjaTaeid : "",
                            }))}
                          >
                            <option value="0">خیر</option>
                            <option value="1">بله</option>
                          </select>
                        </label>
                        {isargariForm.janbaz && (
                          <>
                            <TextField label="درصد جانبازی" value={isargariForm.darsadJanbazi} onChange={(v) => setIsargariForm(c => ({...c, darsadJanbazi:v}))} numeric maxLength={3} required />
                            <TextField label="مرجع تأییدکننده" value={isargariForm.marjaTaeid} onChange={(v) => setIsargariForm(c => ({...c, marjaTaeid:v}))} maxLength={250} />
                          </>
                        )}
                      </div>
                    </section>

                    <section className={styles.isargariFormSection}>
                      <div className={styles.isargariFormSectionTitle}>
                        <span>آزادگی</span>
                        <small>وضعیت آزادگی و جمع مدت اسارت</small>
                      </div>
                      <div className={styles.isargariFormGrid}>
                        <label className={`${styles.field} ${styles.isargariSelectField}`}>
                          <span>آزاده</span>
                          <select
                            value={isargariForm.azadeh ? "1" : "0"}
                            onChange={(e) => setIsargariForm(c => ({
                              ...c,
                              azadeh: e.target.value === "1",
                              asaratSal: e.target.value === "1" ? c.asaratSal : "",
                              asaratMah: e.target.value === "1" ? c.asaratMah : "",
                              asaratRoz: e.target.value === "1" ? c.asaratRoz : "",
                            }))}
                          >
                            <option value="0">خیر</option>
                            <option value="1">بله</option>
                          </select>
                        </label>
                        {isargariForm.azadeh && (
                          <div className={styles.isargariDurationBlock}>
                            <span>جمع مدت اسارت</span>
                            <div className={styles.isargariDurationGrid}>
                              <TextField label="سال" value={isargariForm.asaratSal} onChange={(v) => setIsargariForm(c => ({...c, asaratSal:v}))} numeric maxLength={3} />
                              <TextField label="ماه" value={isargariForm.asaratMah} onChange={(v) => setIsargariForm(c => ({...c, asaratMah:v}))} numeric maxLength={2} />
                              <TextField label="روز" value={isargariForm.asaratRoz} onChange={(v) => setIsargariForm(c => ({...c, asaratRoz:v}))} numeric maxLength={2} />
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className={styles.isargariFormSection}>
                      <div className={styles.isargariFormSectionTitle}>
                        <span>خانواده شهید</span>
                        <small>اطلاعات شهید و نسبت خانوادگی</small>
                      </div>
                      <div className={styles.isargariFormGrid}>
                        <label className={`${styles.field} ${styles.isargariSelectField}`}>
                          <span>خانواده شهید</span>
                          <select
                            value={isargariForm.khanevadeShahid ? "1" : "0"}
                            onChange={(e) => setIsargariForm(c => ({
                              ...c,
                              khanevadeShahid: e.target.value === "1",
                              nameShahid: e.target.value === "1" ? c.nameShahid : "",
                              tarikhMahalShahadat: e.target.value === "1" ? c.tarikhMahalShahadat : "",
                              nesbatBaShahid: e.target.value === "1" ? c.nesbatBaShahid : "",
                            }))}
                          >
                            <option value="0">خیر</option>
                            <option value="1">بله</option>
                          </select>
                        </label>
                        {isargariForm.khanevadeShahid && (
                          <>
                            <TextField label="نام شهید (شهدا)" value={isargariForm.nameShahid} onChange={(v) => setIsargariForm(c => ({...c, nameShahid:v}))} maxLength={500} />
                            <TextField label="نسبت با شهید" value={isargariForm.nesbatBaShahid} onChange={(v) => setIsargariForm(c => ({...c, nesbatBaShahid:v}))} maxLength={150} />
                            <div className={styles.isargariWideInput}>
                              <TextField label="تاریخ و محل شهادت" value={isargariForm.tarikhMahalShahadat} onChange={(v) => setIsargariForm(c => ({...c, tarikhMahalShahadat:v}))} maxLength={500} />
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={isargariSaving} onClick={() => setIsargariModalOpen(false)}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} disabled={isargariSaving} onClick={() => void saveIsargariRow()}>
                      {isargariSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {isargari ? "ذخیره تغییرات" : "ثبت اطلاعات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {isargariDeleteOpen && detailTab === "sacrifice" && (
              <ConfirmDialog tone="danger" title="حذف اطلاعات ایثارگری" text="اطلاعات ایثارگری این شخص حذف شود؟" confirmText="حذف شود" busy={isargariSaving} onCancel={() => setIsargariDeleteOpen(false)} onConfirm={() => void confirmDeleteIsargari()} />
            )}

            {workHistoryModalOpen && detailTab === "work-history" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingWorkHistoryId === null ? "افزودن سابقه شغلی" : "ویرایش سابقه شغلی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>سوابق شغلی</small><h3>{editingWorkHistoryId === null ? "افزودن سابقه جدید" : "ویرایش سابقه شغلی"}</h3></div>
                    </div>
                    <button type="button" disabled={workHistorySaving} onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.workHistoryForm}>
                    <label className={styles.field}>
                      <span>محل خدمت</span>
                      <SearchableDropdown
                        value={workHistoryForm.mahal}
                        options={cityOptions}
                        onChange={(value) => setWorkHistoryForm((current) => ({ ...current, mahal: value }))}
                        searchPlaceholder="جست‌وجو و انتخاب شهرستان محل خدمت..."
                        compact
                      />
                    </label>

                    <TextField
                      label="سمت (پست سازمانی)"
                      value={workHistoryForm.sematPostSazmani}
                      onChange={(value) => setWorkHistoryForm((current) => ({ ...current, sematPostSazmani: value }))}
                      required
                      maxLength={150}
                    />

                    <InputPersianDate label="از تاریخ" value={workHistoryForm.azTarikh} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, azTarikh: value ?? "" }))} placeholder="انتخاب تاریخ شروع" />
                    <InputPersianDate label="تا تاریخ" value={workHistoryForm.taTarikh} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, taTarikh: value ?? "" }))} placeholder="تا اکنون" />
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={workHistorySaving} onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveWorkHistoryRow()} disabled={workHistorySaving}>
                      {workHistorySaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {editingWorkHistoryId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {workHistoryDeleteTarget && detailTab === "work-history" && (
              <ConfirmDialog
                tone="danger"
                title="حذف سابقه شغلی"
                text={`سابقه شغلی «${workHistoryDeleteTarget.SematPostSazmani || "انتخاب‌شده"}» حذف شود؟`}
                confirmText="حذف شود"
                busy={workHistorySaving}
                onCancel={() => setWorkHistoryDeleteTarget(null)}
                onConfirm={() => void confirmDeleteWorkHistory()}
              />
            )}

            {sabegeNezaratModalOpen && detailTab === "election-supervision" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegeNezaratId === null ? "افزودن سابقه نظارتی" : "ویرایش سابقه نظارتی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>سوابق نظارتی و اجرایی انتخابات</small><h3>{editingSabegeNezaratId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                    </div>
                    <button type="button" disabled={sabegeNezaratSaving} onClick={() => { resetSabegeNezaratForm(); setSabegeNezaratModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.workHistoryForm}>
                    <TextField
                      label="دوره انتخاباتی"
                      value={sabegeNezaratForm.doreEntekhabat}
                      onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, doreEntekhabat: value }))}
                      required
                      maxLength={150}
                    />
                    <TextField
                      label="سمت انتخاباتی"
                      value={sabegeNezaratForm.sematEntekhabat}
                      onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, sematEntekhabat: value }))}
                      required
                      maxLength={150}
                    />
                    <label className={styles.field}>
                      <span>محل<i>*</i></span>
                      <SearchableDropdown
                        value={sabegeNezaratForm.mahal}
                        options={cityOptions}
                        onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, mahal: value }))}
                        searchPlaceholder="جست‌وجو و انتخاب محل..."
                        compact
                      />
                    </label>
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={sabegeNezaratSaving} onClick={() => { resetSabegeNezaratForm(); setSabegeNezaratModalOpen(false); }}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegeNezaratRow()} disabled={sabegeNezaratSaving}>
                      {sabegeNezaratSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {editingSabegeNezaratId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {sabegeNezaratDeleteTarget && detailTab === "election-supervision" && (
              <ConfirmDialog
                tone="danger"
                title="حذف سابقه نظارتی و اجرایی انتخابات"
                text={`سابقه «${sabegeNezaratDeleteTarget.DoreEntekhabat || "انتخاب‌شده"}» حذف شود؟`}
                confirmText="حذف شود"
                busy={sabegeNezaratSaving}
                onCancel={() => setSabegeNezaratDeleteTarget(null)}
                onConfirm={() => void confirmDeleteSabegeNezarat()}
              />
            )}

            {sabegheFaliyatEjtemaiModalOpen && detailTab === "social-activities" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegheFaliyatEjtemaiId === null ? "افزودن سابقه فعالیت اجتماعی" : "ویرایش سابقه فعالیت اجتماعی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>سوابق فعالیت‌های اجتماعی</small><h3>{editingSabegheFaliyatEjtemaiId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                    </div>
                    <button type="button" disabled={sabegheFaliyatEjtemaiSaving} onClick={() => { resetSabegheFaliyatEjtemaiForm(); setSabegheFaliyatEjtemaiModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.workHistoryForm}>
                    <TextField
                      label="نام نهاد، تشکل یا حزب"
                      value={sabegheFaliyatEjtemaiForm.nameNahadTashakolHezb}
                      onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, nameNahadTashakolHezb: value }))}
                      required
                      maxLength={250}
                    />
                    <label className={styles.field}>
                      <span>محل فعالیت (استان و شهرستان)<i>*</i></span>
                      <SearchableDropdown
                        value={sabegheFaliyatEjtemaiForm.mahal}
                        options={cityOptions}
                        onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, mahal: value }))}
                        searchPlaceholder="جست‌وجو و انتخاب محل فعالیت..."
                        compact
                      />
                    </label>
                    <InputPersianDate label="از تاریخ" value={sabegheFaliyatEjtemaiForm.azTarikh} onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, azTarikh: value ?? "" }))} placeholder="انتخاب تاریخ شروع" />
                    <InputPersianDate label="تا تاریخ" value={sabegheFaliyatEjtemaiForm.taTarikh} onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, taTarikh: value ?? "" }))} placeholder="انتخاب تاریخ پایان" />
                    <TextField
                      label="ملاحظات"
                      value={sabegheFaliyatEjtemaiForm.molahazat}
                      onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, molahazat: value }))}
                      maxLength={1000}
                    />
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={sabegheFaliyatEjtemaiSaving} onClick={() => { resetSabegheFaliyatEjtemaiForm(); setSabegheFaliyatEjtemaiModalOpen(false); }}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegheFaliyatEjtemaiRow()} disabled={sabegheFaliyatEjtemaiSaving}>
                      {sabegheFaliyatEjtemaiSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {editingSabegheFaliyatEjtemaiId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {sabegheFaliyatEjtemaiDeleteTarget && detailTab === "social-activities" && (
              <ConfirmDialog
                tone="danger"
                title="حذف سابقه فعالیت اجتماعی"
                text={`سابقه «${sabegheFaliyatEjtemaiDeleteTarget.NameNahadTashakolHezb || "انتخاب‌شده"}» حذف شود؟`}
                confirmText="حذف شود"
                busy={sabegheFaliyatEjtemaiSaving}
                onCancel={() => setSabegheFaliyatEjtemaiDeleteTarget(null)}
                onConfirm={() => void confirmDeleteSabegheFaliyatEjtemai()}
              />
            )}

            {doreAmozeshiModalOpen && detailTab === "training" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingDoreAmozeshiId === null ? "افزودن دوره آموزشی" : "ویرایش دوره آموزشی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>دوره‌های آموزشی عمومی و تخصصی</small><h3>{editingDoreAmozeshiId === null ? "افزودن دوره جدید" : "ویرایش دوره آموزشی"}</h3></div>
                    </div>
                    <button type="button" disabled={doreAmozeshiSaving} onClick={() => { resetDoreAmozeshiForm(); setDoreAmozeshiModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.workHistoryForm}>
                    <TextField label="نام دوره" value={doreAmozeshiForm.nameDore} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, nameDore: value }))} required maxLength={250} />
                    <TextField label="مدت دوره به ساعت" value={doreAmozeshiForm.modatSaat} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, modatSaat: value.replace(/[^0-9۰-۹]/g, "") }))} required maxLength={8} />
                    <TextField label="نام مرکز و محل آموزش" value={doreAmozeshiForm.nameMarkazMahalAmozesh} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, nameMarkazMahalAmozesh: value }))} required maxLength={300} />
                    <label className={styles.field}>
                      <span>نوع مدرک<i>*</i></span>
                      <SearchableDropdown
                        value={doreAmozeshiForm.noeMadrak}
                        options={definitionOptions(PERSON_DFN_PID.educationCertificateType)}
                        onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, noeMadrak: value }))}
                        searchPlaceholder="انتخاب نوع مدرک..."
                        compact
                      />
                    </label>
                    <InputPersianDate label="تاریخ اخذ مدرک" value={doreAmozeshiForm.tarikhAkhzMadrak} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, tarikhAkhzMadrak: value ?? "" }))} placeholder="انتخاب تاریخ اخذ مدرک" />
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={doreAmozeshiSaving} onClick={() => { resetDoreAmozeshiForm(); setDoreAmozeshiModalOpen(false); }}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveDoreAmozeshiRow()} disabled={doreAmozeshiSaving}>
                      {doreAmozeshiSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {editingDoreAmozeshiId === null ? "ثبت دوره" : "ذخیره تغییرات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {doreAmozeshiDeleteTarget && detailTab === "training" && (
              <ConfirmDialog
                tone="danger"
                title="حذف دوره آموزشی"
                text={`دوره «${doreAmozeshiDeleteTarget.NameDore || "انتخاب‌شده"}» حذف شود؟`}
                confirmText="حذف شود"
                busy={doreAmozeshiSaving}
                onCancel={() => setDoreAmozeshiDeleteTarget(null)}
                onConfirm={() => void confirmDeleteDoreAmozeshi()}
              />
            )}


            {sabegheEntekhabatModalOpen && detailTab === "candidacy" && (
              <div className={styles.workHistoryModalBackdrop}>
                <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegheEntekhabatId === null ? "افزودن سابقه داوطلبی" : "ویرایش سابقه داوطلبی"}>
                  <header>
                    <div className={styles.workHistoryModalTitle}>
                      <span className={styles.wizardIcon}><Icon name="file" /></span>
                      <div><small>سابقه داوطلبی در انتخابات</small><h3>{editingSabegheEntekhabatId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                    </div>
                    <button type="button" disabled={sabegheEntekhabatSaving} onClick={() => { resetSabegheEntekhabatForm(); setSabegheEntekhabatModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                  </header>

                  <div className={styles.workHistoryForm}>
                    <TextField
                      label="نوع انتخابات"
                      value={sabegheEntekhabatForm.noeEntekhabat}
                      onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, noeEntekhabat: value }))}
                      required
                      maxLength={150}
                    />
                    <TextField
                      label="حوزه انتخابیه"
                      value={sabegheEntekhabatForm.hozeEntekhabieh}
                      onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, hozeEntekhabieh: value }))}
                      required
                      maxLength={250}
                    />
                    <TextField
                      label="نتیجه"
                      value={sabegheEntekhabatForm.natijeh}
                      onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, natijeh: value }))}
                      maxLength={250}
                    />
                  </div>

                  <footer>
                    <button type="button" className={styles.cancelButton} disabled={sabegheEntekhabatSaving} onClick={() => { resetSabegheEntekhabatForm(); setSabegheEntekhabatModalOpen(false); }}>انصراف</button>
                    <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegheEntekhabatRow()} disabled={sabegheEntekhabatSaving}>
                      {sabegheEntekhabatSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                      {editingSabegheEntekhabatId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                    </button>
                  </footer>
                </section>
              </div>
            )}

            {sabegheEntekhabatDeleteTarget && detailTab === "candidacy" && (
              <ConfirmDialog
                tone="danger"
                title="حذف سابقه داوطلبی در انتخابات"
                text={`سابقه «${sabegheEntekhabatDeleteTarget.NoeEntekhabat || "انتخاب‌شده"}» حذف شود؟`}
                confirmText="حذف شود"
                busy={sabegheEntekhabatSaving}
                onCancel={() => setSabegheEntekhabatDeleteTarget(null)}
                onConfirm={() => void confirmDeleteSabegheEntekhabat()}
              />
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

            <div className={styles.wizardWorkspace}>
              <aside className={styles.stepper} aria-label="مراحل ثبت اطلاعات">
                <div className={styles.wizardProgress}>
                  <span>پیشرفت ثبت اطلاعات</span>
                  <strong>{wizardProgressValue.toLocaleString("fa-IR")}٪</strong>
                  <div><i style={{ width: `${wizardProgressValue}%` }} /></div>
                </div>
                {steps.slice(0, 4).map((item, index) => (
                  <button
                    type="button"
                    className={`${styles.stepItem} ${!wizardDetailSection && step === index ? styles.stepActive : ""}`}
                    key={item.title}
                    onClick={() => {
                      if (index <= step || form.personId) {
                        setWizardDetailSection(null);
                        setDetailTab("details");
                        setStep(index);
                      }
                    }}
                    disabled={saving || loadingDetail || (index > step && !form.personId)}
                  >
                    <span>{(index + 1).toLocaleString("fa-IR")}</span>
                    <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
                  </button>
                ))}

                {wizardRemainingSections.map((item, index) => {
                  const stageNumber = index + 5;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`${styles.stepItem} ${wizardDetailSection === item.id ? styles.stepActive : ""}`}
                      disabled={!form.personId || saving || loadingDetail}
                      onClick={() => openWizardRemainingSection(item.id)}
                    >
                      <span>{stageNumber.toLocaleString("fa-IR")}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.subtitle}</small>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={`${styles.stepItem} ${!wizardDetailSection && step === 4 ? styles.stepActive : ""}`}
                  disabled={!form.personId || saving || loadingDetail}
                  onClick={() => {
                    setWizardDetailSection(null);
                    setDetailTab("details");
                    setStep(4);
                  }}
                >
                  <span>{(12).toLocaleString("fa-IR")}</span>
                  <div>
                    <strong>اطلاعات تکمیلی</strong>
                    <small>تماس، نشانی، رایانه و وضعیت جسمانی</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`${styles.stepItem} ${styles.wizardFinalReviewStep} ${!wizardDetailSection && step === 5 ? styles.stepActive : ""}`}
                  disabled={!form.personId || saving || loadingDetail}
                  onClick={() => {
                    setWizardDetailSection(null);
                    setDetailTab("details");
                    setStep(5);
                  }}
                >
                  <span>{(13).toLocaleString("fa-IR")}</span>
                  <div>
                    <strong>تصویر و بازبینی</strong>
                    <small>تصویر پرسنلی و مرور نهایی پرونده</small>
                  </div>
                </button>
              </aside>

              <div className={styles.wizardContent}>
            {loadingDetail ? <div className={styles.wizardLoading}><span className={styles.spinner} />در حال دریافت پرونده...</div> : (
              <div className={styles.wizardBody}>
                {wizardDetailSection ? (
                  <div className={styles.wizardEmbeddedSection}>
                    <div className={styles.wizardEmbeddedSectionTop}>
                      <button
                        type="button"
                        className={styles.wizardEmbeddedBackButton}
                        onClick={() => {
                          const currentIndex = wizardRemainingSections.findIndex((item) => item.id === wizardDetailSection);
                          if (currentIndex > 0) {
                            const previous = wizardRemainingSections[currentIndex - 1];
                            setDetailTab(previous.id);
                            setWizardDetailSection(previous.id);
                          } else {
                            setWizardDetailSection(null);
                            setDetailTab("details");
                            setStep(3);
                          }
                        }}
                      >
                        <Icon name="back" />
                        مرحله قبل
                      </button>
                      <div>
                        <span>تکمیل پرونده</span>
                        <strong>{wizardRemainingSections.find((item) => item.id === wizardDetailSection)?.title ?? "اطلاعات پرونده"}</strong>
                      </div>
                    </div>

                    {wizardDetailSection === "sacrifice" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div><span>سابقه ایثارگری</span><h3>جبهه، جانبازی، آزادگی و خانواده شهید</h3><small>{isargari ? "اطلاعات ثبت شده است" : "هنوز اطلاعاتی ثبت نشده است"}</small></div>
                    <div className={styles.workHistoryActions}>
                      <button type="button" className={styles.workHistoryAddButton} onClick={openIsargariEditor} disabled={isargariLoading || isargariSaving}><Icon name={isargari ? "edit" : "plus"} />{isargari ? "ویرایش" : "ثبت اطلاعات"}</button>
                      {isargari && <button type="button" className={styles.deleteAction} onClick={() => setIsargariDeleteOpen(true)} title="حذف" disabled={isargariSaving}><Icon name="trash" /></button>}
                    </div>
                  </header>
                  {isargariLoading ? (
                    <div className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت اطلاعات ایثارگری...</div>
                  ) : !isargari ? (
                    <div className={styles.isargariEmptyState}>
                      <Icon name="file" />
                      <strong>اطلاعات ایثارگری ثبت نشده است</strong>
                      <span>برای ثبت اطلاعات از دکمه «ثبت اطلاعات» استفاده کنید.</span>
                    </div>
                  ) : (
                    <div className={styles.isargariSummaryGrid}>
                      <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                        <span>میزان حضور در جبهه‌های حق علیه باطل</span>
                        <strong>{`${isargari.JebheSal ?? 0} سال، ${isargari.JebheMah ?? 0} ماه، ${isargari.JebheRoz ?? 0} روز`}</strong>
                      </div>

                      <div className={styles.isargariSummaryItem}>
                        <span>جانباز</span>
                        <strong>{isargari.Janbaz ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.Janbaz && (
                        <>
                          <div className={styles.isargariSummaryItem}>
                            <span>درصد جانبازی</span>
                            <strong>{`${isargari.DarsadJanbazi ?? 0}٪`}</strong>
                          </div>
                          <div className={styles.isargariSummaryItem}>
                            <span>مرجع تأییدکننده</span>
                            <strong>{isargari.MarjaTaeid || "—"}</strong>
                          </div>
                        </>
                      )}

                      <div className={styles.isargariSummaryItem}>
                        <span>آزاده</span>
                        <strong>{isargari.Azadeh ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.Azadeh && (
                        <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                          <span>جمع مدت اسارت</span>
                          <strong>{`${isargari.AsaratSal ?? 0} سال، ${isargari.AsaratMah ?? 0} ماه، ${isargari.AsaratRoz ?? 0} روز`}</strong>
                        </div>
                      )}

                      <div className={styles.isargariSummaryItem}>
                        <span>خانواده شهید</span>
                        <strong>{isargari.KhanevadeShahid ? "بله" : "خیر"}</strong>
                      </div>

                      {isargari.KhanevadeShahid && (
                        <>
                          <div className={styles.isargariSummaryItem}>
                            <span>نام شهید (شهدا)</span>
                            <strong>{isargari.NameShahid || "—"}</strong>
                          </div>
                          <div className={styles.isargariSummaryItem}>
                            <span>نسبت با شهید</span>
                            <strong>{isargari.NesbatBaShahid || "—"}</strong>
                          </div>
                          <div className={`${styles.isargariSummaryItem} ${styles.isargariSummaryWide}`}>
                            <span>تاریخ و محل شهادت</span>
                            <strong>{isargari.TarikhMahalShahadat || "—"}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </section>
              </div>
            ) : wizardDetailSection === "family" ? (
              <div className={styles.detailBody}>
                <section className={styles.familyPanel}>
                  <header className={styles.familyPanelHeader}>
                    <div>
                      <span>اطلاعات خانوادگی</span>
                      <h3>همسر و فرزندان</h3>
                    </div>
                    <span>{farzandan.length.toLocaleString("fa-IR")} فرزند ثبت‌شده</span>
                  </header>

                  <div className={styles.familySpouseCard}>
                    <div className={styles.familySpouseHeader}>
                      <div>
                        <span>اطلاعات همسر</span>
                        <small>نام و نام خانوادگی و شغل همسر</small>
                      </div>
                      <div className={styles.familyCardActions}>
                        <button type="button" className={styles.editAction} onClick={openHamsarForm} disabled={hamsarSaving || hamsarLoading} title={hamsar ? "ویرایش اطلاعات همسر" : "ثبت اطلاعات همسر"}>
                          <Icon name={hamsar ? "edit" : "plus"} />
                        </button>
                        {hamsar && (
                          <button type="button" className={styles.deleteAction} onClick={() => setHamsarDeleteOpen(true)} disabled={hamsarSaving} title="حذف اطلاعات همسر">
                            <Icon name="trash" />
                          </button>
                        )}
                      </div>
                    </div>

                    {hamsarLoading ? (
                      <div className={styles.familyEmpty}><span className={styles.spinner} /> در حال دریافت اطلاعات همسر...</div>
                    ) : hamsar ? (
                      <div className={styles.familySummary}>
                        <div><span>نام و نام خانوادگی همسر</span><strong>{hamsar.NameHamsar || "—"}</strong></div>
                        <div><span>شغل همسر</span><strong>{hamsar.ShoghlHamsar || "—"}</strong></div>
                        <div><span>تعداد فرزندان</span><strong>{farzandan.length.toLocaleString("fa-IR")}</strong></div>
                      </div>
                    ) : (
                      <div className={styles.familyEmpty}>اطلاعات همسر ثبت نشده است.</div>
                    )}
                  </div>

                  <section className={styles.familyChildrenCard}>
                    <header className={styles.familyChildrenHeader}>
                      <div>
                        <span>فرزندان</span>
                        <small>حداکثر ۵ ردیف مطابق فرم اطلاعات فردی</small>
                      </div>
                      <button type="button" className={styles.workHistoryAddButton} onClick={openFarzandCreate} disabled={farzandSaving || farzandan.length >= 5}>
                        <Icon name="plus" />فرزند جدید
                      </button>
                    </header>

                    <div className={styles.familyTableWrap}>
                      <table className={styles.familyTable}>
                        <thead>
                          <tr><th>ردیف</th><th>نام و نام خانوادگی</th><th>شغل</th><th>عملیات</th></tr>
                        </thead>
                        <tbody>
                          {farzandLoading && (
                            <tr><td colSpan={4} className={styles.familyEmpty}><span className={styles.spinner} /> در حال دریافت فرزندان...</td></tr>
                          )}
                          {!farzandLoading && farzandan.map((row, index) => (
                            <tr key={row.ID}>
                              <td>{(index + 1).toLocaleString("fa-IR")}</td>
                              <td><strong>{row.NameFarzand || "—"}</strong></td>
                              <td>{row.ShoghlFarzand || "—"}</td>
                              <td>
                                <div className={styles.workHistoryActions}>
                                  <button type="button" className={styles.editAction} onClick={() => editFarzandRow(row)} disabled={farzandSaving} title="ویرایش"><Icon name="edit" /></button>
                                  <button type="button" className={styles.deleteAction} onClick={() => setFarzandDeleteTarget(row)} disabled={farzandSaving} title="حذف"><Icon name="trash" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!farzandLoading && farzandan.length === 0 && (
                            <tr><td colSpan={4} className={styles.familyEmpty}>هنوز فرزندی ثبت نشده است.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
              </div>
            ) : wizardDetailSection === "work-history" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق شغلی</span>
                      <h3>محل خدمت، سمت و زمان خدمت</h3>
                      <small>{workHistory.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openWorkHistoryCreate} disabled={workHistorySaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>محل خدمت</th>
                          <th>سمت (پست سازمانی)</th>
                          <th>از تاریخ</th>
                          <th>تا تاریخ</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workHistoryLoading && (
                          <tr><td colSpan={6} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق شغلی...</td></tr>
                        )}
                        {!workHistoryLoading && workHistory.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.MahalName || (row.Mahal ? cityTitle(String(row.Mahal)) : "—")}</strong></td>
                            <td>{row.SematPostSazmani || "—"}</td>
                            <td>{row.AzTarikh || "—"}</td>
                            <td>{row.TaTarikh || "تا اکنون"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editWorkHistoryRow(row)} title="ویرایش" disabled={workHistorySaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setWorkHistoryDeleteTarget(row)} title="حذف" disabled={workHistorySaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!workHistoryLoading && workHistory.length === 0 && (
                          <tr><td colSpan={6} className={styles.workHistoryEmpty}>هنوز سابقه شغلی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : wizardDetailSection === "election-supervision" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق نظارتی و اجرایی انتخابات</span>
                      <h3>دوره، سمت انتخاباتی و محل</h3>
                      <small>{sabegeNezarat.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegeNezaratCreate} disabled={sabegeNezaratSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>دوره انتخاباتی</th>
                          <th>سمت انتخاباتی</th>
                          <th>محل</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegeNezaratLoading && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق نظارتی...</td></tr>
                        )}
                        {!sabegeNezaratLoading && sabegeNezarat.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.DoreEntekhabat || "—"}</strong></td>
                            <td>{row.SematEntekhabat || "—"}</td>
                            <td>{row.MahalName || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegeNezaratRow(row)} title="ویرایش" disabled={sabegeNezaratSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegeNezaratDeleteTarget(row)} title="حذف" disabled={sabegeNezaratSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegeNezaratLoading && sabegeNezarat.length === 0 && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}>هنوز سابقه نظارتی و اجرایی انتخابات ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : wizardDetailSection === "social-activities" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سوابق فعالیت‌های اجتماعی</span>
                      <h3>نام نهاد، محل فعالیت، مدت فعالیت و ملاحظات</h3>
                      <small>{sabegheFaliyatEjtemai.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegheFaliyatEjtemaiCreate} disabled={sabegheFaliyatEjtemaiSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نام نهاد، تشکل یا حزب</th>
                          <th>محل فعالیت</th>
                          <th>از تاریخ</th>
                          <th>تا تاریخ</th>
                          <th>ملاحظات</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegheFaliyatEjtemaiLoading && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق فعالیت‌های اجتماعی...</td></tr>
                        )}
                        {!sabegheFaliyatEjtemaiLoading && sabegheFaliyatEjtemai.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NameNahadTashakolHezb || "—"}</strong></td>
                            <td>{row.MahalName || (row.Mahal ? cityTitle(String(row.Mahal)) : "—")}</td>
                            <td>{row.AzTarikh || "—"}</td>
                            <td>{row.TaTarikh || "—"}</td>
                            <td>{row.Molahazat || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegheFaliyatEjtemaiRow(row)} title="ویرایش" disabled={sabegheFaliyatEjtemaiSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegheFaliyatEjtemaiDeleteTarget(row)} title="حذف" disabled={sabegheFaliyatEjtemaiSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegheFaliyatEjtemaiLoading && sabegheFaliyatEjtemai.length === 0 && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}>هنوز سابقه فعالیت اجتماعی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : wizardDetailSection === "training" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>دوره‌های آموزشی عمومی و تخصصی</span>
                      <h3>نام دوره، مدت دوره، مرکز آموزش، نوع مدرک و تاریخ اخذ مدرک</h3>
                      <small>{doreAmozeshi.length.toLocaleString("fa-IR")} دوره ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openDoreAmozeshiCreate} disabled={doreAmozeshiSaving}>
                      <Icon name="plus" />دوره جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نام دوره</th>
                          <th>مدت دوره (ساعت)</th>
                          <th>نام مرکز و محل آموزش</th>
                          <th>نوع مدرک</th>
                          <th>تاریخ اخذ مدرک</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doreAmozeshiLoading && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت دوره‌های آموزشی...</td></tr>
                        )}
                        {!doreAmozeshiLoading && doreAmozeshi.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NameDore || "—"}</strong></td>
                            <td>{Number(row.ModatSaat || 0).toLocaleString("fa-IR")}</td>
                            <td>{row.NameMarkazMahalAmozesh || "—"}</td>
                            <td>{row.NoeMadrakName || lookupTitle(PERSON_DFN_PID.educationCertificateType, String(row.NoeMadrak)) || "—"}</td>
                            <td>{row.TarikhAkhzMadrak || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editDoreAmozeshiRow(row)} title="ویرایش" disabled={doreAmozeshiSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setDoreAmozeshiDeleteTarget(row)} title="حذف" disabled={doreAmozeshiSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!doreAmozeshiLoading && doreAmozeshi.length === 0 && (
                          <tr><td colSpan={7} className={styles.workHistoryEmpty}>هنوز دوره آموزشی ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : wizardDetailSection === "candidacy" ? (
              <div className={styles.detailBody}>
                <section className={styles.workHistoryPanel}>
                  <header className={styles.workHistoryHeader}>
                    <div>
                      <span>سابقه داوطلبی در انتخابات</span>
                      <h3>نوع انتخابات، حوزه انتخابیه و نتیجه</h3>
                      <small>{sabegheEntekhabat.length.toLocaleString("fa-IR")} سابقه ثبت‌شده</small>
                    </div>
                    <button type="button" className={styles.workHistoryAddButton} onClick={openSabegheEntekhabatCreate} disabled={sabegheEntekhabatSaving}>
                      <Icon name="plus" />سابقه جدید
                    </button>
                  </header>
                  <div className={styles.workHistoryTableWrap}>
                    <table className={`${styles.workHistoryTable} ${styles.workHistoryRealTable}`}>
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>نوع انتخابات</th>
                          <th>حوزه انتخابیه</th>
                          <th>نتیجه</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabegheEntekhabatLoading && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}><span className={styles.spinner} /> در حال دریافت سوابق داوطلبی...</td></tr>
                        )}
                        {!sabegheEntekhabatLoading && sabegheEntekhabat.map((row, index) => (
                          <tr key={row.ID}>
                            <td>{(index + 1).toLocaleString("fa-IR")}</td>
                            <td><strong className={styles.workHistoryPrimary}>{row.NoeEntekhabat || "—"}</strong></td>
                            <td>{row.HozeEntekhabieh || "—"}</td>
                            <td>{row.Natijeh || "—"}</td>
                            <td>
                              <div className={styles.workHistoryActions}>
                                <button type="button" className={styles.editAction} onClick={() => editSabegheEntekhabatRow(row)} title="ویرایش" disabled={sabegheEntekhabatSaving}><Icon name="edit" /></button>
                                <button type="button" className={styles.deleteAction} onClick={() => setSabegheEntekhabatDeleteTarget(row)} title="حذف" disabled={sabegheEntekhabatSaving}><Icon name="trash" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!sabegheEntekhabatLoading && sabegheEntekhabat.length === 0 && (
                          <tr><td colSpan={5} className={styles.workHistoryEmpty}>هنوز سابقه داوطلبی در انتخابات ثبت نشده است.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : null}
                  </div>
                ) : (
                  <>
                <div className={styles.stepTitle}><span>مرحله {(step + 1).toLocaleString("fa-IR")}</span><h3>{currentWizardStageTitle}</h3><p>{currentWizardStageSubtitle}</p></div>

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

                {step === 2 && <div className={styles.wizardCards}>
                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}>
                      <span>وضعیت نظام وظیفه</span>
                      <small>رونوشت کارت پایان خدمت یا معافیت ضمیمه گردد</small>
                    </header>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>وضعیت نظام وظیفه<i>*</i></span>
                        <SearchableDropdown
                          value={form.nezamVazifeh}
                          options={definitionOptions(PERSON_DFN_PID.militaryStatus)}
                          onChange={(value) => change("nezamVazifeh", value)}
                          compact
                        />
                      </label>

                      {militaryIsCompleted && <>
                        <InputPersianDate
                          label="تاریخ ورود به خدمت"
                          value={form.tarikhShoro}
                          onChange={(value) => change("tarikhShoro", value ?? "")}
                          placeholder="انتخاب تاریخ ورود"
                        />
                        <InputPersianDate
                          label="تاریخ انقضاء خدمت"
                          value={form.tarikhPayan}
                          onChange={(value) => change("tarikhPayan", value ?? "")}
                          placeholder="انتخاب تاریخ انقضاء"
                        />
                      </>}

                      {militaryIsExempt && <>
                        <InputPersianDate
                          label="تاریخ معافیت"
                          value={form.tarikhMoaafiat}
                          onChange={(value) => change("tarikhMoaafiat", value ?? "")}
                          placeholder="انتخاب تاریخ معافیت"
                        />
                        <label className={styles.field}>
                          <span>نوع معافیت</span>
                          <SearchableDropdown
                            value={form.noeMoaafiat}
                            options={definitionOptions(PERSON_DFN_PID.exemptionType)}
                            onChange={(value) => change("noeMoaafiat", value)}
                            compact
                          />
                        </label>
                      </>}
                    </div>
                  </section>

                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}>
                      <span>سوابق تحصیلی</span>
                      <small>رونوشت آخرین مدرک تحصیلی ضمیمه گردد</small>
                    </header>

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>نوع تحصیل</span>
                        <select
                          className={styles.wizardNativeSelect}
                          value={form.noeTahsil}
                          onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({
                              ...current,
                              noeTahsil: value,
                              sathTahsilHozavi: value === "حوزوی" ? current.sathTahsilHozavi : "",
                              hamtarazTahsil: value === "حوزوی" ? current.hamtarazTahsil : "",
                              mahalTahsil: value === "حوزوی" ? current.mahalTahsil : "",
                              balatarinMadrakTahsil: value === "دانشگاهی" ? current.balatarinMadrakTahsil : "",
                              mahalAkhzMadrak: value === "دانشگاهی" ? current.mahalAkhzMadrak : "",
                              tarikhAkhzMadrak: value === "دانشگاهی" ? current.tarikhAkhzMadrak : "",
                            }));
                          }}
                        >
                          <option value="">انتخاب نشده</option>
                          <option value="حوزوی">حوزوی</option>
                          <option value="دانشگاهی">دانشگاهی</option>
                        </select>
                      </label>

                      {form.noeTahsil === "حوزوی" && <>
                        <TextField
                          label="سطح تحصیل حوزوی"
                          value={form.sathTahsilHozavi}
                          onChange={(value) => change("sathTahsilHozavi", value)}
                          maxLength={150}
                        />
                        <TextField
                          label="همتراز (معادل)"
                          value={form.hamtarazTahsil}
                          onChange={(value) => change("hamtarazTahsil", value)}
                          maxLength={150}
                        />
                        <TextField
                          label="محل تحصیل"
                          value={form.mahalTahsil}
                          onChange={(value) => change("mahalTahsil", value)}
                          maxLength={250}
                        />
                      </>}

                      {form.noeTahsil === "دانشگاهی" && <>
                        <TextField
                          label="بالاترین مدرک تحصیلی"
                          value={form.balatarinMadrakTahsil}
                          onChange={(value) => change("balatarinMadrakTahsil", value)}
                          maxLength={150}
                        />
                        <TextField
                          label="محل اخذ"
                          value={form.mahalAkhzMadrak}
                          onChange={(value) => change("mahalAkhzMadrak", value)}
                          maxLength={250}
                        />
                        <InputPersianDate
                          label="تاریخ اخذ مدرک"
                          value={form.tarikhAkhzMadrak}
                          onChange={(value) => change("tarikhAkhzMadrak", value ?? "")}
                          placeholder="انتخاب تاریخ اخذ مدرک"
                        />
                      </>}
                    </div>
                  </section>

                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}>
                      <span>اطلاعات شغلی</span>
                      <small>حکم کارگزینی یا بازنشستگی ضمیمه گردد</small>
                    </header>

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>وضعیت اشتغال</span>
                        <select
                          className={styles.wizardNativeSelect}
                          value={form.vazeyatEshteghal}
                          onChange={(event) => {
                            const value = event.target.value;
                            setForm((current) => ({
                              ...current,
                              vazeyatEshteghal: value,
                              mahalKhedmatFeli: value === "شاغل" ? current.mahalKhedmatFeli : "",
                              onvanPostSazmani: value === "شاغل" ? current.onvanPostSazmani : "",
                              tarikhEntesab: value === "شاغل" ? current.tarikhEntesab : "",
                              akharinMahalKhedmat: value === "بازنشسته" ? current.akharinMahalKhedmat : "",
                              akharinPostSazmani: value === "بازنشسته" ? current.akharinPostSazmani : "",
                              moddatEntesab: value === "بازنشسته" ? current.moddatEntesab : "",
                            }));
                          }}
                        >
                          <option value="">انتخاب نشده</option>
                          <option value="شاغل">شاغل</option>
                          <option value="بازنشسته">بازنشسته</option>
                        </select>
                      </label>

                      {form.vazeyatEshteghal === "شاغل" && <>
                        <label className={styles.field}>
                          <span>محل خدمت فعلی</span>
                          <SearchableDropdown
                            value={form.mahalKhedmatFeli}
                            options={cityOptions}
                            onChange={(value) => change("mahalKhedmatFeli", value)}
                            searchPlaceholder="جست‌وجوی استان یا شهرستان..."
                            compact
                          />
                        </label>
                        <TextField
                          label="عنوان پست سازمانی"
                          value={form.onvanPostSazmani}
                          onChange={(value) => change("onvanPostSazmani", value)}
                          maxLength={250}
                        />
                        <InputPersianDate
                          label="تاریخ انتصاب"
                          value={form.tarikhEntesab}
                          onChange={(value) => change("tarikhEntesab", value ?? "")}
                          placeholder="انتخاب تاریخ انتصاب"
                        />
                      </>}

                      {form.vazeyatEshteghal === "بازنشسته" && <>
                        <label className={styles.field}>
                          <span>آخرین محل خدمت</span>
                          <SearchableDropdown
                            value={form.akharinMahalKhedmat}
                            options={cityOptions}
                            onChange={(value) => change("akharinMahalKhedmat", value)}
                            searchPlaceholder="جست‌وجوی استان یا شهرستان..."
                            compact
                          />
                        </label>
                        <TextField
                          label="آخرین پست سازمانی"
                          value={form.akharinPostSazmani}
                          onChange={(value) => change("akharinPostSazmani", value)}
                          maxLength={250}
                        />
                        <TextField
                          label="مدت انتصاب"
                          value={form.moddatEntesab}
                          onChange={(value) => change("moddatEntesab", value)}
                          placeholder="مثلاً ۳ سال و ۶ ماه"
                          maxLength={100}
                        />
                      </>}
                    </div>
                  </section>
                </div>}

                {step === 3 && <div className={styles.wizardCards}>
                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}>
                      <span>وضعیت عمومی</span>
                      <small>اطلاعات پایه مرتبط با وضعیت فرد</small>
                    </header>
                    <div className={styles.formGrid}>
                      <TextField label="شغل" value={form.shoghl} onChange={(value) => change("shoghl", value)} required maxLength={50} />
                      <label className={styles.field}><span>وضعیت تأهل<i>*</i></span><SearchableDropdown value={form.taahol} options={definitionOptions(PERSON_DFN_PID.maritalStatus)} onChange={(value) => change("taahol", value)} compact /></label>
                      <label className={styles.field}><span>دین و مذهب<i>*</i></span><SearchableDropdown value={form.dinMazhab} options={definitionOptions(PERSON_DFN_PID.religionSect)} onChange={(value) => change("dinMazhab", value)} compact /></label>
                      <label className={styles.field}><span>وضعیت روحانیت<i>*</i></span><SearchableDropdown value={form.rohani} options={definitionOptions(PERSON_DFN_PID.clergyStatus)} onChange={(value) => change("rohani", value)} compact /></label>
                    </div>
                  </section>
                </div>}

                {step === 4 && <div className={styles.wizardCards}>
                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}><span>مهارت و وضعیت جسمانی</span><small>اطلاعات تکمیلی فرد</small></header>
                    <div className={styles.formGrid}>
                      <TextAreaField label="مهارت در استفاده از رایانه در امور اداری چه میزان است؟" value={form.maharatRayaneh} onChange={(value) => change("maharatRayaneh", value)} />
                      <TextAreaField label="وضعیت جسمانی را (چنانچه بیماری یا معلولیت خاصی دارید) تشریح نمایید" value={form.vazeyatJesmani} onChange={(value) => change("vazeyatJesmani", value)} />
                    </div>
                  </section>

                  <section className={styles.wizardFormCard}>
                    <header className={styles.wizardFormCardHeader}><span>آدرس و اطلاعات تماس</span><small>اطلاعات محل سکونت و محل کار</small></header>
                    <div className={styles.formGrid}>
                      <TextAreaField label="آدرس محل سکونت" value={form.addressManzel} onChange={(value) => change("addressManzel", value)} />
                      <TextField label="تلفن ثابت" value={form.telSabet} onChange={(value) => change("telSabet", value)} maxLength={20} numeric largeLabel />
                      <label className={styles.field}><span>کد شهرستان</span><SearchableDropdown value={form.codeShahrestan} options={cityOptions} onChange={(value) => change("codeShahrestan", value)} searchPlaceholder="جست‌وجوی شهرستان..." compact /></label>
                      <TextField label="تلفن همراه" value={form.telHamrah} onChange={(value) => change("telHamrah", value)} placeholder="09xxxxxxxxx" maxLength={11} numeric largeLabel />
                      <TextField label="تلفن ضروری" value={form.telZaruri} onChange={(value) => change("telZaruri", value)} maxLength={15} numeric largeLabel />
                      <TextField label="ایمیل" value={form.email} onChange={(value) => change("email", value)} type="email" maxLength={1500} largeLabel />
                      <TextAreaField label="آدرس محل کار" value={form.addressKar} onChange={(value) => change("addressKar", value)} />
                      <TextField label="تلفن محل کار" value={form.telKar} onChange={(value) => change("telKar", value)} maxLength={20} numeric largeLabel />
                    </div>
                  </section>
                </div>}

                {step === 5 && <div className={styles.reviewLayout}>
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
                  </>
                )}
              </div>
            )}

            {!wizardDetailSection && <footer className={styles.wizardFooter}>
              <div>{form.registrationState === 0 && <button type="button" className={styles.draftButton} onClick={() => void handleDraftSave()} disabled={saving || loadingDetail}><Icon name="draft" />ذخیره موقت</button>}<small>{form.personId ? "اطلاعات تا این مرحله قابل بازیابی است." : "با ذخیره موقت، پیش‌نویس در جدول اشخاص ایجاد می‌شود."}</small></div>
              <div>
                {step > 0 && <button type="button" className={styles.backButton} onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={saving}><Icon name="back" />مرحله قبل</button>}
                {step < 5 ? <button type="button" className={styles.nextButton} onClick={() => void nextStep()} disabled={saving || loadingDetail}>{saving ? <span className={styles.buttonSpinner} /> : <Icon name="next" />}ذخیره و ادامه</button> : <button type="button" className={styles.finalButton} onClick={requestFinalConfirmation} disabled={saving}><Icon name="check" />تأیید و ثبت نهایی</button>}
              </div>
            </footer>}
              </div>
            </div>
          </section>
        </div>
      )}


      {wizardOpen && wizardDetailSection && (
        <>
          {hamsarModalOpen && detailTab === "family" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label="اطلاعات همسر">
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="persons" /></span>
                    <div><small>اطلاعات خانوادگی</small><h3>{hamsar ? "ویرایش اطلاعات همسر" : "ثبت اطلاعات همسر"}</h3></div>
                  </div>
                  <button type="button" disabled={hamsarSaving} onClick={() => setHamsarModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                </header>
                <div className={styles.workHistoryForm}>
                  <TextField label="نام و نام خانوادگی همسر" value={hamsarForm.nameHamsar} onChange={(value) => setHamsarForm((current) => ({ ...current, nameHamsar: value }))} required maxLength={250} />
                  <TextField label="شغل همسر" value={hamsarForm.shoghlHamsar} onChange={(value) => setHamsarForm((current) => ({ ...current, shoghlHamsar: value }))} maxLength={250} />
                </div>
                <footer>
                  <button type="button" className={styles.cancelButton} disabled={hamsarSaving} onClick={() => setHamsarModalOpen(false)}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} disabled={hamsarSaving} onClick={() => void saveHamsarRow()}>
                    {hamsarSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {hamsar ? "ذخیره تغییرات" : "ثبت اطلاعات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {farzandModalOpen && detailTab === "family" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label="اطلاعات فرزند">
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="persons" /></span>
                    <div><small>فرزندان</small><h3>{farzandForm.id > 0 ? "ویرایش فرزند" : "افزودن فرزند جدید"}</h3></div>
                  </div>
                  <button type="button" disabled={farzandSaving} onClick={() => setFarzandModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                </header>
                <div className={styles.workHistoryForm}>
                  <TextField label="نام و نام خانوادگی" value={farzandForm.nameFarzand} onChange={(value) => setFarzandForm((current) => ({ ...current, nameFarzand: value }))} required maxLength={250} />
                  <TextField label="شغل" value={farzandForm.shoghlFarzand} onChange={(value) => setFarzandForm((current) => ({ ...current, shoghlFarzand: value }))} maxLength={250} />
                </div>
                <footer>
                  <button type="button" className={styles.cancelButton} disabled={farzandSaving} onClick={() => setFarzandModalOpen(false)}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} disabled={farzandSaving} onClick={() => void saveFarzandRow()}>
                    {farzandSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {farzandForm.id > 0 ? "ذخیره تغییرات" : "ثبت فرزند"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {hamsarDeleteOpen && hamsar && detailTab === "family" && (
            <ConfirmDialog
              tone="danger"
              title="حذف اطلاعات همسر"
              text={`اطلاعات «${hamsar.NameHamsar}» حذف شود؟`}
              confirmText="حذف شود"
              busy={hamsarSaving}
              onCancel={() => setHamsarDeleteOpen(false)}
              onConfirm={() => void deleteHamsarRow()}
            />
          )}

          {farzandDeleteTarget && detailTab === "family" && (
            <ConfirmDialog
              tone="danger"
              title="حذف فرزند"
              text={`اطلاعات «${farzandDeleteTarget.NameFarzand}» حذف شود؟`}
              confirmText="حذف شود"
              busy={farzandSaving}
              onCancel={() => setFarzandDeleteTarget(null)}
              onConfirm={() => void deleteFarzandRow()}
            />
          )}

          {isargariModalOpen && detailTab === "sacrifice" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={`${styles.workHistoryModal} ${styles.isargariModal}`} role="dialog" aria-modal="true" aria-label="اطلاعات ایثارگری">
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div>
                    <small>سابقه ایثارگری</small>
                    <h3>{isargari ? "ویرایش اطلاعات ایثارگری" : "ثبت اطلاعات ایثارگری"}</h3>
                    </div>
                  </div>
                  <button type="button" disabled={isargariSaving} onClick={() => setIsargariModalOpen(false)} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.isargariFormBody}>
                  <section className={styles.isargariFormSection}>
                    <div className={styles.isargariFormSectionTitle}>
                    <span>حضور در جبهه</span>
                    <small>میزان حضور در جبهه‌های حق علیه باطل</small>
                    </div>
                    <div className={styles.isargariDurationGrid}>
                    <TextField label="سال" value={isargariForm.jebheSal} onChange={(v) => setIsargariForm(c => ({...c, jebheSal:v}))} numeric maxLength={3} />
                    <TextField label="ماه" value={isargariForm.jebheMah} onChange={(v) => setIsargariForm(c => ({...c, jebheMah:v}))} numeric maxLength={2} />
                    <TextField label="روز" value={isargariForm.jebheRoz} onChange={(v) => setIsargariForm(c => ({...c, jebheRoz:v}))} numeric maxLength={2} />
                    </div>
                  </section>

                  <section className={styles.isargariFormSection}>
                    <div className={styles.isargariFormSectionTitle}>
                    <span>جانباز</span>
                    <small>وضعیت جانبازی و اطلاعات تأییدکننده</small>
                    </div>
                    <div className={styles.isargariFormGrid}>
                    <label className={`${styles.field} ${styles.isargariSelectField}`}>
                      <span>جانباز</span>
                      <select
                        value={isargariForm.janbaz ? "1" : "0"}
                        onChange={(e) => setIsargariForm(c => ({
                          ...c,
                          janbaz: e.target.value === "1",
                          darsadJanbazi: e.target.value === "1" ? c.darsadJanbazi : "",
                          marjaTaeid: e.target.value === "1" ? c.marjaTaeid : "",
                        }))}
                      >
                        <option value="0">خیر</option>
                        <option value="1">بله</option>
                      </select>
                    </label>
                    {isargariForm.janbaz && (
                      <>
                        <TextField label="درصد جانبازی" value={isargariForm.darsadJanbazi} onChange={(v) => setIsargariForm(c => ({...c, darsadJanbazi:v}))} numeric maxLength={3} required />
                        <TextField label="مرجع تأییدکننده" value={isargariForm.marjaTaeid} onChange={(v) => setIsargariForm(c => ({...c, marjaTaeid:v}))} maxLength={250} />
                      </>
                    )}
                    </div>
                  </section>

                  <section className={styles.isargariFormSection}>
                    <div className={styles.isargariFormSectionTitle}>
                    <span>آزادگی</span>
                    <small>وضعیت آزادگی و جمع مدت اسارت</small>
                    </div>
                    <div className={styles.isargariFormGrid}>
                    <label className={`${styles.field} ${styles.isargariSelectField}`}>
                      <span>آزاده</span>
                      <select
                        value={isargariForm.azadeh ? "1" : "0"}
                        onChange={(e) => setIsargariForm(c => ({
                          ...c,
                          azadeh: e.target.value === "1",
                          asaratSal: e.target.value === "1" ? c.asaratSal : "",
                          asaratMah: e.target.value === "1" ? c.asaratMah : "",
                          asaratRoz: e.target.value === "1" ? c.asaratRoz : "",
                        }))}
                      >
                        <option value="0">خیر</option>
                        <option value="1">بله</option>
                      </select>
                    </label>
                    {isargariForm.azadeh && (
                      <div className={styles.isargariDurationBlock}>
                        <span>جمع مدت اسارت</span>
                        <div className={styles.isargariDurationGrid}>
                          <TextField label="سال" value={isargariForm.asaratSal} onChange={(v) => setIsargariForm(c => ({...c, asaratSal:v}))} numeric maxLength={3} />
                          <TextField label="ماه" value={isargariForm.asaratMah} onChange={(v) => setIsargariForm(c => ({...c, asaratMah:v}))} numeric maxLength={2} />
                          <TextField label="روز" value={isargariForm.asaratRoz} onChange={(v) => setIsargariForm(c => ({...c, asaratRoz:v}))} numeric maxLength={2} />
                        </div>
                      </div>
                    )}
                    </div>
                  </section>

                  <section className={styles.isargariFormSection}>
                    <div className={styles.isargariFormSectionTitle}>
                    <span>خانواده شهید</span>
                    <small>اطلاعات شهید و نسبت خانوادگی</small>
                    </div>
                    <div className={styles.isargariFormGrid}>
                    <label className={`${styles.field} ${styles.isargariSelectField}`}>
                      <span>خانواده شهید</span>
                      <select
                        value={isargariForm.khanevadeShahid ? "1" : "0"}
                        onChange={(e) => setIsargariForm(c => ({
                          ...c,
                          khanevadeShahid: e.target.value === "1",
                          nameShahid: e.target.value === "1" ? c.nameShahid : "",
                          tarikhMahalShahadat: e.target.value === "1" ? c.tarikhMahalShahadat : "",
                          nesbatBaShahid: e.target.value === "1" ? c.nesbatBaShahid : "",
                        }))}
                      >
                        <option value="0">خیر</option>
                        <option value="1">بله</option>
                      </select>
                    </label>
                    {isargariForm.khanevadeShahid && (
                      <>
                        <TextField label="نام شهید (شهدا)" value={isargariForm.nameShahid} onChange={(v) => setIsargariForm(c => ({...c, nameShahid:v}))} maxLength={500} />
                        <TextField label="نسبت با شهید" value={isargariForm.nesbatBaShahid} onChange={(v) => setIsargariForm(c => ({...c, nesbatBaShahid:v}))} maxLength={150} />
                        <div className={styles.isargariWideInput}>
                          <TextField label="تاریخ و محل شهادت" value={isargariForm.tarikhMahalShahadat} onChange={(v) => setIsargariForm(c => ({...c, tarikhMahalShahadat:v}))} maxLength={500} />
                        </div>
                      </>
                    )}
                    </div>
                  </section>
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={isargariSaving} onClick={() => setIsargariModalOpen(false)}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} disabled={isargariSaving} onClick={() => void saveIsargariRow()}>
                    {isargariSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {isargari ? "ذخیره تغییرات" : "ثبت اطلاعات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {isargariDeleteOpen && detailTab === "sacrifice" && (
            <ConfirmDialog tone="danger" title="حذف اطلاعات ایثارگری" text="اطلاعات ایثارگری این شخص حذف شود؟" confirmText="حذف شود" busy={isargariSaving} onCancel={() => setIsargariDeleteOpen(false)} onConfirm={() => void confirmDeleteIsargari()} />
          )}

          {workHistoryModalOpen && detailTab === "work-history" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingWorkHistoryId === null ? "افزودن سابقه شغلی" : "ویرایش سابقه شغلی"}>
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div><small>سوابق شغلی</small><h3>{editingWorkHistoryId === null ? "افزودن سابقه جدید" : "ویرایش سابقه شغلی"}</h3></div>
                  </div>
                  <button type="button" disabled={workHistorySaving} onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.workHistoryForm}>
                  <label className={styles.field}>
                    <span>محل خدمت</span>
                    <SearchableDropdown
                    value={workHistoryForm.mahal}
                    options={cityOptions}
                    onChange={(value) => setWorkHistoryForm((current) => ({ ...current, mahal: value }))}
                    searchPlaceholder="جست‌وجو و انتخاب شهرستان محل خدمت..."
                    compact
                    />
                  </label>

                  <TextField
                    label="سمت (پست سازمانی)"
                    value={workHistoryForm.sematPostSazmani}
                    onChange={(value) => setWorkHistoryForm((current) => ({ ...current, sematPostSazmani: value }))}
                    required
                    maxLength={150}
                  />

                  <InputPersianDate label="از تاریخ" value={workHistoryForm.azTarikh} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, azTarikh: value ?? "" }))} placeholder="انتخاب تاریخ شروع" />
                  <InputPersianDate label="تا تاریخ" value={workHistoryForm.taTarikh} onChange={(value) => setWorkHistoryForm((current) => ({ ...current, taTarikh: value ?? "" }))} placeholder="تا اکنون" />
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={workHistorySaving} onClick={() => { resetWorkHistoryForm(); setWorkHistoryModalOpen(false); }}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} onClick={() => void saveWorkHistoryRow()} disabled={workHistorySaving}>
                    {workHistorySaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {editingWorkHistoryId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {workHistoryDeleteTarget && detailTab === "work-history" && (
            <ConfirmDialog
              tone="danger"
              title="حذف سابقه شغلی"
              text={`سابقه شغلی «${workHistoryDeleteTarget.SematPostSazmani || "انتخاب‌شده"}» حذف شود؟`}
              confirmText="حذف شود"
              busy={workHistorySaving}
              onCancel={() => setWorkHistoryDeleteTarget(null)}
              onConfirm={() => void confirmDeleteWorkHistory()}
            />
          )}

          {sabegeNezaratModalOpen && detailTab === "election-supervision" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegeNezaratId === null ? "افزودن سابقه نظارتی" : "ویرایش سابقه نظارتی"}>
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div><small>سوابق نظارتی و اجرایی انتخابات</small><h3>{editingSabegeNezaratId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                  </div>
                  <button type="button" disabled={sabegeNezaratSaving} onClick={() => { resetSabegeNezaratForm(); setSabegeNezaratModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.workHistoryForm}>
                  <TextField
                    label="دوره انتخاباتی"
                    value={sabegeNezaratForm.doreEntekhabat}
                    onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, doreEntekhabat: value }))}
                    required
                    maxLength={150}
                  />
                  <TextField
                    label="سمت انتخاباتی"
                    value={sabegeNezaratForm.sematEntekhabat}
                    onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, sematEntekhabat: value }))}
                    required
                    maxLength={150}
                  />
                  <label className={styles.field}>
                    <span>محل<i>*</i></span>
                    <SearchableDropdown
                    value={sabegeNezaratForm.mahal}
                    options={cityOptions}
                    onChange={(value) => setSabegeNezaratForm((current) => ({ ...current, mahal: value }))}
                    searchPlaceholder="جست‌وجو و انتخاب محل..."
                    compact
                    />
                  </label>
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={sabegeNezaratSaving} onClick={() => { resetSabegeNezaratForm(); setSabegeNezaratModalOpen(false); }}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegeNezaratRow()} disabled={sabegeNezaratSaving}>
                    {sabegeNezaratSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {editingSabegeNezaratId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {sabegeNezaratDeleteTarget && detailTab === "election-supervision" && (
            <ConfirmDialog
              tone="danger"
              title="حذف سابقه نظارتی و اجرایی انتخابات"
              text={`سابقه «${sabegeNezaratDeleteTarget.DoreEntekhabat || "انتخاب‌شده"}» حذف شود؟`}
              confirmText="حذف شود"
              busy={sabegeNezaratSaving}
              onCancel={() => setSabegeNezaratDeleteTarget(null)}
              onConfirm={() => void confirmDeleteSabegeNezarat()}
            />
          )}

          {sabegheFaliyatEjtemaiModalOpen && detailTab === "social-activities" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegheFaliyatEjtemaiId === null ? "افزودن سابقه فعالیت اجتماعی" : "ویرایش سابقه فعالیت اجتماعی"}>
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div><small>سوابق فعالیت‌های اجتماعی</small><h3>{editingSabegheFaliyatEjtemaiId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                  </div>
                  <button type="button" disabled={sabegheFaliyatEjtemaiSaving} onClick={() => { resetSabegheFaliyatEjtemaiForm(); setSabegheFaliyatEjtemaiModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.workHistoryForm}>
                  <TextField
                    label="نام نهاد، تشکل یا حزب"
                    value={sabegheFaliyatEjtemaiForm.nameNahadTashakolHezb}
                    onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, nameNahadTashakolHezb: value }))}
                    required
                    maxLength={250}
                  />
                  <label className={styles.field}>
                    <span>محل فعالیت (استان و شهرستان)<i>*</i></span>
                    <SearchableDropdown
                    value={sabegheFaliyatEjtemaiForm.mahal}
                    options={cityOptions}
                    onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, mahal: value }))}
                    searchPlaceholder="جست‌وجو و انتخاب محل فعالیت..."
                    compact
                    />
                  </label>
                  <InputPersianDate label="از تاریخ" value={sabegheFaliyatEjtemaiForm.azTarikh} onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, azTarikh: value ?? "" }))} placeholder="انتخاب تاریخ شروع" />
                  <InputPersianDate label="تا تاریخ" value={sabegheFaliyatEjtemaiForm.taTarikh} onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, taTarikh: value ?? "" }))} placeholder="انتخاب تاریخ پایان" />
                  <TextField
                    label="ملاحظات"
                    value={sabegheFaliyatEjtemaiForm.molahazat}
                    onChange={(value) => setSabegheFaliyatEjtemaiForm((current) => ({ ...current, molahazat: value }))}
                    maxLength={1000}
                  />
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={sabegheFaliyatEjtemaiSaving} onClick={() => { resetSabegheFaliyatEjtemaiForm(); setSabegheFaliyatEjtemaiModalOpen(false); }}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegheFaliyatEjtemaiRow()} disabled={sabegheFaliyatEjtemaiSaving}>
                    {sabegheFaliyatEjtemaiSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {editingSabegheFaliyatEjtemaiId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {sabegheFaliyatEjtemaiDeleteTarget && detailTab === "social-activities" && (
            <ConfirmDialog
              tone="danger"
              title="حذف سابقه فعالیت اجتماعی"
              text={`سابقه «${sabegheFaliyatEjtemaiDeleteTarget.NameNahadTashakolHezb || "انتخاب‌شده"}» حذف شود؟`}
              confirmText="حذف شود"
              busy={sabegheFaliyatEjtemaiSaving}
              onCancel={() => setSabegheFaliyatEjtemaiDeleteTarget(null)}
              onConfirm={() => void confirmDeleteSabegheFaliyatEjtemai()}
            />
          )}

          {doreAmozeshiModalOpen && detailTab === "training" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingDoreAmozeshiId === null ? "افزودن دوره آموزشی" : "ویرایش دوره آموزشی"}>
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div><small>دوره‌های آموزشی عمومی و تخصصی</small><h3>{editingDoreAmozeshiId === null ? "افزودن دوره جدید" : "ویرایش دوره آموزشی"}</h3></div>
                  </div>
                  <button type="button" disabled={doreAmozeshiSaving} onClick={() => { resetDoreAmozeshiForm(); setDoreAmozeshiModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.workHistoryForm}>
                  <TextField label="نام دوره" value={doreAmozeshiForm.nameDore} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, nameDore: value }))} required maxLength={250} />
                  <TextField label="مدت دوره به ساعت" value={doreAmozeshiForm.modatSaat} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, modatSaat: value.replace(/[^0-9۰-۹]/g, "") }))} required maxLength={8} />
                  <TextField label="نام مرکز و محل آموزش" value={doreAmozeshiForm.nameMarkazMahalAmozesh} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, nameMarkazMahalAmozesh: value }))} required maxLength={300} />
                  <label className={styles.field}>
                    <span>نوع مدرک<i>*</i></span>
                    <SearchableDropdown
                    value={doreAmozeshiForm.noeMadrak}
                    options={definitionOptions(PERSON_DFN_PID.educationCertificateType)}
                    onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, noeMadrak: value }))}
                    searchPlaceholder="انتخاب نوع مدرک..."
                    compact
                    />
                  </label>
                  <InputPersianDate label="تاریخ اخذ مدرک" value={doreAmozeshiForm.tarikhAkhzMadrak} onChange={(value) => setDoreAmozeshiForm((current) => ({ ...current, tarikhAkhzMadrak: value ?? "" }))} placeholder="انتخاب تاریخ اخذ مدرک" />
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={doreAmozeshiSaving} onClick={() => { resetDoreAmozeshiForm(); setDoreAmozeshiModalOpen(false); }}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} onClick={() => void saveDoreAmozeshiRow()} disabled={doreAmozeshiSaving}>
                    {doreAmozeshiSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {editingDoreAmozeshiId === null ? "ثبت دوره" : "ذخیره تغییرات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {doreAmozeshiDeleteTarget && detailTab === "training" && (
            <ConfirmDialog
              tone="danger"
              title="حذف دوره آموزشی"
              text={`دوره «${doreAmozeshiDeleteTarget.NameDore || "انتخاب‌شده"}» حذف شود؟`}
              confirmText="حذف شود"
              busy={doreAmozeshiSaving}
              onCancel={() => setDoreAmozeshiDeleteTarget(null)}
              onConfirm={() => void confirmDeleteDoreAmozeshi()}
            />
          )}


          {sabegheEntekhabatModalOpen && detailTab === "candidacy" && (
            <div className={styles.workHistoryModalBackdrop}>
              <section className={styles.workHistoryModal} role="dialog" aria-modal="true" aria-label={editingSabegheEntekhabatId === null ? "افزودن سابقه داوطلبی" : "ویرایش سابقه داوطلبی"}>
                <header>
                  <div className={styles.workHistoryModalTitle}>
                    <span className={styles.wizardIcon}><Icon name="file" /></span>
                    <div><small>سابقه داوطلبی در انتخابات</small><h3>{editingSabegheEntekhabatId === null ? "افزودن سابقه جدید" : "ویرایش سابقه"}</h3></div>
                  </div>
                  <button type="button" disabled={sabegheEntekhabatSaving} onClick={() => { resetSabegheEntekhabatForm(); setSabegheEntekhabatModalOpen(false); }} aria-label="بستن"><Icon name="close" /></button>
                </header>

                <div className={styles.workHistoryForm}>
                  <TextField
                    label="نوع انتخابات"
                    value={sabegheEntekhabatForm.noeEntekhabat}
                    onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, noeEntekhabat: value }))}
                    required
                    maxLength={150}
                  />
                  <TextField
                    label="حوزه انتخابیه"
                    value={sabegheEntekhabatForm.hozeEntekhabieh}
                    onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, hozeEntekhabieh: value }))}
                    required
                    maxLength={250}
                  />
                  <TextField
                    label="نتیجه"
                    value={sabegheEntekhabatForm.natijeh}
                    onChange={(value) => setSabegheEntekhabatForm((current) => ({ ...current, natijeh: value }))}
                    maxLength={250}
                  />
                </div>

                <footer>
                  <button type="button" className={styles.cancelButton} disabled={sabegheEntekhabatSaving} onClick={() => { resetSabegheEntekhabatForm(); setSabegheEntekhabatModalOpen(false); }}>انصراف</button>
                  <button type="button" className={styles.sectionSaveButton} onClick={() => void saveSabegheEntekhabatRow()} disabled={sabegheEntekhabatSaving}>
                    {sabegheEntekhabatSaving ? <span className={styles.buttonSpinner} /> : <Icon name="check" />}
                    {editingSabegheEntekhabatId === null ? "ثبت سابقه" : "ذخیره تغییرات"}
                  </button>
                </footer>
              </section>
            </div>
          )}

          {sabegheEntekhabatDeleteTarget && detailTab === "candidacy" && (
            <ConfirmDialog
              tone="danger"
              title="حذف سابقه داوطلبی در انتخابات"
              text={`سابقه «${sabegheEntekhabatDeleteTarget.NoeEntekhabat || "انتخاب‌شده"}» حذف شود؟`}
              confirmText="حذف شود"
              busy={sabegheEntekhabatSaving}
              onCancel={() => setSabegheEntekhabatDeleteTarget(null)}
              onConfirm={() => void confirmDeleteSabegheEntekhabat()}
            />
          )}

        </>
      )}

      {finalConfirm && <ConfirmDialog tone="success" title="تأیید ثبت نهایی اطلاعات" text={`اطلاعات ${`${form.firstName} ${form.lastName}`.trim()} پس از تأیید به وضعیت ثبت نهایی منتقل می‌شود. آیا اطلاعات بررسی شده است؟`} confirmText="بله، ثبت نهایی شود" busy={saving} onCancel={() => setFinalConfirm(false)} onConfirm={() => void finalizePerson()} />}
      {deleteTarget && <ConfirmDialog tone="danger" title="حذف شخص از فهرست" text={`پرونده ${`${deleteTarget.FirstName} ${deleteTarget.LastName}`.trim() || "انتخاب‌شده"} به‌صورت نرم حذف می‌شود و در فهرست نمایش داده نخواهد شد.`} confirmText="حذف شود" busy={saving} onCancel={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
    </main>
  );
}
