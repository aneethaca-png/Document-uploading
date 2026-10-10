# CLAUDE.md - DocuLex Project Rules

> Project-specific rules for Claude Code. This file is read automatically.

---

## Project Overview

**Project Name:** DocuLex
**Description:** Legal document automation platform — create and manage reusable document templates with `{{placeholder}}` variable support, and upload base legal documents.
**Target User:** Legal professionals (lawyers, paralegals, legal teams)

**Tech Stack:**
- Backend: FastAPI + Python 3.11+
- Frontend: React + Vite + TypeScript
- Database: PostgreSQL + SQLAlchemy
- Auth: Google OAuth 2.0 (no passwords)
- UI: Chakra UI

---

## Project Structure

```
doculex/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── template.py
│   │   │   ├── template_category.py
│   │   │   └── uploaded_file.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── template.py
│   │   │   └── uploaded_file.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── templates.py
│   │   │   └── files.py
│   │   ├── services/
│   │   │   ├── template_service.py
│   │   │   ├── file_service.py
│   │   │   └── variable_extractor.py
│   │   └── auth/
│   │       ├── google_oauth.py
│   │       └── jwt_handler.py
│   ├── alembic/
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_templates.py
│   │   └── test_files.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TemplateCard.tsx
│       │   ├── VariableList.tsx
│       │   └── FileUploader.tsx
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Templates.tsx
│       │   ├── TemplateDetail.tsx
│       │   ├── TemplateEdit.tsx
│       │   ├── Files.tsx
│       │   ├── Profile.tsx
│       │   └── Settings.tsx
│       ├── hooks/
│       ├── services/
│       │   ├── api.ts
│       │   ├── templateService.ts
│       │   └── fileService.ts
│       ├── context/
│       │   └── AuthContext.tsx
│       └── types/
│           ├── template.ts
│           └── file.ts
├── skills/
├── agents/
├── PRPs/
└── .claude/commands/
```

---

## Code Standards

### Python (Backend)
```python
# ALWAYS use type hints
def get_template(db: Session, template_id: UUID, user_id: UUID) -> Template:
    pass

# ALWAYS use async for route handlers
@router.get("/templates/{id}")
async def get_template(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TemplateResponse:
    pass

# ALWAYS scope queries to current user
def list_templates(db: Session, user_id: UUID) -> list[Template]:
    return db.query(Template).filter(Template.user_id == user_id).all()
```

### TypeScript (Frontend)
```typescript
// ALWAYS define interfaces — no any types
interface Template {
  id: string;
  title: string;
  category: TemplateCategory;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

// ALWAYS type async functions
const fetchTemplate = async (id: string): Promise<Template> => {
  const { data } = await api.get<Template>(`/templates/${id}`);
  return data;
};
```

---

## Forbidden Patterns

### Backend
- Never use `print()` — use `logging`
- Never hardcode secrets — use environment variables via `config.py`
- Never skip user ownership check on Template or UploadedFile queries
- Never allow file types other than `.pdf` and `.docx` in uploads
- Never skip Pydantic validation on request bodies
- Never expose internal file paths in API responses

### Frontend
- Never use `any` type
- Never leave `console.log` in production code
- Never use inline styles — use Chakra UI props or theme
- Never make API calls without error handling
- Never store JWT in localStorage — use httpOnly cookies

---

## Module-Specific Rules

### Templates Module
- All templates must have `user_id` — never create an ownerless template
- Ownership must be verified on every GET, PUT, DELETE (return 403 if mismatch)
- Placeholder extraction uses regex: `\{\{(\w+)\}\}` — deduplicate results
- Duplicate operation copies title, category, and body; sets `is_duplicate_of`

### File Uploads Module
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max file size: 10MB (enforce in backend, not just frontend)
- Files stored under `uploads/{user_id}/{uuid}_{original_filename}`
- Download endpoint must verify `file.user_id == current_user.id` before streaming

### Auth Module
- No password fields anywhere — this is OAuth-only
- Google OAuth state parameter must be validated on callback to prevent CSRF
- JWT stored as httpOnly cookie — never expose raw token in response body

---

## API Conventions

- All endpoints prefixed with `/api/v1/`
- Plural nouns for resources: `/templates`, `/files`
- HTTP status codes:
  - 200: Success (GET, PUT)
  - 201: Created (POST)
  - 204: No Content (DELETE)
  - 400: Bad Request (validation error)
  - 401: Unauthorized (not logged in)
  - 403: Forbidden (wrong owner)
  - 404: Not Found
  - 413: Payload Too Large (file size exceeded)
  - 415: Unsupported Media Type (wrong file type)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doculex

# Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# File storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d

# Tests
pytest backend/tests -v --cov=app

# Linting
ruff check backend/
cd frontend && npm run lint && npm run type-check
```

---

## Commit Message Format

```
feat(templates): add duplicate endpoint
fix(files): enforce ownership check on download
refactor(auth): extract JWT logic to jwt_handler
test(templates): add variable extraction tests
docs: update environment variable docs
```

---

## Skills Reference

| Task | Skill to Read |
|------|---------------|
| Database models | skills/DATABASE.md |
| API + Auth | skills/BACKEND.md |
| React + UI | skills/FRONTEND.md |
| Testing | skills/TESTING.md |
| Deployment | skills/DEPLOYMENT.md |

---

## Agent Coordination

| Agent | Role |
|-------|------|
| DATABASE-AGENT | User, Template, TemplateCategory, UploadedFile models + migrations |
| BACKEND-AGENT | Auth (Google OAuth), Templates API, Files API |
| FRONTEND-AGENT | Login, Dashboard, Templates pages, Files page |
| DEVOPS-AGENT | Docker, docker-compose, CI/CD |
| TEST-AGENT | Unit + integration tests for all modules |
| REVIEW-AGENT | Security audit (ownership checks, file validation, OAuth state) |

---

## Workflow

```
1. INITIAL.md is complete — defines DocuLex
2. /generate-prp INITIAL.md
3. /execute-prp PRPs/doculex-prp.md
```
