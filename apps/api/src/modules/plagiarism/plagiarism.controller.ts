import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PlagiarismService } from './plagiarism.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, TurnitinScopeConfig } from '@fulafia/shared';

@Controller('plagiarism')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlagiarismController {
  constructor(private readonly plagiarismService: PlagiarismService) {}

  @Post('trigger/:versionId')
  @Roles(UserRole.STUDENT, UserRole.SUPERVISOR, UserRole.REVIEWER, UserRole.ADMIN)
  async triggerCheck(
    @Param('versionId') versionId: string,
    @Body('scopes') scopes?: TurnitinScopeConfig,
  ) {
    return this.plagiarismService.triggerDualPlagiarismCheck(versionId, scopes);
  }

  @Get('report/:versionId')
  @Roles(UserRole.STUDENT, UserRole.SUPERVISOR, UserRole.REVIEWER, UserRole.ADMIN)
  async getReport(@Param('versionId') versionId: string) {
    return this.plagiarismService.getDualReport(versionId);
  }
}
