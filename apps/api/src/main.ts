import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('FULafiaRepositoryAPI');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // OWASP Helmet Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Customised for Swagger UI compatibility
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS lockdown — explicit origin allow-list
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173', 'https://fulafia-repository-web.vercel.app', 'https://fulafia-repository-api.onrender.com'],
    credentials: true,
  });

  // NOTE: Multer DoS mitigations (GHSA-xf7r, GHSA-v52c, GHSA-5528, GHSA-72gw,
  // GHSA-3p4h, GHSA-wc9g, GHSA-qvfw, GHSA-535w) are enforced at the controller
  // level via FileInterceptor({ limits: {...} }) — the correct NestJS pattern.
  // See: apps/api/src/modules/submissions/submissions.controller.ts

  // Global strict DTO validation (OWASP ASVS V5 Input Validation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('FULafia Institutional Repository API')
    .setDescription(
      'Institutional repository API for the Federal University of Lafia (FULafia), Nigeria. ' +
      'Dual-layer originality verification, RBAC, and embargo-aware access control.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(
    `FULafia Repository API running on port ${port} ` +
    `[Swagger: http://localhost:${port}/api/docs]`,
  );
}

bootstrap();
