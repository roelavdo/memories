import { guard, put } from "./_lib.js";

const MAX = 4 * 1024 * 1024; // Vercel functions accept request bodies up to 4.5 MB
const TYPES = /^image\/(jpeg|png|webp|gif)$/;

async function rawBody(req) {
  const chunks = [];
  let n = 0;
  for await (const c of req) {
    n += c.length;
    if (n > MAX) { const e = new Error("That photo is too large. Keep it under 4 MB."); e.status = 413; throw e; }
    chunks.push(c);
  }
  const buf = Buffer.concat(chunks);
  if (buf.length === 0 && Buffer.isBuffer(req.body)) return req.body;
  return buf;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  try {
    if (!(await guard(req, res))) return;
    const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (!TYPES.test(type)) return res.status(400).json({ error: "Send a JPG, PNG, WebP or GIF image." });
    const data = await rawBody(req);
    if (data.length === 0) return res.status(400).json({ error: "The photo was empty." });
    const name = String(req.query.name || "photo")
      .toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "photo";
    const blob = await put("photos/" + name, data, {
      access: "public",
      addRandomSuffix: true,
      contentType: type,
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(e.status || 500).json({ error: String((e && e.message) || e) });
  }
}
