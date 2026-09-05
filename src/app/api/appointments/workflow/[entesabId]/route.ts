import { NextRequest,NextResponse } from "next/server";
import { getAppointmentWorkflow } from "@/lib/appointment-workflow-db";
import { getCurrentSession, sessionHasMenu } from "@/lib/session";
import { ACCESS_MENU } from "@/lib/access-menu";
export const runtime="nodejs";export const dynamic="force-dynamic";
type C={params:Promise<{entesabId:string}>};
export async function GET(_:NextRequest,c:C){const session=await getCurrentSession();if(!session)return NextResponse.json({message:"نشست شما منقضی شده است."},{status:401});if(!sessionHasMenu(session, ACCESS_MENU.appointmentsWorkflow))return NextResponse.json({message:"مجوز مشاهده این درخواست را ندارید."},{status:403});const n=Number((await c.params).entesabId);if(!Number.isSafeInteger(n)||n<1)return NextResponse.json({message:"شناسه درخواست معتبر نیست."},{status:400});try{const result=await getAppointmentWorkflow(session.userId,n);if(!result)return NextResponse.json({message:"درخواست پیدا نشد."},{status:404});return NextResponse.json(result);}catch(error){console.error("Appointment workflow detail failed",error);return NextResponse.json({message:error instanceof Error?error.message:"دریافت درخواست انجام نشد."},{status:500});}}
