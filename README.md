# Roel Memories

Deploys on Vercel with no build step.

- `/` is the public site. Each photo of a memory is one full screen, shown whole.
- `/admin` is the private portal. It needs the `ADMIN_PASSWORD` environment variable and a Vercel Blob store (Public).
- Memories added in the portal are stored in Blob. Old memories can still live in `memories.json` (optional).
