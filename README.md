# Year 10 Geography Exam Coach v47 (Next.js)

This is the v47 upgrade of the Year 10 Geography Exam Coach based on `year10-geography-v46.html`.

## Features
- Same core structure: Learn, Read Q&A, Practice, Review, Parent View.
- Simple Supabase email/password login.
- One main Check flow in Practice (question → answer → Check → feedback card).
- OpenAI marking only from server-side API route (`/api/check`).
- Saved progress in Supabase when logged in, localStorage fallback when logged out.

## 1) Install
```bash
npm install
```

## 2) Environment variables
Create `.env.local` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## 3) Database setup
Run SQL migration in Supabase SQL editor:
- `supabase/migrations/202604280001_init_v47.sql`

## 4) Run locally
```bash
npm run dev
```

Open `http://localhost:3000`.

## 5) Netlify deploy
1. Push repo to Git provider.
2. Connect project in Netlify.
3. Add env vars listed above in Netlify UI.
4. Keep build command: `npm run build`.
5. Keep Next.js Netlify plugin from `netlify.toml`.

## Notes
- No API key is exposed in browser code.
- Question bank comes from extracted v46 baseline content.
