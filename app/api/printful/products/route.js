import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API = "https://api.printful.com";

function headers(storeId) {
  const h = {
    Authorization: `Bearer ${process.env.PRINTFUL_TOKEN || ""}`,
    Accept: "application/json",
  };
  if (storeId) h["X-PF-Store-Id"] = storeId;
  return h;
}

async function printful(path, storeId) {
  const response = await fetch(API + path, {
    headers: headers(storeId),
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body?.error?.message ||
      body?.result ||
      body?.message ||
      `Printful request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return body;
}

async function resolveStoreId() {
  if (process.env.PRINTFUL_STORE_ID) return process.env.PRINTFUL_STORE_ID;

  const stores = await printful("/stores");
  const rows = Array.isArray(stores?.result) ? stores.result : [];

  // Store-level tokens do not require X-PF-Store-Id.
  // Account-level tokens do; when exactly one store is visible, use it safely.
  if (rows.length === 1 && rows[0]?.id) return String(rows[0].id);
  return "";
}

export async function GET() {
  if (!process.env.PRINTFUL_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "PRINTFUL_TOKEN is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const storeId = await resolveStoreId();
    const data = await printful("/store/products?status=synced&limit=100", storeId);
    const products = (Array.isArray(data?.result) ? data.result : []).map((p) => ({
      id: p.id,
      externalId: p.external_id || null,
      name: p.name || "Earthline product",
      variants: Number(p.variants || 0),
      synced: Number(p.synced || 0),
      thumbnailUrl: p.thumbnail_url || null,
      ignored: Boolean(p.is_ignored),
    })).filter((p) => !p.ignored);

    return NextResponse.json(
      {
        ok: true,
        connected: true,
        storeId: storeId || null,
        products,
        count: products.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, connected: false, error: String(error?.message || error) },
      { status: 502 }
    );
  }
}
