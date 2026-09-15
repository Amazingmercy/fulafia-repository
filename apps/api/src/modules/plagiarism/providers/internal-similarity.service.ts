import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IInternalSimilarityChecker,
  InternalCheckRequest,
  InternalCheckResponse,
} from '../interfaces/internal-similarity-checker.interface';
import { InternalMatchItem } from '@fulafia/shared';

@Injectable()
export class InternalSimilarityService implements IInternalSimilarityChecker {
  private readonly logger = new Logger(InternalSimilarityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute 4-gram word shingles for Jaccard similarity comparison
   */
  private createShingles(text: string, k = 4): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const shingles = new Set<string>();
    for (let i = 0; i <= words.length - k; i++) {
      shingles.add(words.slice(i, i + k).join(' '));
    }
    return shingles;
  }

  private calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const shingle of setA) {
      if (setB.has(shingle)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : Number(((intersection / union) * 100).toFixed(1));
  }

  async checkSimilarity(request: InternalCheckRequest): Promise<InternalCheckResponse> {
    this.logger.log(`Running Layer 2 Internal Similarity check for version ${request.submissionVersionId}`);

    const targetShingles = this.createShingles(request.fullText);

    // Fetch prior published/submitted works in FULafia database (excluding current submission)
    const priorVersions = await this.prisma.submissionVersion.findMany({
      where: {
        submissionId: { not: request.submissionId },
        fullTextContent: { not: null },
      },
      select: {
        id: true,
        submissionId: true,
        title: true,
        fullTextContent: true,
        submission: {
          select: {
            title: true,
            author: { select: { firstName: true, lastName: true } },
            department: { select: { name: true } },
          },
        },
      },
      take: 100, // Search across top 100 prior repository entries
    });

    const topMatches: InternalMatchItem[] = [];
    let highestScore = 0;

    for (const prior of priorVersions) {
      if (!prior.fullTextContent) continue;
      const priorShingles = this.createShingles(prior.fullTextContent);
      const similarityScore = this.calculateJaccardSimilarity(targetShingles, priorShingles);

      if (similarityScore > 2.0) { // Keep matches with > 2% similarity
        if (similarityScore > highestScore) highestScore = similarityScore;

        const authorName = `${prior.submission.author.firstName} ${prior.submission.author.lastName}`;
        const department = prior.submission.department.name;

        // Find overlapping snippet
        const matchedSnippets: string[] = [];
        for (const shingle of targetShingles) {
          if (priorShingles.has(shingle)) {
            matchedSnippets.push(`"...${shingle}..."`);
            if (matchedSnippets.length >= 3) break;
          }
        }

        topMatches.push({
          matchedSubmissionId: prior.submissionId,
          matchedSubmissionTitle: prior.submission.title,
          matchedAuthorName: authorName,
          matchedDepartment: department,
          similarityScore,
          matchedSnippets,
        });
      }
    }

    // Sort by similarity score descending
    topMatches.sort((a, b) => b.similarityScore - a.similarityScore);

    this.logger.log(
      `Layer 2 Internal Check complete. Highest match: ${highestScore}% across ${topMatches.length} internal works.`,
    );

    return {
      overallSimilarityPercentage: highestScore,
      topMatches: topMatches.slice(0, 5), // Return top 5 internal matches
    };
  }
}
