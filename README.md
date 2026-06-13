# SplitWise Pro

Production-ready shared expenses management app built with FastAPI, SQLAlchemy, MySQL, React, Vite, Tailwind CSS, Framer Motion, React Router, TanStack Query, and Zustand.

## Run Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:DATABASE_URL="mysql+pymysql://root:password@localhost/splitwise_pro"
uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

## Run Frontend

```powershell
cd frontend
npm install
$env:VITE_API_URL="http://localhost:8000/api"
npm run dev
```

Frontend: `http://localhost:5173`

## Deployment

Frontend deploys to Vercel from `frontend/`.

Backend deploys to Render or Railway from `backend/` with:
- `DATABASE_URL`
- `JWT_SECRET`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

Database is MySQL using the schema in [backend/schema.sql](backend/schema.sql).

## Core API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/{group_id}`
- `GET /api/expenses/groups/{group_id}`
- `POST /api/expenses/groups/{group_id}`
- `POST /api/import/groups/{group_id}/sessions`
- `POST /api/import/sessions/{session_id}/approve`
- `GET /api/reports/dashboard`
- `GET /api/reports/groups/{group_id}/balances`

