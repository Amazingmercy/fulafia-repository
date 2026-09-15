export const UserRole = {
  STUDENT: 'STUDENT',
  SUPERVISOR: 'SUPERVISOR',
  REVIEWER: 'REVIEWER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const DocumentType = {
  THESIS: 'THESIS',
  DISSERTATION: 'DISSERTATION',
  JOURNAL_ARTICLE: 'JOURNAL_ARTICLE',
  CONFERENCE_PAPER: 'CONFERENCE_PAPER',
  TECHNICAL_REPORT: 'TECHNICAL_REPORT',
  DATASET: 'DATASET',
} as const;
export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  SUPERVISOR_APPROVED: 'SUPERVISOR_APPROVED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
} as const;
export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus];

export const PlagiarismReportStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type PlagiarismReportStatus = typeof PlagiarismReportStatus[keyof typeof PlagiarismReportStatus];

export const ReviewAction = {
  ENDORSED: 'ENDORSED',
  APPROVED: 'APPROVED',
  REQUESTED_CHANGES: 'REQUESTED_CHANGES',
  REJECTED: 'REJECTED',
} as const;
export type ReviewAction = typeof ReviewAction[keyof typeof ReviewAction];

export const StorageProviderType = {
  LOCAL: 'LOCAL',
  S3: 'S3',
  CLOUDINARY: 'CLOUDINARY',
} as const;
export type StorageProviderType = typeof StorageProviderType[keyof typeof StorageProviderType];

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  departmentName?: string;
  isMfaEnabled: boolean;
  createdAt: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

export interface TurnitinScopeConfig {
  compareStudentPapers: boolean;
  compareInstitutional: boolean;
  compareInternet: boolean;
  submitToRepo: boolean;
}

export interface MatchedSource {
  sourceId: string;
  title: string;
  publicationOrInstitution: string;
  similarityPercentage: number;
  matchedTextSnippet?: string;
}

export interface ExternalPlagiarismReportDto {
  id: string;
  submissionVersionId: string;
  provider: string;
  externalJobId?: string;
  status: PlagiarismReportStatus;
  overallSimilarityPercentage?: number;
  compareStudentPapers: boolean;
  compareInstitutional: boolean;
  compareInternet: boolean;
  submitToRepo: boolean;
  matchedSources?: MatchedSource[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface InternalMatchItem {
  matchedSubmissionId: string;
  matchedSubmissionTitle: string;
  matchedAuthorName: string;
  matchedDepartment: string;
  similarityScore: number;
  matchedSnippets: string[];
}

export interface InternalSimilarityReportDto {
  id: string;
  submissionVersionId: string;
  status: PlagiarismReportStatus;
  overallSimilarityPercentage?: number;
  topMatches?: InternalMatchItem[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DualPlagiarismSummaryDto {
  versionId: string;
  versionNumber: number;
  externalReport?: ExternalPlagiarismReportDto;
  internalReport?: InternalSimilarityReportDto;
  requiresManualReview: boolean;
}

export interface SubmissionFileDto {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  isVirusesClean: boolean;
  storageProvider: StorageProviderType;
  createdAt: string;
}

export interface SubmissionVersionDto {
  id: string;
  versionNumber: number;
  title: string;
  abstract: string;
  sha256Hash: string;
  file?: SubmissionFileDto;
  externalReport?: ExternalPlagiarismReportDto;
  internalReport?: InternalSimilarityReportDto;
  createdAt: string;
}

export interface SubmissionDto {
  id: string;
  stableIdentifier: string;
  title: string;
  abstract: string;
  keywords: string[];
  documentType: DocumentType;
  year: number;
  degreeProgramme: string;
  status: SubmissionStatus;
  versionNumber: number;
  embargoReleaseDate?: string;
  isEmbargoed?: boolean;
  canAccessFile?: boolean;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  supervisorId?: string;
  supervisorName?: string;
  departmentId: string;
  departmentName?: string;
  doi?: string;
  handleId?: string;
  versions?: SubmissionVersionDto[];
  latestFile?: SubmissionFileDto;
  latestDualPlagiarism?: DualPlagiarismSummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLogDto {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  comments: string;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetEntity: string;
  targetId: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
