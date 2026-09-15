import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService, CreateSubmissionOptions } from './submissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@fulafia/shared';
import { Response } from 'express';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fieldNameSize: 100,     // bytes — guards against oversized nested field names
      fieldSize: 100 * 1024,  // 100 KB per non-file field
      fields: 20,             // max non-file fields
      fileSize: 50 * 1024 * 1024, // 50 MB max file
      files: 1,               // single document per submission
      parts: 25,
      headerPairs: 100,
    },
  }))
  async createSubmission(
    @CurrentUser('id') userId: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const scopes = body.scopes ? (typeof body.scopes === 'string' ? JSON.parse(body.scopes) : body.scopes) : undefined;
    const keywords = body.keywords ? (typeof body.keywords === 'string' ? JSON.parse(body.keywords) : body.keywords) : [];

    const options: CreateSubmissionOptions = {
      title: body.title,
      abstract: body.abstract,
      keywords: Array.isArray(keywords) ? keywords : [body.keywords],
      documentType: body.documentType,
      year: Number(body.year),
      degreeProgramme: body.degreeProgramme,
      supervisorId: body.supervisorId || undefined,
      departmentId: body.departmentId,
      embargoReleaseDate: body.embargoReleaseDate || undefined,
      scopes,
    };

    return this.submissionsService.createSubmission(userId, options, file, ipAddress, userAgent);
  }

  @Post(':id/version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100 * 1024,
      fields: 20,
      fileSize: 50 * 1024 * 1024,
      files: 1,
      parts: 25,
      headerPairs: 100,
    },
  }))
  async createNewVersion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('title') title: string,
    @Body('abstract') abstract: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.submissionsService.createNewVersion(id, userId, title, abstract, file, ipAddress, userAgent);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMySubmissions(@CurrentUser('id') userId: string) {
    return this.submissionsService.findByAuthor(userId);
  }

  @Get(':id')
  async getSubmission(@Param('id') id: string, @CurrentUser() currentUser?: any) {
    return this.submissionsService.findSubmissionById(id, currentUser);
  }

  @Get(':id/manifest')
  async getSignedManifest(@Param('id') id: string) {
    return this.submissionsService.exportSignedManifest(id);
  }
}
