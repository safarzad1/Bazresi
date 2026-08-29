import { NextRequest, NextResponse } from "next/server";
import { listCurrentAppointments } from "@/lib/appointments-db";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function textValue(value: string | null, maxLength: number) {
  return (value ?? "").trim().slice(0, maxLength);
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { message: "نشست شما منقضی شده است؛ دوباره وارد شوید." },
      { status: 401 },
    );
  }
  if (!session.permissions.appointments && !session.isSystemAdmin) {
    return NextResponse.json({ message: "مجوز دسترسی به انتصابات را ندارید." }, { status: 403 });
  }

  try {
    const search = textValue(request.nextUrl.searchParams.get("search"), 150).toLocaleLowerCase("fa");
    const page = boundedInteger(request.nextUrl.searchParams.get("page"), 1, 1, 1_000_000);
    const pageSize = boundedInteger(request.nextUrl.searchParams.get("pageSize"), 10, 5, 100);

    const allRows = await listCurrentAppointments(session.userId);
    const filtered = search
      ? allRows.filter((row) => {
          const haystack = [
            row.FullName,
            row.PostOnvan,
            row.TarikhEblagh,
            row.TarikhLaghv,
            row.PersonId ? String(row.PersonId) : "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("fa");
          return haystack.includes(search);
        })
      : allRows;

    const totalCount = filtered.length;
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return NextResponse.json({ rows, totalCount, page, pageSize });
  } catch (error) {
    console.error("Current appointments list failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "دریافت فهرست انتصاب‌های جاری با خطا روبه‌رو شد." },
      { status: 500 },
    );
  }
}
