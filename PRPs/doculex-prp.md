# PRP: DocuLex

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | DocuLex |
| **Type** | SaaS |
| **Version** | 1.0 |
| **Created** | 2026-10-10 |
| **Complexity** | Medium |

---

## PRODUCT OVERVIEW

**Description:** Legal document automation platform that lets lawyers, paralegals, and legal teams create reusable document templates with `{{placeholder}}` variable support, upload base legal documents, and manage their entire template library.

**Value Proposition:** Legal professionals waste hours on repetitive drafting. DocuLex lets them build a template once, extract every variable automatically, and reuse it forever — reducing draft time from hours to minutes.

**MVP Scope:**
- [x] Google OAuth login and logout
- [x] Create, view, edit, delete document templates
- [x] Duplicate an existing template
- [x] Template categories (Contracts, Notices, Pleadings, Affidavits)
- [x] Placeholder variable extraction (`{{variable_name}}` detection)
- [x] Upload base documents (PDF, DOCX, max 10MB)
- [x] List and download uploaded files
- [x] Dashboard overview page

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + TypeScript + Vite | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy | skills/DATABASE.md |
| Auth | Google OAuth 2.0 + JWT (httpOnly cookie) | skills/BACKEND.md |
| UI | Chakra UI | skills/FRONTEND.md |
| Testing | pytest + React Testing Library | skills/TESTING.md |
| Deployment | Docker + docker-compose | skills/DEPLOYMENT.md |

---

## DATABASE MODELS

### User
```
id:           UUID (PK, default uuid4)
email:        str (unique, indexed)
full_name:    str
avatar_url:   str (nullable)
google_id:    str (unique, indexed)
is_active:    bool (default True)
created_at:   datetime (server_default)
updated_at:   datetime (onupdate)
```
Relations: one-to-many → Template, UploadedFile

### TemplateCategory
```
id:    int (PK, autoincrement)
name:  str (unique)
       Seed data: "Contracts", "Notices", "Pleadings", "Affidavits"
```
Relations: one-to-many → Template

### Template
```
id:               UUID (PK, default uuid4)
user_id:          UUID (FK → users.id, ondelete CASCADE, indexed)
title:            str
category_id:      int (FK → template_categories.id)
body:             text
is_duplicate_of:  UUID (nullable FK → templates.id)
created_at:       datetime (server_default)
updated_at:       datetime (onupdate)
```
Relations: many-to-one → User, TemplateCategory

### UploadedFile
```
id:               UUID (PK, default uuid4)
user_id:          UUID (FK → users.id, ondelete CASCADE, indexed)
filename:         str (original filename shown to user)
file_path:        str (server-side path, never exposed in API)
file_type:        str ("pdf" or "docx")
file_size_bytes:  int
created_at:       datetime (server_default)
```
Relations: many-to-one → User

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/auth/google | Public | Redirect to Google OAuth consent screen |
| GET | /api/v1/auth/google/callback | Public | Handle callback, set JWT httpOnly cookie |
| POST | /api/v1/auth/logout | Required | Clear JWT cookie |
| GET | /api/v1/auth/me | Required | Get current user profile |
| PUT | /api/v1/auth/me | Required | Update display name |

**Implementation Notes:**
- Generate `state` param (uuid4) before redirect, store in session or signed cookie; validate on callback
- On callback: upsert User by `google_id`; issue JWT containing `user_id` and `email`
- JWT sent as `access_token` httpOnly, Secure, SameSite=Lax cookie
- `get_current_user` dependency reads cookie, verifies JWT, returns User or raises 401

**Frontend Pages:**

| Route | Page | Components |
|-------|------|------------|
| /login | LoginPage | GoogleSignInButton, DocuLexLogo |
| /profile | ProfilePage (protected) | Avatar, EditableDisplayName, SignOutButton |

---

### Module 2: Document Templates
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/v1/templates | Required | List user's templates (paginated, ?category_id=, ?search=) |
| POST | /api/v1/templates | Required | Create a new template |
| GET | /api/v1/templates/categories | Required | List all template categories |
| GET | /api/v1/templates/{id} | Required | Get single template (ownership enforced) |
| PUT | /api/v1/templates/{id} | Required | Update title, category, body (ownership enforced) |
| DELETE | /api/v1/templates/{id} | Required | Delete template (ownership enforced, returns 204) |
| POST | /api/v1/templates/{id}/duplicate | Required | Duplicate template; new title = original + " (Copy)" |
| GET | /api/v1/templates/{id}/variables | Required | Return deduplicated list of `{{variable}}` names from body |

**Variable Extraction Logic:**
```python
import re
def extract_variables(body: str) -> list[str]:
    matches = re.findall(r'\{\{(\w+)\}\}', body)
    return list(dict.fromkeys(matches))  # deduplicate, preserve order
```

**Pydantic Schemas:**
```python
class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category_id: int
    body: str = Field(..., min_length=1)

class TemplateUpdate(BaseModel):
    title: str | None = None
    category_id: int | None = None
    body: str | None = None

class TemplateResponse(BaseModel):
    id: UUID
    title: str
    category: CategoryResponse
    body: str
    is_duplicate_of: UUID | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

**Frontend Pages:**

| Route | Page | Key Components |
|-------|------|----------------|
| /templates | TemplatesPage | TemplateCard, CategoryFilter, SearchBar, EmptyState |
| /templates/new | NewTemplatePage | TemplateForm, PlaceholderHint |
| /templates/:id | TemplateDetailPage | TemplateBody, VariableList, ActionButtons |
| /templates/:id/edit | EditTemplatePage | TemplateForm (pre-filled) |

**Frontend Types:**
```typescript
interface TemplateCategory { id: number; name: string; }

interface Template {
  id: string;
  title: string;
  category: TemplateCategory;
  body: string;
  isDuplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateListResponse {
  items: Template[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

### Module 3: File Uploads
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

**Backend Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/v1/files/upload | Required | Upload PDF or DOCX (multipart, max 10MB) |
| GET | /api/v1/files | Required | List user's uploaded files |
| GET | /api/v1/files/{id} | Required | Get file metadata (ownership enforced) |
| DELETE | /api/v1/files/{id} | Required | Delete file and remove from disk (ownership enforced) |
| GET | /api/v1/files/{id}/download | Required | Stream file to client (ownership enforced) |

**Upload Validation:**
```python
ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Validate before saving
if file.content_type not in ALLOWED_CONTENT_TYPES:
    raise HTTPException(status_code=415, detail="Only PDF and DOCX files are accepted")
content = await file.read()
if len(content) > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File exceeds 10MB limit")
```

**Storage Path:** `uploads/{user_id}/{uuid4}_{sanitized_filename}`

**Pydantic Schemas:**
```python
class FileResponse(BaseModel):
    id: UUID
    filename: str
    file_type: str
    file_size_bytes: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    # file_path is NEVER included in responses
```

**Frontend Pages:**

| Route | Page | Key Components |
|-------|------|----------------|
| /files | FilesPage | FileCard, FileUploader, EmptyState |

**File Uploader Component:**
- Accepts drag-and-drop or click-to-browse
- Shows file type icon (PDF/DOCX), filename, size
- Displays upload progress bar
- Shows error message for rejected types or oversized files
- Embedded as a widget in /templates/new as well

**Frontend Types:**
```typescript
interface UploadedFile {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx';
  fileSizeBytes: number;
  createdAt: string;
}
```

---

### Module 4: Dashboard
**Agents:** FRONTEND-AGENT

**Backend Endpoints:** (uses existing endpoints — no new ones)
- GET /api/v1/templates?page=1&page_size=5 — recent templates
- GET /api/v1/files — recent uploads

**Frontend Pages:**

| Route | Page | Key Components |
|-------|------|----------------|
| /dashboard | DashboardPage | StatCard, RecentTemplates, RecentFiles, QuickActions |
| /settings | SettingsPage | DisplayNameForm, SignOutButton |

**Dashboard Stats:**
- Total templates count
- Total uploaded files count
- 5 most recently updated templates
- 5 most recently uploaded files
- Quick action buttons: "New Template", "Upload Document"

---

## PHASE EXECUTION PLAN

### Phase 1: Foundation (4 agents in parallel)

**DATABASE-AGENT tasks:**
- Create `backend/app/database.py` (SQLAlchemy engine, session, Base)
- Create all 4 models: `User`, `TemplateCategory`, `Template`, `UploadedFile`
- Create Alembic migration for all tables
- Create seed script for TemplateCategory (4 categories)

**BACKEND-AGENT tasks:**
- Scaffold `backend/` structure: `main.py`, `config.py`, `requirements.txt`
- Set up CORS, middleware, health check endpoint (`GET /health`)
- Create `uploads/` directory with `.gitkeep`

**FRONTEND-AGENT tasks:**
- Scaffold `frontend/` with Vite + React + TypeScript
- Install Chakra UI, React Router, axios
- Create folder structure: `pages/`, `components/`, `services/`, `hooks/`, `context/`, `types/`
- Create `AuthContext.tsx` and `ProtectedRoute.tsx` stubs

**DEVOPS-AGENT tasks:**
- Create `Dockerfile` for backend (Python 3.11-slim)
- Create `Dockerfile` for frontend (node:20-alpine, multi-stage)
- Create `docker-compose.yml` (backend + frontend + postgres)
- Create `.env.example` with all required variables

**Validation Gate 1:**
```bash
cd backend && pip install -r requirements.txt
alembic upgrade head
cd ../frontend && npm install
docker-compose config   # validates docker-compose.yml syntax
```

---

### Phase 2: Modules (backend + frontend in parallel per module)

**Auth Module:**

*BACKEND-AGENT:*
- `backend/app/auth/google_oauth.py` — OAuth URL builder, token exchange, user info fetch
- `backend/app/auth/jwt_handler.py` — create_token, verify_token, get_current_user dependency
- `backend/app/routers/auth.py` — all 5 auth endpoints
- `backend/app/schemas/user.py` — UserResponse, UserUpdate

*FRONTEND-AGENT:*
- `frontend/src/pages/Login.tsx` — centered card, Google sign-in button
- `frontend/src/pages/Profile.tsx` — avatar, display name edit, sign out
- `frontend/src/context/AuthContext.tsx` — user state, login/logout, useAuth hook
- `frontend/src/components/ProtectedRoute.tsx` — redirect to /login if unauthenticated

**Templates Module:**

*BACKEND-AGENT:*
- `backend/app/services/variable_extractor.py` — regex extraction function
- `backend/app/services/template_service.py` — CRUD + duplicate + variable extraction
- `backend/app/routers/templates.py` — all 8 endpoints
- `backend/app/schemas/template.py` — TemplateCreate, TemplateUpdate, TemplateResponse, CategoryResponse

*FRONTEND-AGENT:*
- `frontend/src/services/templateService.ts` — API calls for all template endpoints
- `frontend/src/types/template.ts` — Template, TemplateCategory, TemplateListResponse interfaces
- `frontend/src/pages/Templates.tsx` — list with search + filter
- `frontend/src/pages/NewTemplate.tsx` — creation form
- `frontend/src/pages/TemplateDetail.tsx` — detail view + variable list
- `frontend/src/pages/EditTemplate.tsx` — edit form
- `frontend/src/components/TemplateCard.tsx`
- `frontend/src/components/VariableList.tsx`

**Files Module:**

*BACKEND-AGENT:*
- `backend/app/services/file_service.py` — upload validation, save to disk, ownership checks
- `backend/app/routers/files.py` — all 5 endpoints
- `backend/app/schemas/uploaded_file.py` — FileResponse (no file_path)

*FRONTEND-AGENT:*
- `frontend/src/services/fileService.ts` — API calls for file endpoints
- `frontend/src/types/file.ts` — UploadedFile interface
- `frontend/src/pages/Files.tsx` — file library with upload widget
- `frontend/src/components/FileUploader.tsx` — drag-and-drop uploader with progress
- `frontend/src/components/FileCard.tsx`

**Dashboard Module:**

*FRONTEND-AGENT:*
- `frontend/src/pages/Dashboard.tsx` — stats + recent items + quick actions
- `frontend/src/pages/Settings.tsx` — display name + sign out
- `frontend/src/components/StatCard.tsx`

**Validation Gate 2:**
```bash
cd backend && ruff check app/ && python -m mypy app/ --ignore-missing-imports
cd frontend && npm run type-check && npm run lint
```

---

### Phase 3: Quality (3 agents in parallel)

**TEST-AGENT tasks:**
- `backend/tests/conftest.py` — test DB setup, auth fixtures, client fixture
- `backend/tests/test_auth.py` — OAuth flow (mocked), JWT validation, /me endpoints
- `backend/tests/test_templates.py` — CRUD, duplicate, variable extraction, ownership enforcement
- `backend/tests/test_files.py` — upload (valid/invalid types, size limit), list, download, ownership
- Target: ≥ 70% backend coverage

**REVIEW-AGENT tasks:**
- Verify all Template/UploadedFile endpoints enforce `user_id` ownership (no missing checks)
- Verify OAuth `state` param is generated, stored, and validated
- Verify `file_path` is never included in any API response schema
- Verify file type and size validation is server-side (not just client-side)
- Verify JWT cookie is httpOnly and Secure
- Check for any SQL injection vectors (parameterized queries via SQLAlchemy ORM)

**Final Validation:**
```bash
pytest backend/tests -v --cov=app --cov-fail-under=70
cd frontend && npm test -- --watchAll=false
docker-compose build
docker-compose up -d
curl http://localhost:8000/health
curl http://localhost:8000/docs  # OpenAPI available
```

---

## VALIDATION GATES SUMMARY

| Gate | Trigger | Commands |
|------|---------|----------|
| 1 — Foundation | After Phase 1 | `pip install`, `alembic upgrade head`, `npm install`, `docker-compose config` |
| 2 — Modules | After Phase 2 | `ruff check`, `mypy`, `npm run type-check`, `npm run lint` |
| 3 — Quality | After Phase 3 | `pytest --cov --cov-fail-under=70`, `npm test` |
| Final | End of all phases | `docker-compose up -d`, health check, `/docs` reachable |

---

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=postgresql://doculex_user:doculex_pass@localhost:5432/doculex

# Auth
SECRET_KEY=change-this-to-a-random-64-char-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## AGENT DISPATCH SUMMARY

### Phase 1 — Parallel

```yaml
TO: DATABASE-AGENT
TASK: Create all SQLAlchemy models and Alembic migration
SKILL: skills/DATABASE.md
OUTPUTS:
  - backend/app/models/user.py
  - backend/app/models/template.py
  - backend/app/models/template_category.py
  - backend/app/models/uploaded_file.py
  - backend/app/database.py
  - alembic/versions/001_initial_schema.py
VALIDATION: alembic upgrade head
```

```yaml
TO: BACKEND-AGENT
TASK: Scaffold FastAPI project structure and health endpoint
SKILL: skills/BACKEND.md
OUTPUTS:
  - backend/app/main.py
  - backend/app/config.py
  - backend/requirements.txt
  - uploads/.gitkeep
VALIDATION: uvicorn app.main:app --host 0.0.0.0 --port 8000 (starts without error)
```

```yaml
TO: FRONTEND-AGENT
TASK: Scaffold React + Vite + TypeScript project with Chakra UI
SKILL: skills/FRONTEND.md
OUTPUTS:
  - frontend/ (full Vite scaffold)
  - frontend/src/context/AuthContext.tsx (stub)
  - frontend/src/components/ProtectedRoute.tsx (stub)
VALIDATION: npm install && npm run type-check
```

```yaml
TO: DEVOPS-AGENT
TASK: Docker + docker-compose setup for backend, frontend, and PostgreSQL
SKILL: skills/DEPLOYMENT.md
OUTPUTS:
  - backend/Dockerfile
  - frontend/Dockerfile
  - docker-compose.yml
  - .env.example
VALIDATION: docker-compose config
```

### Phase 2 — Modules (run auth first, then templates + files + dashboard in parallel)

```yaml
TO: BACKEND-AGENT
TASK: Build Google OAuth + JWT authentication endpoints
SKILL: skills/BACKEND.md
INPUTS: User model from DATABASE-AGENT
OUTPUTS:
  - backend/app/auth/google_oauth.py
  - backend/app/auth/jwt_handler.py
  - backend/app/routers/auth.py
  - backend/app/schemas/user.py
VALIDATION: ruff check app/routers/auth.py
```

```yaml
TO: BACKEND-AGENT
TASK: Build Template CRUD + variable extraction endpoints
SKILL: skills/BACKEND.md
INPUTS: Template, TemplateCategory models; jwt_handler.py (get_current_user)
OUTPUTS:
  - backend/app/services/variable_extractor.py
  - backend/app/services/template_service.py
  - backend/app/routers/templates.py
  - backend/app/schemas/template.py
VALIDATION: ruff check app/routers/templates.py
```

```yaml
TO: BACKEND-AGENT
TASK: Build File Upload endpoints with ownership enforcement
SKILL: skills/BACKEND.md
INPUTS: UploadedFile model; jwt_handler.py (get_current_user)
OUTPUTS:
  - backend/app/services/file_service.py
  - backend/app/routers/files.py
  - backend/app/schemas/uploaded_file.py
VALIDATION: ruff check app/routers/files.py
```

```yaml
TO: FRONTEND-AGENT
TASK: Build all frontend pages and components (Login, Dashboard, Templates, Files)
SKILL: skills/FRONTEND.md
INPUTS: All backend endpoints defined above
OUTPUTS:
  - All pages in frontend/src/pages/
  - All components in frontend/src/components/
  - All services in frontend/src/services/
  - All types in frontend/src/types/
VALIDATION: npm run type-check && npm run lint
```

### Phase 3 — Parallel

```yaml
TO: TEST-AGENT
TASK: Write pytest tests for Auth, Templates, Files modules
SKILL: skills/TESTING.md
TARGET_COVERAGE: 70%
OUTPUTS:
  - backend/tests/conftest.py
  - backend/tests/test_auth.py
  - backend/tests/test_templates.py
  - backend/tests/test_files.py
VALIDATION: pytest --cov=app --cov-fail-under=70
```

```yaml
TO: REVIEW-AGENT
TASK: Security audit focused on ownership checks, OAuth CSRF, file validation
REVIEW_POINTS:
  - All Template/File endpoints enforce user_id ownership
  - OAuth state param generated and validated
  - file_path never in API responses
  - File type/size enforced server-side
  - JWT cookie is httpOnly + Secure
```

---

## NEXT STEP

```bash
/execute-prp PRPs/doculex-prp.md
```
