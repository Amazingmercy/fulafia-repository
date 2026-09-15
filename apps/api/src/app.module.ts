import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './database/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { StorageModule } from './modules/storage/storage.module';
import { PlagiarismModule } from './modules/plagiarism/plagiarism.module';
import { SearchModule } from './modules/search/search.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    StorageModule,
    PlagiarismModule,
    SearchModule,
    SubmissionsModule,
    ReviewModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
