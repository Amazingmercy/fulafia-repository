import { DocumentType, SubmissionStatus } from '@fulafia/shared';

export interface SearchQueryFilters {
  query?: string;
  departmentId?: string;
  documentType?: DocumentType;
  year?: number;
  authorId?: string;
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
}

export interface ISearchProvider {
  search(filters: SearchQueryFilters): Promise<any>;
}
