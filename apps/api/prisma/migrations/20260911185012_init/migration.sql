-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'SUPERVISOR', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('THESIS', 'DISSERTATION', 'JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'TECHNICAL_REPORT', 'DATASET');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERVISOR_APPROVED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlagiarismReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('ENDORSED', 'APPROVED', 'REQUESTED_CHANGES', 'REJECTED');

-- CreateEnum
CREATE TYPE "StorageProviderType" AS ENUM ('LOCAL', 'S3', 'CLOUDINARY');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "departmentId" TEXT NOT NULL,
    "isMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "replacedByTokenId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "stableIdentifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "keywords" TEXT[],
    "documentType" "DocumentType" NOT NULL,
    "year" INTEGER NOT NULL,
    "degreeProgramme" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "embargoReleaseDate" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "departmentId" TEXT NOT NULL,
    "doi" TEXT,
    "handleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "fullTextContent" TEXT,
    "sha256Hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionVersionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "magicBytesVerified" BOOLEAN NOT NULL DEFAULT false,
    "sizeBytes" BIGINT NOT NULL,
    "sha256Checksum" TEXT NOT NULL,
    "isVirusesClean" BOOLEAN NOT NULL DEFAULT true,
    "storageProvider" "StorageProviderType" NOT NULL DEFAULT 'LOCAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalPlagiarismReport" (
    "id" TEXT NOT NULL,
    "submissionVersionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'TURNITIN',
    "externalJobId" TEXT,
    "status" "PlagiarismReportStatus" NOT NULL DEFAULT 'PENDING',
    "overallSimilarityPercentage" DOUBLE PRECISION,
    "compareStudentPapers" BOOLEAN NOT NULL DEFAULT true,
    "compareInstitutional" BOOLEAN NOT NULL DEFAULT true,
    "compareInternet" BOOLEAN NOT NULL DEFAULT true,
    "submitToRepo" BOOLEAN NOT NULL DEFAULT true,
    "matchedSources" JSONB,
    "rawResponse" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalPlagiarismReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalSimilarityReport" (
    "id" TEXT NOT NULL,
    "submissionVersionId" TEXT NOT NULL,
    "status" "PlagiarismReportStatus" NOT NULL DEFAULT 'PENDING',
    "overallSimilarityPercentage" DOUBLE PRECISION,
    "topMatches" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InternalSimilarityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_stableIdentifier_key" ON "Submission"("stableIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_doi_key" ON "Submission"("doi");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_handleId_key" ON "Submission"("handleId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_documentType_idx" ON "Submission"("documentType");

-- CreateIndex
CREATE INDEX "Submission_departmentId_idx" ON "Submission"("departmentId");

-- CreateIndex
CREATE INDEX "Submission_authorId_idx" ON "Submission"("authorId");

-- CreateIndex
CREATE INDEX "Submission_supervisorId_idx" ON "Submission"("supervisorId");

-- CreateIndex
CREATE INDEX "Submission_year_idx" ON "Submission"("year");

-- CreateIndex
CREATE INDEX "SubmissionVersion_submissionId_idx" ON "SubmissionVersion"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionVersion_submissionId_versionNumber_key" ON "SubmissionVersion"("submissionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionFile_submissionVersionId_key" ON "SubmissionFile"("submissionVersionId");

-- CreateIndex
CREATE INDEX "SubmissionFile_submissionVersionId_idx" ON "SubmissionFile"("submissionVersionId");

-- CreateIndex
CREATE INDEX "SubmissionFile_sha256Checksum_idx" ON "SubmissionFile"("sha256Checksum");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalPlagiarismReport_submissionVersionId_key" ON "ExternalPlagiarismReport"("submissionVersionId");

-- CreateIndex
CREATE INDEX "ExternalPlagiarismReport_submissionVersionId_idx" ON "ExternalPlagiarismReport"("submissionVersionId");

-- CreateIndex
CREATE INDEX "ExternalPlagiarismReport_status_idx" ON "ExternalPlagiarismReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InternalSimilarityReport_submissionVersionId_key" ON "InternalSimilarityReport"("submissionVersionId");

-- CreateIndex
CREATE INDEX "InternalSimilarityReport_submissionVersionId_idx" ON "InternalSimilarityReport"("submissionVersionId");

-- CreateIndex
CREATE INDEX "InternalSimilarityReport_status_idx" ON "InternalSimilarityReport"("status");

-- CreateIndex
CREATE INDEX "ReviewLog_submissionId_idx" ON "ReviewLog"("submissionId");

-- CreateIndex
CREATE INDEX "ReviewLog_reviewerId_idx" ON "ReviewLog"("reviewerId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetEntity_targetId_idx" ON "AuditLog"("targetEntity", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalPlagiarismReport" ADD CONSTRAINT "ExternalPlagiarismReport_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalSimilarityReport" ADD CONSTRAINT "InternalSimilarityReport_submissionVersionId_fkey" FOREIGN KEY ("submissionVersionId") REFERENCES "SubmissionVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
