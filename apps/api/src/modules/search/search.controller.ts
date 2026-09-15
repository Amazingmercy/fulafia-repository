import { Controller, Get, Query } from '@nestjs/common';
import { PgSearchService } from './pg-search.service';
import { DocumentType, SubmissionStatus } from '@fulafia/shared';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: PgSearchService) {}

  @Get()
  async searchCatalog(
    @Query('query') query?: string,
    @Query('departmentId') departmentId?: string,
    @Query('documentType') documentType?: DocumentType,
    @Query('year') year?: number,
    @Query('authorId') authorId?: string,
    @Query('status') status?: SubmissionStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.searchService.search({
      query,
      departmentId,
      documentType,
      year,
      authorId,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }
}
