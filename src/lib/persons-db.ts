import type { IRecordSet, Request } from "mssql";
import { getDbPool } from "@/lib/db";
import { PERSON_DFN_PIDS } from "@/lib/person-dfn";

export type PersonListRecord = {
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

export type PersonLookupRecord = {
  GroupCode: number;
  Id: number;
  Title: string;
};

export type CityLookupRecord = {
  Id: number;
  Title: string;
};

export type MainPersonLookupRecord = {
  CodeMelli: string;
  FullName: string;
};

type DfnRecord = {
  ID: number;
  PID: number | null;
  NameFarsi: string | null;
  Value: number | null;
  IsGroup: number | null;
};

export type PersonRecord = PersonListRecord & {
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

export type PersonWriteInput = {
  personId: number;
  isFinal: boolean;
  codeMelli: string;
  codeMelliSarparast: string | null;
  nesbat: number | null;
  firstName: string;
  lastName: string;
  fatherName: string;
  tarikhTavalod: string | null;
  shomareShenasnameh: string;
  life: number | null;
  tarikhFoat: string | null;
  mahalTavalod: number | null;
  mahalSodor: number | null;
  serialHarf: string | null;
  serialSeri: string | null;
  serialCode: string | null;
  almosana: number | null;
  firstNameOld: string | null;
  lastNameOld: string | null;
  taghyiratShenasnamehSet: number | null;
  taghyiratShenasnameh: string | null;
  jensiat: number | null;
  shoghl: string;
  taahol: number | null;
  dinMazhab: number | null;
  rohani: number | null;
  nezamVazifeh: number | null;
  tarikhShoro: string | null;
  tarikhPayan: string | null;
  noeMoaafiat: number | null;
  tarikhMoaafiat: string | null;
  sharhMoaafiat: string | null;
  email: string | null;
  telHamrah: string | null;
  telZaruri: string | null;
  maharatRayaneh: string | null;
  vazeyatJesmani: string | null;
  addressManzel: string | null;
  telSabet: string | null;
  codeShahrestan: number | null;
  addressKar: string | null;
  telKar: string | null;

  noeTahsil: string | null;
  sathTahsilHozavi: string | null;
  hamtarazTahsil: string | null;
  mahalTahsil: string | null;
  balatarinMadrakTahsil: string | null;
  mahalAkhzMadrak: string | null;
  tarikhAkhzMadrak: string | null;

  vazeyatEshteghal: string | null;
  mahalKhedmatFeli: number | null;
  onvanPostSazmani: string | null;
  tarikhEntesab: string | null;
  akharinMahalKhedmat: number | null;
  akharinPostSazmani: string | null;
  moddatEntesab: string | null;

  actorUserId: string;
};

export async function listPersons(
  search: string,
  state: number | null,
  pageNumber: number,
  pageSize: number,
) {
  const pool = await getDbPool();
  const request = pool
    .request()
    .input("PageNumber", pageNumber)
    .input("PageSize", pageSize);

  if (search) request.input("Search", search);
  if (state !== null) request.input("State", state);

  const result = await request.execute("bz.SP_PersonAdmin_ListNormalized");
  const recordsets = result.recordsets as unknown as IRecordSet<any>[];

  const summary = (recordsets?.[1]?.[0] ?? {}) as {
    TotalCount?: number;
    DraftCount?: number;
    FinalCount?: number;
  };

  return {
    persons: (recordsets?.[0] ?? []) as PersonListRecord[],
    totalCount: Number(summary.TotalCount ?? 0),
    draftCount: Number(summary.DraftCount ?? 0),
    finalCount: Number(summary.FinalCount ?? 0),
  };
}

export async function getPersonLookups() {
  const pool = await getDbPool();
  const [cityResult, mainPersonResult, definitionResults] = await Promise.all([
    pool
      .request()
      .input("CityIdLength", 5)
      .execute("bz.SP_PersonAdmin_CityLookup"),
    pool.request().execute("bz.SP_PersonAdmin_HeadLookup"),
    Promise.all(
      PERSON_DFN_PIDS.map(async (pid) => {
        const result = await pool
          .request()
          .input("PID", pid)
          .execute("bz.SP_PersonAdmin_DfnLookup");
        return { pid, rows: (result.recordset ?? []) as DfnRecord[] };
      }),
    ),
  ]);

  const definitions = definitionResults.flatMap(({ pid, rows }) =>
    rows
      .filter(
        (item) => item.Value !== null && Number.isInteger(Number(item.Value)),
      )
      .map((item) => ({
        GroupCode: pid,
        Id: Number(item.Value),
        Title: String(item.NameFarsi ?? item.Value ?? "").trim(),
      })),
  );

  return {
    definitions: definitions as PersonLookupRecord[],
    cities: (cityResult.recordset ?? []) as CityLookupRecord[],
    mainPersons: (mainPersonResult.recordset ?? []) as MainPersonLookupRecord[],
  };
}

export async function searchMainPersons(search: string) {
  const pool = await getDbPool();
  const request = pool.request();
  if (search) request.input("Search", search);
  const result = await request.execute("bz.SP_PersonAdmin_HeadLookup");

  return (result.recordset ?? []) as MainPersonLookupRecord[];
}

export async function validatePersonNationalCode(nationalCode: string) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("NationalCode", nationalCode)
    .execute("bz.SP_PersonAdmin_ValidateNationalCode");

  const value = result.recordset?.[0]?.IsValid;
  return value === true || value === 1;
}

export async function validatePersonMobileNumber(mobileNumber: string) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("MobileNumber", mobileNumber)
    .execute("bz.SP_PersonAdmin_ValidateMobileNumber");

  const value = result.recordset?.[0]?.IsValid;
  return value === true || value === 1;
}

export async function getPerson(personId: number) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("PersonId", personId)
    .execute("bz.SP_PersonAdmin_Get");
  return (result.recordset?.[0] as PersonRecord | undefined) ?? null;
}

function bindPerson(request: Request, input: PersonWriteInput) {
  return request
    .input("PersonId", input.personId)
    .input("IsFinal", input.isFinal)
    .input("CodeMelli", input.codeMelli)
    .input("CodeMelliSarparast", input.codeMelliSarparast)
    .input("Nesbat", input.nesbat)
    .input("FirstName", input.firstName)
    .input("LastName", input.lastName)
    .input("FatherName", input.fatherName)
    .input("TarikhTavalod", input.tarikhTavalod)
    .input("ShomareShenasnameh", input.shomareShenasnameh)
    .input("Life", input.life)
    .input("TarikhFoat", input.tarikhFoat)
    .input("MahalTavalod", input.mahalTavalod)
    .input("MahalSodor", input.mahalSodor)
    .input("Serial_Harf", input.serialHarf)
    .input("Serial_Seri", input.serialSeri)
    .input("Serial_Code", input.serialCode)
    .input("Almosana", input.almosana)
    .input("FirstNameOld", input.firstNameOld)
    .input("LastNameOld", input.lastNameOld)
    .input("TaghyiratShenasnamehSet", input.taghyiratShenasnamehSet)
    .input("TaghyiratShenasnameh", input.taghyiratShenasnameh)
    .input("Jensiat", input.jensiat)
    .input("Shoghl", input.shoghl)
    .input("Taahol", input.taahol)
    .input("DinMazhab", input.dinMazhab)
    .input("Rohani", input.rohani)
    .input("NezamVazifeh", input.nezamVazifeh)
    .input("TarikhShoro", input.tarikhShoro)
    .input("TarikhPayan", input.tarikhPayan)
    .input("NoeMoaafiat", input.noeMoaafiat)
    .input("TarikhMoaafiat", input.tarikhMoaafiat)
    .input("SharhMoaafiat", input.sharhMoaafiat)
    .input("Email", input.email)
    .input("TelHamrah", input.telHamrah)
    .input("TelZaruri", input.telZaruri)
    .input("MaharatRayaneh", input.maharatRayaneh)
    .input("VazeyatJesmani", input.vazeyatJesmani)
    .input("AddressManzel", input.addressManzel)
    .input("TelSabet", input.telSabet)
    .input("CodeShahrestan", input.codeShahrestan)
    .input("AddressKar", input.addressKar)
    .input("TelKar", input.telKar)

    .input("NoeTahsil", input.noeTahsil)
    .input("SathTahsilHozavi", input.sathTahsilHozavi)
    .input("HamtarazTahsil", input.hamtarazTahsil)
    .input("MahalTahsil", input.mahalTahsil)
    .input("BalatarinMadrakTahsil", input.balatarinMadrakTahsil)
    .input("MahalAkhzMadrak", input.mahalAkhzMadrak)
    .input("TarikhAkhzMadrak", input.tarikhAkhzMadrak)

    .input("VazeyatEshteghal", input.vazeyatEshteghal)
    .input("MahalKhedmatFeli", input.mahalKhedmatFeli)
    .input("OnvanPostSazmani", input.onvanPostSazmani)
    .input("TarikhEntesab", input.tarikhEntesab)
    .input("AkharinMahalKhedmat", input.akharinMahalKhedmat)
    .input("AkharinPostSazmani", input.akharinPostSazmani)
    .input("ModdatEntesab", input.moddatEntesab)

    .input("ActorUserId", input.actorUserId);
}

export async function savePerson(input: PersonWriteInput) {
  const pool = await getDbPool();
  const result = await bindPerson(pool.request(), input).execute(
    "bz.SP_PersonAdmin_SaveNormalized",
  );
  return (result.recordset?.[0] as {
    PersonId: number;
    RegistrationState: number;
    ImagePath: string | null;
  } | undefined) ?? null;
}

export async function setPersonImage(
  personId: number,
  fileName: string,
  actorUserId: string,
) {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input("PersonId", personId)
    .input("FileName", fileName)
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_PersonAdmin_ImageSet");
  return (result.recordset?.[0] as {
    OldFileName: string | null;
    FileName: string;
  } | undefined) ?? null;
}

export async function deletePerson(personId: number, actorUserId: string) {
  const pool = await getDbPool();
  await pool
    .request()
    .input("PersonId", personId)
    .input("ActorUserId", actorUserId)
    .execute("bz.SP_PersonAdmin_Delete");
}
