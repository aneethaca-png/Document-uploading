# INITIAL.md - DocuLex Product Definition

> Legal document automation platform that lets legal professionals create, manage, and fill document templates with placeholder variables.

---

## PRODUCT

### Name
DocuLex

### Description
DocuLex helps legal professionals create reusable document templates with placeholder variables (e.g. `{{client_name}}`, `{{hearing_date}}`), upload base legal documents, and manage their entire template library — saving hours of repetitive drafting work.

### Target User
Legal professionals — lawyers, paralegals, and legal teams at law firms or in-house legal departments.

### Type
- [x] SaaS (Software as a Service)

---

## TECH STACK

| Layer | Choice |
|-------|--------|
| Backend | FastAPI + Python 3.11+ |
| Frontend | React + Vite + TypeScript |
| Database | PostgreSQL + SQLAlchemy |
| Auth | Google OAuth only (no passwords) |
| UI | Chakra UI |
| Payments | None for MVP |

---

## MODULES

### Module 1: Authentication (Required)

**Description:** User authentication via Google OAuth 2.0. No passwords — users sign in with their Google account.

**Models:**
```
User:
  - id: UUID
  - email: str
  - full_name: str
  - avatar_url: str (nullable)
  - google_id: str (unique)
  - is_active: bool
  - created_at, updated_at: datetime
```

**Endpoints:**
- GET /auth/google — Redirect to Google OAuth
- GET /auth/google/callback — Handle OAuth callback, issue JWT
- POST /auth/logout — Revoke session
- GET /auth/me — Get current user profile
- PUT /auth/me — Update display name

**Pages:**
- /login — Google sign-in page
- /profile — User profile page (protected)

---

### Module 2: Document Templates

**Description:** Create and manage reusable legal document templates. Templates support placeholder variables using `{{variable_name}}` syntax. The API can extract all placeholders from a template body.

**Models:**
```
TemplateCategory:
  - id: int
  - name: str  (e.g. "Contracts", "Notices", "Pleadings", "Affidavits")

Template:
  - id: UUID
  - user_id: UUID (FK → User)
  - title: str
  - category_id: int (FK → TemplateCategory)
  - body: text  (with {{placeholder}} variables)
  - is_duplicate_of: UUID (nullable FK → Template)
  - created_at, updated_at: datetime
```

**Endpoints:**
```
GET    /templates           - List user's templates (paginated, filter by category)
POST   /templates           - Create a new template
GET    /templates/{id}      - Get a single template
PUT    /templates/{id}      - Update title, category, or body
DELETE /templates/{id}      - Delete a template (owned by current user)
POST   /templates/{id}/duplicate - Duplicate template (appends "(Copy)" to title)
GET    /templates/{id}/variables - Extract deduplicated list of {{placeholder}} names from body
GET    /templates/categories     - List all template categories
```

**Pages:**
```
/templates           - Template library (list, search, filter by category)
/templates/new       - Create new template
/templates/{id}      - View template detail with variable list
/templates/{id}/edit - Edit template
```

---

### Module 3: File Uploads

**Description:** Upload base legal documents (PDF, DOCX) as reference material or starting points for templates. Files are stored server-side and scoped to the authenticated user.

**Models:**
```
UploadedFile:
  - id: UUID
  - user_id: UUID (FK → User)
  - filename: str (original filename)
  - file_path: str (server storage path)
  - file_type: str  ("pdf" or "docx")
  - file_size_bytes: int
  - created_at: datetime
```

**Endpoints:**
```
POST   /files/upload        - Upload PDF or DOCX (multipart/form-data, max 10MB)
GET    /files               - List user's uploaded files
GET    /files/{id}          - Get file metadata
DELETE /files/{id}          - Delete an uploaded file
GET    /files/{id}/download - Download the original file (ownership check enforced)
```

**Pages:**
```
/files               - File library (list with filename, type, size, upload date)
```
Upload widget is also embedded in the template creation flow.

---

### Module 4: Dashboard

**Description:** Post-login landing page — overview of the user's template count, recent activity, and quick actions.

**Pages:**
```
/dashboard  - Overview: total templates, recent uploads, quick links to create/upload
/settings   - Account settings (display name, sign out)
```

---

## MVP SCOPE

### Must Have (MVP)
- [x] Google OAuth login and logout
- [x] Create, view, edit, delete document templates
- [x] Duplicate an existing template
- [x] Template categories (Contracts, Notices, Pleadings, Affidavits)
- [x] Placeholder variable extraction from template body
- [x] Upload base documents (PDF, DOCX, max 10MB)
- [x] List and download uploaded files
- [x] Dashboard overview page

### Nice to Have (Post-MVP)
- [ ] Document generation (fill placeholders with data, download result)
- [ ] Template sharing with team members / firm
- [ ] Version history for templates
- [ ] Rich text / WYSIWYG editor for template body
- [ ] Auto-extract `{{variables}}` from uploaded DOCX files
- [ ] Email notifications (welcome, activity digest)
- [ ] Admin panel (user management, platform stats)
- [ ] Stripe billing / subscription plans

---

## ACCEPTANCE CRITERIA

### Authentication
- [ ] User can sign in with Google (full OAuth 2.0 flow)
- [ ] User is redirected to /dashboard after successful login
- [ ] JWT access token issued and sent as httpOnly cookie
- [ ] Unauthenticated requests to protected routes return 401
- [ ] Protected frontend routes redirect to /login
- [ ] OAuth state parameter validated to prevent CSRF

### Document Templates
- [ ] User can create a template with title, category, and body text
- [ ] Body supports `{{placeholder}}` syntax without breaking
- [ ] GET /templates/{id}/variables returns deduplicated placeholder names
- [ ] User can update any field of their own template
- [ ] User can delete their own template
- [ ] Duplicate creates a new template with "(Copy)" appended to title
- [ ] Users cannot read or modify other users' templates (403 enforced)

### File Uploads
- [ ] User can upload PDF and DOCX files up to 10MB
- [ ] Non-PDF/DOCX files are rejected with a clear error
- [ ] Uploaded file appears in /files list immediately after upload
- [ ] User can download their own uploaded files
- [ ] Users cannot download files belonging to another user (403 enforced)

### Quality
- [ ] All API endpoints documented in OpenAPI (/docs)
- [ ] Backend test coverage ≥ 70%
- [ ] Frontend TypeScript strict mode passes with no errors
- [ ] Docker build completes without errors

---

## SPECIAL REQUIREMENTS

### Security
- [x] OAuth state parameter validated to prevent CSRF
- [x] All endpoints require authentication except /auth/google and /auth/google/callback
- [x] File downloads check user ownership before serving
- [x] Template CRUD enforces user_id scoping
- [x] Pydantic validation on all request bodies
- [x] File type validation on upload (reject non-PDF/DOCX)
- [x] File size limit: 10MB enforced server-side

### Storage
- [x] Local filesystem storage (uploads/ directory) for MVP
- [ ] Swap to AWS S3 or similar post-MVP

---

## AGENTS

> These agents will build DocuLex in parallel:

| Agent | Role | Works On |
|-------|------|----------|
| DATABASE-AGENT | Creates all models and migrations | User, Template, TemplateCategory, UploadedFile |
| BACKEND-AGENT | Builds API endpoints and services | Auth, Templates, Files modules |
| FRONTEND-AGENT | Creates UI pages and components | Login, Dashboard, Templates, Files pages |
| DEVOPS-AGENT | Sets up Docker, CI/CD, environments | Infrastructure |
| TEST-AGENT | Writes unit and integration tests | All code |
| REVIEW-AGENT | Security and code quality audit | All code |

---

# READY?

```bash
/generate-prp INITIAL.md
```

Then:

```bash
/execute-prp PRPs/doculex-prp.md
```
