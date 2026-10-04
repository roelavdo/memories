# Roel Memories

Static site for Vercel. No build step.

## Add a memory
1. Put the photo in the `photos` folder (JPG, PNG or WebP, ideally under 2 MB).
2. Add an entry to `memories.json`:

```json
[
  {
    "title": "Evening at the lake",
    "date": "2026-10-02",
    "place": "Tirana Artificial Lake",
    "people": "me",
    "story": "A few lines about the day.",
    "photo": "photos/lake.jpg"
  }
]
```

3. Commit and push. Vercel redeploys on its own.

`title` is required. `date` uses YYYY-MM-DD. Everything else is optional.
