import crypto from "node:crypto";
import { guard, readList, writeList, clean, cleanPhotos, photosOf, MAX_PHOTOS, del, isBlobPhoto } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      return res.status(200).json(await readList());
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Use GET or POST." });
    if (!(await guard(req, res))) return;

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    body = body || {};

    if (body.action === "add") {
      const m = clean(body.memory);
      if (!m) return res.status(400).json({ error: "A title is required." });
      const items = await readList();
      if (items.length >= 2000) return res.status(400).json({ error: "The archive is full." });
      const entry = { id: crypto.randomUUID(), ...m, createdAt: Date.now() };
      items.push(entry);
      await writeList(items);
      return res.status(200).json({ ok: true, memory: entry });
    }

    if (body.action === "addPhotos") {
      const id = String(body.id || "");
      const add = cleanPhotos(body.photos);
      if (!add.length) return res.status(400).json({ error: "No photos to add." });
      const items = await readList();
      const hit = items.find((m) => m.id === id);
      if (!hit) return res.status(404).json({ error: "That memory was not found." });
      const merged = [...photosOf(hit), ...add];
      if (merged.length > MAX_PHOTOS) return res.status(400).json({ error: "That memory has too many photos." });
      hit.photos = merged;
      hit.photo = merged[0];
      await writeList(items);
      return res.status(200).json({ ok: true, count: merged.length });
    }

    if (body.action === "delete") {
      const id = String(body.id || "");
      const items = await readList();
      const hit = items.find((m) => m.id === id);
      if (!hit) return res.status(404).json({ error: "That memory was not found." });
      await writeList(items.filter((m) => m.id !== id));
      const urls = photosOf(hit).filter(isBlobPhoto);
      if (urls.length) {
        try { await del(urls); } catch (_) { /* the memory is already gone; stray photos are harmless */ }
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
