import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReviewAction, SubmissionStatus, UserRole } from '@fulafia/shared';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getReviewQueue(user: any) {
    const where: any = {};

    if (user.role === UserRole.SUPERVISOR) {
      // Supervisors see works assigned to them or in their department that are SUBMITTED
      where.OR = [
        { supervisorId: user.id, status: SubmissionStatus.SUBMITTED },
        { departmentId: user.departmentId, status: SubmissionStatus.SUBMITTED },
      ];
    } else if (user.role === UserRole.REVIEWER || user.role === UserRole.ADMIN) {
      // Reviewers / Librarians see works that are SUPERVISOR_APPROVED or UNDER_REVIEW
      where.status = {
        in: [SubmissionStatus.SUBMITTED, SubmissionStatus.SUPERVISOR_APPROVED, SubmissionStatus.UNDER_REVIEW],
      };
    } else {
      throw new ForbiddenException('Access denied to review queue');
    }

    const items = await this.prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
        versions: {
          take: 1,
          orderBy: { versionNumber: 'desc' },
          include: {
            externalReport: true,
            internalReport: true,
            file: true,
          },
        },
      },
    });

    return items.map((sub) => {
      const latestVer = sub.versions[0];
      return {
        id: sub.id,
        stableIdentifier: sub.stableIdentifier,
        title: sub.title,
        abstract: sub.abstract,
        documentType: sub.documentType,
        year: sub.year,
        degreeProgramme: sub.degreeProgramme,
        status: sub.status,
        authorName: `${sub.author.firstName} ${sub.author.lastName}`,
        authorEmail: sub.author.email,
        supervisorName: sub.supervisor ? `${sub.supervisor.firstName} ${sub.supervisor.lastName}` : undefined,
        departmentName: sub.department.name,
        latestDualPlagiarism: latestVer ? {
          versionId: latestVer.id,
          versionNumber: latestVer.versionNumber,
          externalReport: latestVer.externalReport,
          internalReport: latestVer.internalReport,
          requiresManualReview:
            (latestVer.externalReport?.overallSimilarityPercentage || 0) > 20 ||
            (latestVer.internalReport?.overallSimilarityPercentage || 0) > 15,
        } : undefined,
        createdAt: sub.createdAt.toISOString(),
      };
    });
  }

  async processReview(
    submissionId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    action: ReviewAction,
    comments: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    let nextStatus: SubmissionStatus;

    if (action === ReviewAction.ENDORSED) {
      if (reviewerRole !== UserRole.SUPERVISOR && reviewerRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Only a supervisor or admin can endorse a submission');
      }
      nextStatus = SubmissionStatus.SUPERVISOR_APPROVED;
    } else if (action === ReviewAction.APPROVED) {
      if (reviewerRole !== UserRole.REVIEWER && reviewerRole !== UserRole.ADMIN) {
        throw new ForbiddenException('Only a reviewer or librarian can approve publication');
      }
      nextStatus = SubmissionStatus.PUBLISHED;
    } else if (action === ReviewAction.REQUESTED_CHANGES) {
      nextStatus = SubmissionStatus.CHANGES_REQUESTED;
    } else if (action === ReviewAction.REJECTED) {
      nextStatus = SubmissionStatus.REJECTED;
    } else {
      throw new BadRequestException('Invalid review action');
    }

    // Record review log
    const log = await this.prisma.reviewLog.create({
      data: {
        submissionId,
        reviewerId,
        action,
        comments,
      },
    });

    // Update submission status
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: nextStatus },
    });

    await this.auditService.log({
      actorId: reviewerId,
      action: `SUBMISSION_REVIEW_${action}`,
      targetEntity: 'Submission',
      targetId: submissionId,
      metadata: { previousStatus: submission.status, newStatus: nextStatus, comments },
      ipAddress,
      userAgent,
    });

    return {
      message: `Submission status updated to ${nextStatus}`,
      reviewLogId: log.id,
      newStatus: nextStatus,
    };
  }
}
