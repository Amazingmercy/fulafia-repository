import { Module } from '@nestjs/common';
import { PlagiarismService } from './plagiarism.service';
import { PlagiarismController } from './plagiarism.controller';
import { TurnitinProvider } from './providers/turnitin.provider';
import { InternalSimilarityService } from './providers/internal-similarity.service';

@Module({
  controllers: [PlagiarismController],
  providers: [PlagiarismService, TurnitinProvider, InternalSimilarityService],
  exports: [PlagiarismService],
})
export class PlagiarismModule {}
