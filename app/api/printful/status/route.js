import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, connected: false, error: "PRINTFUL_TOKEN is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch("https://api.printful.com/stores", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, connected: false, status: response.status, error: body?.error?.message || body?.result || "Printful rejected the token." },
        { status: 502 }
      );
    }

    const stores = Array.isArray(body?.result) ? body.result : [];
    return NextResponse.json({
      ok: true,
      connected: true,
      stores: stores.map((s) => ({ id: s.id, name: s.name, type: s.type || null })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, connected: false, error: String(error?.message || error) },
      { status: 502 }
    );
  }
}
