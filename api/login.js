import { guard } from "./_lib.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!(await guard(req, res))) return;
  res.status(200).json({ ok: true });
}
