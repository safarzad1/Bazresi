export const PERSON_DFN_PID = {
  relation: 1018,
  life: 1017,
  certificateStatus: 1019,
  descriptionAvailability: 10110,
  gender: 1012,
  maritalStatus: 1013,
  religionSect: 10111,
  clergyStatus: 10112,
  militaryStatus: 10113,
  exemptionType: 1011401,
} as const;

export const PERSON_DFN_PIDS = Array.from(
  new Set(Object.values(PERSON_DFN_PID)),
);
