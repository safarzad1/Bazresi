import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getUserMenuAccessContext } from "@/lib/access-db";
import { ACCESS_MENU } from "@/lib/access-menu";

export const AUTH_COOKIE_NAME = "bazresi_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type SessionPermissions = {
  dashboard: boolean;
  evaluation: boolean;
  appointments: boolean;
  personnel: boolean;
  inquiries: boolean;
};

export type AuthSession = {
  userId: string;
  userName: string;
  fullName: string;
  mahalId: number | null;
  semat: number | null;
  sematTitle: string | null;
  mustChangePassword: boolean;
  isSystemAdmin: boolean;
  accessGroupId: number | null;
  accessGroupTitle: string | null;
  menuCodes: string[];
  permissions: SessionPermissions;
  issuedAt: number;
  expiresAt: number;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "bazresi-local-development-secret-change-me";
  }

  throw new Error("AUTH_SECRET باید در محیط عملیاتی و با حداقل ۳۲ نویسه تعریف شود.");
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", authSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  payload: Omit<AuthSession, "issuedAt" | "expiresAt">,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const session: AuthSession = {
    ...payload,
    issuedAt,
    expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(session));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;

  try {
    const [encodedPayload, suppliedSignature, extra] = token.split(".");
    if (!encodedPayload || !suppliedSignature || extra) return null;

    const expected = Buffer.from(sign(encodedPayload), "base64url");
    const supplied = Buffer.from(suppliedSignature, "base64url");

    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AuthSession;

    if (
      !session.userId ||
      !session.userName ||
      !session.fullName ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!session) return null;

  try {
    const access = await getUserMenuAccessContext(session.userId);
    const menuCodes = access.menuCodes;
    const isSystemAdmin = access.isSystemAdmin;
    return {
      ...session,
      isSystemAdmin,
      accessGroupId: access.groupId,
      accessGroupTitle: access.groupTitle,
      menuCodes,
      permissions: {
        dashboard: isSystemAdmin || menuCodes.includes(ACCESS_MENU.dashboard),
        evaluation: isSystemAdmin || menuCodes.includes(ACCESS_MENU.evaluation),
        appointments:
          isSystemAdmin ||
          menuCodes.includes(ACCESS_MENU.appointmentsWorkflow) ||
          menuCodes.includes(ACCESS_MENU.appointmentsCurrent) ||
          menuCodes.includes(ACCESS_MENU.appointmentsCancellations),
        personnel: isSystemAdmin || menuCodes.includes(ACCESS_MENU.persons),
        inquiries: isSystemAdmin,
      },
    };
  } catch (error) {
    console.error("Refresh access context failed:", error);
    return session;
  }
}

export function sessionHasMenu(session: AuthSession, menuCode: string) {
  return session.isSystemAdmin || Boolean(session.menuCodes?.includes(menuCode));
}

export function useSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}
