# FULafia Institutional Repository — Security Architecture & Threat Controls

This document details the security posture, threat model, and OWASP ASVS compliance controls implemented in the **FULafia Institutional Repository**.

---

## 1. Threat Model & Implemented Controls

| Threat Category | Primary Risk | Implemented Technical Controls |
|---|---|---|
| **Authentication & Session Security** | Password cracking, token theft, token replay | • **Argon2id** password hashing (`memoryCost: 65536`, `timeCost: 3`).<br>• Short-lived JWT Access Tokens (15 min expiry).<br>• Server-side hashed Refresh Tokens with **automatic reuse detection** (revokes all user sessions if a compromised refresh token is reused). |
| **Access Control (RBAC)** | Privilege escalation, unauthorized access to embargoed works | • NestJS `@Roles()` + `RolesGuard` applied globally (default-deny).<br>• Service-level embargo enforcement (`embargoReleaseDate` verified on file streams regardless of direct URL requests). |
| **Data Integrity & Injection** | SQL Injection, XSS, Parameter Pollution | • **Prisma ORM** parameterized queries (zero string-concatenated SQL).<br>• NestJS global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` to strip unexpected DTO properties.<br>• Rich-text metadata sanitization via `DOMPurify` / `sanitize-html`. |
| **File Upload & Malware** | Malicious file execution, extension spoofing | • Magic-byte inspection (verifies PDF `%PDF`, DOCX `PK..`, PNG, JPEG headers directly from file buffers).<br>• Instant SHA-256 integrity hash calculation upon intake.<br>• Abstracted `StorageProvider` interface for secure S3 / Cloudinary / local storage. |
| **Plagiarism Bypass** | Self-plagiarism, cross-student paper reuse | • **Dual-Layer Originality Check**: Layer 1 (Turnitin Similarity API) + Layer 2 (In-house FULafia MinHash shingling engine).<br>• Independent job status tracking and side-by-side report display for reviewers. |
| **Auditability & Compliance** | Non-repudiation, administrative actions | • Immutable `AuditLog` table capturing actor, action, target entity, target ID, metadata, client IP address, and user-agent. |
| **Transport & Headers** | Man-in-the-middle, clickjacking, MIME sniffing | • **Helmet** security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).<br>• CORS locked strictly to explicit institutional origin domains. |

---

## 2. Plagiarism Dual-Layer Architecture

```
                       [ Uploaded Submission ]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [ Layer 1: Turnitin ]           [ Layer 2: In-House ]
   - External Publisher Corpus      - FULafia Internal Database
   - Scope Toggles (Opt-in)         - MinHash / Jaccard Shingling
   - Turnitin Similarity Report     - Self-hosted PostgreSQL
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                   [ Side-by-Side Review Dashboard ]
```

---

## 3. Persistent Identifiers & Signed Metadata Manifests

Every published record receives:
- Stable Identifier: `FULAFIA-YYYY-TYPECODE-HEX`
- Digital Object Identifier (DOI): `10.5281/fulafia.<identifier>`
- Handle System Handle: `123456789/<identifier>`
- Signed JSON Manifest Export with SHA-256 payload digest.
