import { NextResponse, type NextRequest } from "next/server";
import { getProductsByIds } from "@/lib/supabase/data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inv\u00e1lida." }, { status: 400 });
  }

  const ids =
    typeof body === "object" && body !== null && "ids" in body && Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string" && uuidPattern.test(id))
      : [];

  if (ids.length > 50) {
    return NextResponse.json(
      { error: "La lista supera el l\u00edmite permitido." },
      { status: 400 },
    );
  }

  const products = await getProductsByIds(ids);
  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
