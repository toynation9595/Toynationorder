import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CLOUDINARY_FOLDER, signParams } from "@/lib/cloudinary";

/** Signs Upload Widget params (owner only). Uploads must go to our folder. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const params = body?.paramsToSign;
  if (!params || typeof params !== "object") return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (params.folder !== CLOUDINARY_FOLDER) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });

  return NextResponse.json({ signature: signParams(params) });
}
