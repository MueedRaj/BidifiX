# CRA (craco) → Vite Migration Notes

Note: The uploaded project was already plain **JavaScript/JSX** (Create React App
via craco) — there was no TypeScript in it. So this conversion is: **CRA/craco → Vite,
staying in JS/JSX**, exactly as requested. The Python/FastAPI **backend was not
touched at all**.

## What changed in `frontend/`

| Before (CRA + craco) | After (Vite) |
|---|---|
| `public/index.html` | `index.html` at project root, with `<script type="module" src="/src/main.jsx">` |
| `src/index.js` | `src/main.jsx` |
| `src/App.js` | `src/App.jsx` |
| `craco.config.js`, `plugins/health-check/*` | removed (webpack-only dev feature) — replaced by `vite.config.js` |
| `process.env.REACT_APP_BACKEND_URL` | `import.meta.env.VITE_BACKEND_URL` |
| `frontend/env.txt` (`REACT_APP_*`) | `frontend/.env` (`VITE_*`) |
| `react-scripts`, `@craco/craco`, `cra-template`, `@emergentbase/visual-edits` deps | removed |
| scripts: `craco start/build/test` | `vite` / `vite build` / `vite preview` |
| `tailwind.config.js` content glob `./public/index.html` | `./index.html` |
| `@` import alias (was webpack alias in craco.config.js) | now set in `vite.config.js` `resolve.alias` |

Everything else — all components, pages, hooks, contexts, shadcn/ui components,
Tailwind config, `components.json`, `jsconfig.json` (kept for editor path
IntelliSense) — is untouched, just relocated where Vite expects it.

## What did NOT change

- `backend/` — 100% untouched (FastAPI, Motor/MongoDB, JWT auth, Stripe, `/api` prefix).
- All business logic, UI, and routing behavior.

## Running it

**Backend** (unchanged):
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Frontend** (now Vite):
```bash
cd frontend
yarn install   # or npm install
yarn dev       # starts Vite on http://localhost:3000
```

The frontend calls the backend via the absolute URL in `frontend/.env`
(`VITE_BACKEND_URL`), same pattern as before — just renamed for Vite's env
convention (Vite only exposes vars prefixed `VITE_` to client code).

## ⚠️ Security note (unrelated to the migration)

`backend/.env` contains live-looking secrets (MongoDB Atlas URI with password,
JWT secret, admin password, Stripe test key). These were copied as-is so the
app keeps working, but if this repo is ever made public or shared, please
rotate them.
