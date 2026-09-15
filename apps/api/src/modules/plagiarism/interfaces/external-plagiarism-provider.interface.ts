import { TurnitinScopeConfig, MatchedSource } from '@fulafia/shared';

export interface ExternalCheckRequest {
  submissionVersionId: string;
  documentTitle: string;
  fullText: string;
  authorName: string;
  scopes: TurnitinScopeConfig;
}

export interface ExternalCheckResponse {
  externalJobId: string;
  overallSimilarityPercentage: number;
  matchedSources: MatchedSource[];
  rawResponse: Record<string, any>;
}

export interface IExternalPlagiarismProvider {
  readonly providerName: string;
  submitCheck(request: ExternalCheckRequest): Promise<ExternalCheckResponse>;
}
