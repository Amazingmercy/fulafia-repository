import { InternalMatchItem } from '@fulafia/shared';

export interface InternalCheckRequest {
  submissionVersionId: string;
  submissionId: string;
  fullText: string;
  departmentId: string;
}

export interface InternalCheckResponse {
  overallSimilarityPercentage: number;
  topMatches: InternalMatchItem[];
}

export interface IInternalSimilarityChecker {
  checkSimilarity(request: InternalCheckRequest): Promise<InternalCheckResponse>;
}
