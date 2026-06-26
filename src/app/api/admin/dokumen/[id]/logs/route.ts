import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDocumentLogs } from "@/lib/admin/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const logs = await getDocumentLogs(Number(id));

  return NextResponse.json(logs);
}
