import { NextResponse } from "next/server";
import { getOrganizationStructure } from "@/lib/organization-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { message: "نشست شما منقضی شده است؛ دوباره وارد شوید." },
      { status: 401 },
    );
  }
  if (!sessionHasMenu(session, ACCESS_MENU.organization)) {
    return NextResponse.json({ message: "دسترسی به ساختار سازمانی برای شما فعال نیست." }, { status: 403 });
  }

  try {
    return NextResponse.json({ nodes: await getOrganizationStructure() });
  } catch (error) {
    console.error("Organization structure failed:", error);
    return NextResponse.json(
      { message: "دریافت ساختار سازمانی انجام نشد." },
      { status: 500 },
    );
  }
}
