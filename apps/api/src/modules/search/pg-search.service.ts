import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ISearchProvider, SearchQueryFilters } from './search.interface';
import { SubmissionStatus } from '@fulafia/shared';

@Injectable()
export class PgSearchService implements ISearchProvider {
  private readonly logger = new Logger(PgSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(filters: SearchQueryFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Public catalog shows only PUBLISHED works unless an explicit status filter is passed
    // (reviewers/admins pass status= param to see other statuses in the review queue)
    where.status = filters.status || SubmissionStatus.PUBLISHED;

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters.year) {
      where.year = Number(filters.year);
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { abstract: { contains: q, mode: 'insensitive' } },
        { stableIdentifier: { contains: q, mode: 'insensitive' } },
        { keywords: { hasSome: [q] } },
        { author: { firstName: { contains: q, mode: 'insensitive' } } },
        { author: { lastName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          supervisor: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true, code: true } },
          versions: {
            take: 1,
            orderBy: { versionNumber: 'desc' },
            include: { file: true },
          },
        },
      }),
      this.prisma.submission.count({ where }),
    ]);

    const formattedData = items.map((sub) => {
      const latestVer = sub.versions[0];
      const isEmbargoed = sub.embargoReleaseDate ? new Date(sub.embargoReleaseDate) > new Date() : false;

      return {
        id: sub.id,
        stableIdentifier: sub.stableIdentifier,
        title: sub.title,
        abstract: sub.abstract,
        keywords: sub.keywords,
        documentType: sub.documentType,
        year: sub.year,
        degreeProgramme: sub.degreeProgramme,
        status: sub.status,
        versionNumber: sub.versionNumber,
        embargoReleaseDate: sub.embargoReleaseDate ? sub.embargoReleaseDate.toISOString() : undefined,
        isEmbargoed,
        authorId: sub.authorId,
        authorName: `${sub.author.firstName} ${sub.author.lastName}`,
        supervisorId: sub.supervisorId,
        supervisorName: sub.supervisor ? `${sub.supervisor.firstName} ${sub.supervisor.lastName}` : undefined,
        departmentId: sub.departmentId,
        departmentName: sub.department.name,
        doi: sub.doi,
        handleId: sub.handleId,
        latestFile: latestVer?.file ? {
          id: latestVer.file.id,
          originalName: latestVer.file.originalName,
          mimeType: latestVer.file.mimeType,
          sizeBytes: Number(latestVer.file.sizeBytes),
          sha256Checksum: latestVer.file.sha256Checksum,
          isVirusesClean: latestVer.file.isVirusesClean,
          storageProvider: latestVer.file.storageProvider,
          createdAt: latestVer.file.createdAt.toISOString(),
        } : undefined,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      };
    });

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
