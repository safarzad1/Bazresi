import { NextResponse } from "next/server";
import { getOrganizationStructure } from "@/lib/organization-db";
import { getCurrentSession } from "@/lib/session";

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
