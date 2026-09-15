import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TurnitinProvider } from './providers/turnitin.provider';
import { InternalSimilarityService } from './providers/internal-similarity.service';
import { PlagiarismReportStatus, TurnitinScopeConfig } from '@fulafia/shared';

@Injectable()
export class PlagiarismService {
  private readonly logger = new Logger(PlagiarismService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly turnitinProvider: TurnitinProvider,
    private readonly internalSimilarityService: InternalSimilarityService,
  ) {}

  async triggerDualPlagiarismCheck(
    submissionVersionId: string,
    scopes: TurnitinScopeConfig = {
      compareStudentPapers: true,
      compareInstitutional: true,
      compareInternet: true,
      submitToRepo: true,
    },
  ) {
    const version = await this.prisma.submissionVersion.findUnique({
      where: { id: submissionVersionId },
      include: {
        submission: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Submission version not found');
    }

    const authorName = `${version.submission.author.firstName} ${version.submission.author.lastName}`;
    const fullText = version.fullTextContent || version.abstract || version.title;

    // 1. Initialize or reset External (Turnitin) Report record
    await this.prisma.externalPlagiarismReport.upsert({
      where: { submissionVersionId },
      create: {
        submissionVersionId,
        provider: this.turnitinProvider.providerName,
        status: PlagiarismReportStatus.PENDING,
        compareStudentPapers: scopes.compareStudentPapers,
        compareInstitutional: scopes.compareInstitutional,
        compareInternet: scopes.compareInternet,
        submitToRepo: scopes.submitToRepo,
      },
      update: {
        status: PlagiarismReportStatus.PENDING,
        errorMessage: null,
        compareStudentPapers: scopes.compareStudentPapers,
        compareInstitutional: scopes.compareInstitutional,
        compareInternet: scopes.compareInternet,
        submitToRepo: scopes.submitToRepo,
      },
    });

    // 2. Initialize or reset Internal Report record
    await this.prisma.internalSimilarityReport.upsert({
      where: { submissionVersionId },
      create: {
        submissionVersionId,
        status: PlagiarismReportStatus.PENDING,
      },
      update: {
        status: PlagiarismReportStatus.PENDING,
        errorMessage: null,
      },
    });

    // Run both independent checks concurrently via Promise.allSettled
    this.runAsyncChecks(submissionVersionId, version.submissionId, version.title, fullText, authorName, version.submission.departmentId, scopes);

    return {
      message: 'Dual-layer plagiarism checks initiated in background',
      submissionVersionId,
    };
  }

  private async runAsyncChecks(
    versionId: string,
    submissionId: string,
    title: string,
    fullText: string,
    authorName: string,
    departmentId: string,
    scopes: TurnitinScopeConfig,
  ) {
    // Check 1: External Turnitin Check
    const externalTask = (async () => {
      try {
        const result = await this.turnitinProvider.submitCheck({
          submissionVersionId: versionId,
          documentTitle: title,
          fullText,
          authorName,
          scopes,
        });

        await this.prisma.externalPlagiarismReport.update({
          where: { submissionVersionId: versionId },
          data: {
            externalJobId: result.externalJobId,
            status: PlagiarismReportStatus.COMPLETED,
            overallSimilarityPercentage: result.overallSimilarityPercentage,
            matchedSources: result.matchedSources as any,
            rawResponse: result.rawResponse as any,
            completedAt: new Date(),
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err) ;
        this.logger.error(`Layer 1 External check failed for ${versionId}: ${errorMessage}`);
        await this.prisma.externalPlagiarismReport.update({
          where: { submissionVersionId: versionId },
          data: {
            status: PlagiarismReportStatus.FAILED,
            errorMessage,
          },
        });
      }
    })();

    // Check 2: Internal FULafia Similarity Check
    const internalTask = (async () => {
      try {
        const result = await this.internalSimilarityService.checkSimilarity({
          submissionVersionId: versionId,
          submissionId,
          fullText,
          departmentId,
        });

        await this.prisma.internalSimilarityReport.update({
          where: { submissionVersionId: versionId },
          data: {
            status: PlagiarismReportStatus.COMPLETED,
            overallSimilarityPercentage: result.overallSimilarityPercentage,
            topMatches: result.topMatches as any,
            completedAt: new Date(),
          },
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(`Layer 2 Internal check failed for ${versionId}: ${errorMessage}`);
        await this.prisma.internalSimilarityReport.update({
          where: { submissionVersionId: versionId },
          data: {
            status: PlagiarismReportStatus.FAILED,
            errorMessage,
          },
        });
      }
    })();

    await Promise.allSettled([externalTask, internalTask]);
  }

  async getDualReport(submissionVersionId: string) {
    const external = await this.prisma.externalPlagiarismReport.findUnique({
      where: { submissionVersionId },
    });
    const internal = await this.prisma.internalSimilarityReport.findUnique({
      where: { submissionVersionId },
    });

    const version = await this.prisma.submissionVersion.findUnique({
      where: { id: submissionVersionId },
      select: { id: true, versionNumber: true },
    });

    if (!version) throw new NotFoundException('Version not found');

    const extScore = external?.overallSimilarityPercentage || 0;
    const intScore = internal?.overallSimilarityPercentage || 0;
    // Flag for manual review if external > 20% or internal > 15%
    const requiresManualReview = extScore > 20 || intScore > 15;

    return {
      versionId: version.id,
      versionNumber: version.versionNumber,
      externalReport: external,
      internalReport: internal,
      requiresManualReview,
    };
  }
}
