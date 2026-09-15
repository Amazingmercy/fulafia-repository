import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadResult } from '../storage/storage.interface';
import { PlagiarismService } from '../plagiarism/plagiarism.service';
import { AuditService } from '../audit/audit.service';
import { DocumentType, SubmissionStatus, UserRole, TurnitinScopeConfig } from '@fulafia/shared';
import * as crypto from 'crypto';
type MulterFile = Express.Multer.File;

export interface CreateSubmissionOptions {
  title: string;
  abstract: string;
  keywords: string[];
  documentType: DocumentType;
  year: number;
  degreeProgramme: string;
  supervisorId?: string;
  departmentId: string;
  embargoReleaseDate?: string;
  scopes?: TurnitinScopeConfig;
}

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly plagiarismService: PlagiarismService,
    private readonly auditService: AuditService,
  ) {}

  private generateStableIdentifier(docType: DocumentType, year: number): string {
    const typeMap: Record<DocumentType, string> = {
      THESIS: 'TH',
      DISSERTATION: 'DS',
      JOURNAL_ARTICLE: 'JA',
      CONFERENCE_PAPER: 'CP',
      TECHNICAL_REPORT: 'TR',
      DATASET: 'DT',
    };
    const code = typeMap[docType] || 'WORK';
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `FULAFIA-${year}-${code}-${rand}`;
  }

  async createSubmission(
    authorId: string,
    options: CreateSubmissionOptions,
    file?: MulterFile,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const stableIdentifier = this.generateStableIdentifier(options.documentType, options.year);

    const submission = await this.prisma.submission.create({
      data: {
        stableIdentifier,
        title: options.title,
        abstract: options.abstract,
        keywords: options.keywords,
        documentType: options.documentType,
        year: options.year,
        degreeProgramme: options.degreeProgramme,
        status: SubmissionStatus.SUBMITTED,
        versionNumber: 1,
        embargoReleaseDate: options.embargoReleaseDate ? new Date(options.embargoReleaseDate) : null,
        authorId,
        supervisorId: options.supervisorId || null,
        departmentId: options.departmentId,
        doi: `10.5281/fulafia.${stableIdentifier.toLowerCase()}`,
        handleId: `123456789/${stableIdentifier.toLowerCase()}`,
      },
    });

    let uploadedFile: any = null;
    let sha256Hash = 'NO_FILE';

    if (file) {
      const uploadResult = await this.storageService.uploadFile({
        filename: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });
      sha256Hash = uploadResult.sha256Checksum;

      const version = await this.prisma.submissionVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          title: options.title,
          abstract: options.abstract,
          fullTextContent: `${options.title}\n\n${options.abstract}`,
          sha256Hash,
        },
      });

      uploadedFile = await this.prisma.submissionFile.create({
        data: {
          submissionVersionId: version.id,
          storageKey: uploadResult.storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          magicBytesVerified: uploadResult.magicBytesVerified,
          sizeBytes: BigInt(uploadResult.sizeBytes),
          sha256Checksum: uploadResult.sha256Checksum,
          storageProvider: uploadResult.storageProvider,
        },
      });

      // Trigger Dual-layer Plagiarism Pipeline
      await this.plagiarismService.triggerDualPlagiarismCheck(version.id, options.scopes);
    } else {
      await this.prisma.submissionVersion.create({
        data: {
          submissionId: submission.id,
          versionNumber: 1,
          title: options.title,
          abstract: options.abstract,
          fullTextContent: `${options.title}\n\n${options.abstract}`,
          sha256Hash,
        },
      });
    }

    await this.auditService.log({
      actorId: authorId,
      action: 'SUBMISSION_CREATED',
      targetEntity: 'Submission',
      targetId: submission.id,
      metadata: { stableIdentifier, title: options.title, fileUploaded: !!file },
      ipAddress,
      userAgent,
    });

    return this.findSubmissionById(submission.id);
  }

  async createNewVersion(
    submissionId: string,
    authorId: string,
    title: string,
    abstract: string,
    file?: MulterFile,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.authorId !== authorId) {
      throw new ForbiddenException('Only the author can upload a new version');
    }

    const nextVersionNumber = submission.versionNumber + 1;

    let sha256Hash = 'NO_FILE';
    let uploadResult: UploadResult | null = null;

    if (file) {
      uploadResult = await this.storageService.uploadFile({
        filename: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });
      sha256Hash = uploadResult.sha256Checksum;
    }

    const version = await this.prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNumber: nextVersionNumber,
        title,
        abstract,
        fullTextContent: `${title}\n\n${abstract}`,
        sha256Hash,
      },
    });

    if (file && uploadResult) {
      await this.prisma.submissionFile.create({
        data: {
          submissionVersionId: version.id,
          storageKey: uploadResult.storageKey,
          originalName: file.originalname,
          mimeType: file.mimetype,
          magicBytesVerified: uploadResult.magicBytesVerified,
          sizeBytes: BigInt(uploadResult.sizeBytes),
          sha256Checksum: uploadResult.sha256Checksum,
          storageProvider: uploadResult.storageProvider,
        },
      });

      await this.plagiarismService.triggerDualPlagiarismCheck(version.id);
    }

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        title,
        abstract,
        versionNumber: nextVersionNumber,
        status: SubmissionStatus.SUBMITTED,
      },
    });

    await this.auditService.log({
      actorId: authorId,
      action: 'SUBMISSION_VERSION_ADDED',
      targetEntity: 'SubmissionVersion',
      targetId: version.id,
      metadata: { versionNumber: nextVersionNumber },
      ipAddress,
      userAgent,
    });

    return this.findSubmissionById(submissionId);
  }

  async findSubmissionById(id: string, currentUser?: any) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true, faculty: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            file: true,
            externalReport: true,
            internalReport: true,
          },
        },
        reviewLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('Submission record not found');

    const isEmbargoed = submission.embargoReleaseDate
      ? new Date(submission.embargoReleaseDate) > new Date()
      : false;

    // Permissions check for full text access
    const isOwnerOrStaff =
      currentUser &&
      (currentUser.id === submission.authorId ||
        currentUser.id === submission.supervisorId ||
        currentUser.role === UserRole.REVIEWER ||
        currentUser.role === UserRole.ADMIN);

    const latestVer = submission.versions[0];
    const dualPlagiarism = latestVer ? {
      versionId: latestVer.id,
      versionNumber: latestVer.versionNumber,
      externalReport: latestVer.externalReport,
      internalReport: latestVer.internalReport,
      requiresManualReview: (latestVer.externalReport?.overallSimilarityPercentage || 0) > 20 ||
                            (latestVer.internalReport?.overallSimilarityPercentage || 0) > 15,
    } : undefined;

    return {
      id: submission.id,
      stableIdentifier: submission.stableIdentifier,
      title: submission.title,
      abstract: submission.abstract,
      keywords: submission.keywords,
      documentType: submission.documentType,
      year: submission.year,
      degreeProgramme: submission.degreeProgramme,
      status: submission.status,
      versionNumber: submission.versionNumber,
      embargoReleaseDate: submission.embargoReleaseDate ? submission.embargoReleaseDate.toISOString() : undefined,
      isEmbargoed,
      canAccessFile: !isEmbargoed || isOwnerOrStaff,
      authorId: submission.authorId,
      authorName: `${submission.author.firstName} ${submission.author.lastName}`,
      supervisorId: submission.supervisorId,
      supervisorName: submission.supervisor ? `${submission.supervisor.firstName} ${submission.supervisor.lastName}` : undefined,
      departmentId: submission.departmentId,
      departmentName: submission.department.name,
      doi: submission.doi,
      handleId: submission.handleId,
      versions: submission.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        title: v.title,
        abstract: v.abstract,
        sha256Hash: v.sha256Hash,
        file: v.file ? {
          id: v.file.id,
          originalName: v.file.originalName,
          mimeType: v.file.mimeType,
          sizeBytes: Number(v.file.sizeBytes),
          sha256Checksum: v.file.sha256Checksum,
          isVirusesClean: v.file.isVirusesClean,
          storageProvider: v.file.storageProvider,
          createdAt: v.file.createdAt.toISOString(),
        } : undefined,
        externalReport: v.externalReport,
        internalReport: v.internalReport,
        createdAt: v.createdAt.toISOString(),
      })),
      latestDualPlagiarism: dualPlagiarism,
      reviewLogs: submission.reviewLogs.map((r) => ({
        id: r.id,
        submissionId: r.submissionId,
        reviewerId: r.reviewerId,
        reviewerName: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
        action: r.action,
        comments: r.comments,
        createdAt: r.createdAt.toISOString(),
      })),
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
    };
  }

  async getFileBuffer(submissionId: string, currentUser?: any) {
    const sub = await this.findSubmissionById(submissionId, currentUser);
    if (!sub.canAccessFile) {
      throw new ForbiddenException('This work is currently under academic embargo and restricted to authorized personnel.');
    }

    const latestVer = sub.versions[0];
    if (!latestVer || !latestVer.file) {
      throw new NotFoundException('No file attached to this submission');
    }

    const fileBuffer = await this.storageService.getFileStream(
      latestVer.file.id, // storage key stored in file table
      latestVer.file.storageProvider as any,
    );

    return {
      file: latestVer.file,
      buffer: fileBuffer,
    };
  }

  async findByAuthor(userId: string) {
    return this.prisma.submission.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: { versionNumber: true, sha256Hash: true, createdAt: true },
        },
        reviewLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            action: true,
            comments: true,
            createdAt: true,
            reviewer: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });
  }

  async exportSignedManifest(submissionId: string) {
    const sub = await this.findSubmissionById(submissionId);
    const manifest = {
      institution: 'Federal University of Lafia (FULafia)',
      repository: 'FULafia Institutional Repository',
      identifier: sub.stableIdentifier,
      title: sub.title,
      author: sub.authorName,
      department: sub.departmentName,
      degree: sub.degreeProgramme,
      year: sub.year,
      documentType: sub.documentType,
      doi: sub.doi,
      handle: sub.handleId,
      status: sub.status,
      versionsCount: sub.versions?.length || 1,
      latestVersionHash: sub.versions?.[0]?.sha256Hash,
      plagiarismVerification: {
        externalSimilarity: sub.latestDualPlagiarism?.externalReport?.overallSimilarityPercentage,
        internalSimilarity: sub.latestDualPlagiarism?.internalReport?.overallSimilarityPercentage,
        status: sub.latestDualPlagiarism?.requiresManualReview ? 'MANUAL_REVIEW_FLAGGED' : 'PASSED',
      },
      exportedAt: new Date().toISOString(),
      digitalSignature: crypto.createHash('sha256').update(`${sub.id}:${sub.stableIdentifier}:${sub.updatedAt}`).digest('hex'),
    };

    return manifest;
  }
}
