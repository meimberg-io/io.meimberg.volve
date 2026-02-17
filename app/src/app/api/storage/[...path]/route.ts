import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const storagePath = path.join("/");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000";
  const url = `${supabaseUrl}/storage/v1/object/public/${storagePath}`;

  const res = await fetch(url);

  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: res.status });
  }

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
