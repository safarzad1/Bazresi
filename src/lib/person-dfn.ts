export const PERSON_DFN_PID = {
  relation: 1018,
  life: 1017,
  yesNo: 10103,
  gender: 1012,
  maritalStatus: 1013,
  religionSect: 10111,
  clergyStatus: 10107,
  militaryStatus: 10108,
  exemptionType: 10109,
} as const;

export const PERSON_DFN_PIDS = Array.from(
  new Set(Object.values(PERSON_DFN_PID)),
);
