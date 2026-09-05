export const ACCESS_MENU = {
  dashboard: "DASHBOARD",
  persons: "PERSONS",
  appointmentsWorkflow: "APPOINTMENTS_WORKFLOW",
  appointmentsCurrent: "APPOINTMENTS_CURRENT",
  appointmentsCancellations: "APPOINTMENTS_CANCELLATIONS",
  evaluation: "EVALUATION",
  organization: "ORGANIZATION",
  users: "USERS",
  accessManagement: "ACCESS_MANAGEMENT",
  settings: "SETTINGS",
} as const;

export type AccessMenuCode = (typeof ACCESS_MENU)[keyof typeof ACCESS_MENU];

export function hasAccess(menuCodes: readonly string[] | undefined, code: string, isSystemAdmin = false) {
  return isSystemAdmin || Boolean(menuCodes?.includes(code));
}

export function menuCodeForPath(pathname: string): AccessMenuCode | null {
  if (pathname.startsWith("/Admin/Appointments/Workflow")) return ACCESS_MENU.appointmentsWorkflow;
  if (pathname.startsWith("/Admin/Appointments/Current")) return ACCESS_MENU.appointmentsCurrent;
  if (pathname.startsWith("/Admin/Appointments/Cancellations")) return ACCESS_MENU.appointmentsCancellations;
  if (pathname.startsWith("/Admin/Persons")) return ACCESS_MENU.persons;
  if (pathname.startsWith("/Admin/Evaluation")) return ACCESS_MENU.evaluation;
  if (pathname.startsWith("/Admin/OrganizationStructure")) return ACCESS_MENU.organization;
  if (pathname.startsWith("/Admin/AccessManagement")) return ACCESS_MENU.accessManagement;
  if (pathname.startsWith("/Admin/Users")) return ACCESS_MENU.users;
  if (pathname.startsWith("/Admin/Settings")) return ACCESS_MENU.settings;
  if (pathname.startsWith("/Admin/Dashboard")) return ACCESS_MENU.dashboard;
  return null;
}

export function firstAllowedAdminRoute(menuCodes: readonly string[] | undefined, isSystemAdmin = false) {
  if (isSystemAdmin) return "/Admin/Dashboard";
  const ordered: Array<[string, string]> = [
    [ACCESS_MENU.dashboard, "/Admin/Dashboard"],
    [ACCESS_MENU.persons, "/Admin/Persons"],
    [ACCESS_MENU.appointmentsWorkflow, "/Admin/Appointments/Workflow"],
    [ACCESS_MENU.appointmentsCurrent, "/Admin/Appointments/Current"],
    [ACCESS_MENU.appointmentsCancellations, "/Admin/Appointments/Cancellations"],
    [ACCESS_MENU.evaluation, "/Admin/Evaluation"],
    [ACCESS_MENU.organization, "/Admin/OrganizationStructure"],
    [ACCESS_MENU.users, "/Admin/Users"],
    [ACCESS_MENU.accessManagement, "/Admin/AccessManagement"],
    [ACCESS_MENU.settings, "/Admin/Settings"],
  ];
  return ordered.find(([code]) => menuCodes?.includes(code))?.[1] ?? "/Admin/AccessDenied";
}
