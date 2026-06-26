import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDocumentById } from "@/lib/admin/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocumentById(Number(id));

  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({
    id: doc.id,
    number: doc.number,
    title: doc.title,
    signatory: doc.signatory,
    issuedAt: doc.issuedAt,
    fileUrl: doc.fileUrl,
    status: doc.status,
  });
}
