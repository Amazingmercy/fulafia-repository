# FULafia Institutional Repository

The **FULafia Institutional Repository** is a secure, institutional-grade repository designed for the Federal University of Lafia (FULafia), Nigeria. Built with NestJS, Prisma ORM, PostgreSQL, and React, it enables university researchers, students, supervisors, and librarians to submit, verify, review, and discover scholarly output.

---

## Technical Stack

- **Monorepo Architecture**: npm Workspaces (`apps/api`, `apps/web`, `packages/shared`)
- **Backend**: NestJS (TypeScript), Prisma ORM, PostgreSQL (`tsvector` FTS & `pgvector` / MinHash internal similarity)
- **Frontend**: React (TypeScript), React Query, CSS Design Tokens (Luxor Gold `#9D7A26`, White `#FFFFFF`, Shark `#1F2124`, **Zero Gradients**)
- **Authentication**: Argon2id password hashing, short-lived JWT Access Tokens, rotated server-side Refresh Tokens, `@Roles()` RBAC Guards
- **File Storage**: Object storage abstraction (`StorageProvider` supporting Local Disk, S3, Cloudinary)
- **Plagiarism Verification**: Dual-layer parallel pipeline (Layer 1: Turnitin Similarity API + Layer 2: In-house FULafia repository similarity search)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build All Monorepo Packages
```bash
npm run build
```

### 3. Setup Database & Seed Test Users
Configure `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fulafia_repo?schema=public"
JWT_SECRET="fulafia-repo-super-secret-jwt-key-2026"
STORAGE_PROVIDER="LOCAL"
```

Generate Prisma client & run database seed:
```bash
npm run prisma:generate
npm run prisma:seed
```

### 4. Start Development Servers
- Backend API (Port 4000):
  ```bash
  npm run start:api
  ```
- Frontend Web (Port 3000):
  ```bash
  npm run dev:web
  ```

---

## Pre-seeded Credentials for Testing

| Role | Email | Default Password |
|---|---|---|
| **Admin** | `admin@fulafia.edu.ng` | `FULafiaRepo2026!` |
| **Supervisor** | `prof.adewale@fulafia.edu.ng` | `FULafiaRepo2026!` |
| **Reviewer / Librarian** | `librarian@fulafia.edu.ng` | `FULafiaRepo2026!` |
| **Student / Author** | `student.chidi@fulafia.edu.ng` | `FULafiaRepo2026!` |

---

## OpenAPI Documentation

Interactive Swagger API docs are served at:
`http://localhost:4000/api/docs`


# Docker (quickest)
docker run -d --name fulafia-db -e POSTGRES_USER=fulafia_user -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=fulafia_repo -p 5432:5432 postgres:16-alpine

# Then from fulafia_repo root:
npx prisma migrate dev --name init --schema=apps/api/prisma/schema.prisma
npm run prisma:seed   # seeds all 80 departments + 4 test users

npx prisma studio --schema=apps/api/prisma/schema.prisma