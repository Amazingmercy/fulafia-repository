import { Module } from '@nestjs/common';
import { PgSearchService } from './pg-search.service';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [PgSearchService],
  exports: [PgSearchService],
})
export class SearchModule {}
