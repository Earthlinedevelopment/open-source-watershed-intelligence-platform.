"use client";

import { useEffect, useState } from "react";

const shell = {
  minHeight: "100vh",
  background: "#eef1eb",
  color: "#173128",
  fontFamily: 'system-ui,-apple-system,"Segoe UI",sans-serif',
};

export default function MerchPage() {
  const [state, setState] = useState({ loading: true, products: [], error: "" });

  useEffect(() => {
    let alive = true;
    fetch("/api/printful/products", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok || !body.ok) throw new Error(body.error || "Printful connection failed.");
        return body;
      })
      .then((body) => {
        if (alive) setState({ loading: false, products: body.products || [], error: "" });
      })
      .catch((error) => {
        if (alive) setState({ loading: false, products: [], error: String(error.message || error) });
      });
    return () => { alive = false; };
  }, []);

  return (
    <main style={shell}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "38px 22px 60px" }}>
        <a href="/" style={{ display: "inline-block", marginBottom: 24, color: "#214a3c", textDecoration: "none", fontWeight: 800 }}>← Earthline</a>
        <h1 style={{ fontSize: 34, margin: "0 0 6px" }}>Earthline Merchandise</h1>
        <p style={{ color: "#56685f", margin: "0 0 30px" }}>Earthline hats and T-shirts.</p>

        {state.loading && <p>Connecting to Printful…</p>}

        {state.error && (
          <div style={{ padding: 16, borderRadius: 10, background: "#f4e5df", border: "1px solid #c89e8c" }}>
            Printful connection unavailable: {state.error}
          </div>
        )}

        {!state.loading && !state.error && state.products.length === 0 && (
          <div style={{ padding: 16, borderRadius: 10, background: "#e3e7dc", color: "#536056" }}>
            Printful is connected, but no synced products are currently available in this store.
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {state.products.map((p) => (
            <article key={p.id} style={{ background: "white", border: "1px solid #cbd3cc", borderRadius: 14, padding: 22, boxShadow: "0 8px 25px rgba(0,0,0,.06)" }}>
              {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt="" style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain", borderRadius: 10, marginBottom: 14 }} /> : null}
              <div style={{ fontWeight: 800, color: "#1e5d4a" }}>PRINTFUL</div>
              <h2 style={{ marginTop: 6 }}>{p.name}</h2>
              <p>{p.synced} synced variant{p.synced === 1 ? "" : "s"}</p>
            </article>
          ))}
        </section>

        <div style={{ marginTop: 30, padding: 16, borderRadius: 10, background: "#e3e7dc", color: "#536056", fontSize: 13 }}>
          Product data is loaded directly from Earthline&apos;s Printful store through a protected server-side connection. The Printful token is never sent to the browser.
        </div>
      </div>
    </main>
  );
}
