import { put, list, del } from "@vercel/blob";
import crypto from "node:crypto";

export { put, del };

const DATA_PATH = "data/memories.json";
const PHOTO_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

function samePassword(given) {
  const real = process.env.ADMIN_PASSWORD || "";
  const a = crypto.createHash("sha256").update(String(given)).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Resolves true when the request carries the right password. Otherwise it answers the request and resolves false. */
export async function guard(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not set in Vercel yet." });
    return false;
  }
  if (!samePassword(req.headers["x-admin-password"] || "")) {
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ error: "Wrong password." });
    return false;
  }
  return true;
}

export async function readList() {
  const { blobs } = await list({ prefix: DATA_PATH, limit: 5 });
  const hit = blobs.find((b) => b.pathname === DATA_PATH);
  if (!hit) return [];
  const r = await fetch(hit.url + "?t=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("Could not read the memories list (" + r.status + ").");
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

export async function writeList(items) {
  await put(DATA_PATH, JSON.stringify(items), {
    access: "public",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export const MAX_PHOTOS = 500;

export function cleanPhotos(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((u) => typeof u === "string" && PHOTO_URL.test(u)).slice(0, MAX_PHOTOS);
}

/** All photo URLs of a memory, including the older single `photo` field. */
export function photosOf(m) {
  const a = Array.isArray(m && m.photos) ? m.photos.filter((u) => typeof u === "string" && u) : [];
  if (!a.length && m && typeof m.photo === "string" && m.photo) return [m.photo];
  return a;
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Returns a safe memory object, or null when the title is missing. */
export function clean(m) {
  if (!m || typeof m !== "object") return null;
  const title = str(m.title, 120);
  if (!title) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(m.date || "") ? m.date : "";
  let photos = cleanPhotos(m.photos);
  if (!photos.length) photos = cleanPhotos([m.photo]);
  return {
    title,
    date,
    place: str(m.place, 120),
    people: str(m.people, 200),
    story: str(m.story, 6000),
    photos,
    photo: photos[0] || "",
  };
}

export function isBlobPhoto(url) {
  return typeof url === "string" && PHOTO_URL.test(url);
}
