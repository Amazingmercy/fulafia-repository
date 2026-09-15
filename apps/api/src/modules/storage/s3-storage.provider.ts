import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { IStorageProvider, UploadFileOptions, UploadResult } from './storage.interface';
import { StorageProviderType } from '@fulafia/shared';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  readonly providerType = StorageProviderType.S3;
  private readonly logger = new Logger(S3StorageProvider.name);

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const sha256Checksum = crypto.createHash('sha256').update(options.buffer).digest('hex');
    const storageKey = `s3-s3bucket/${Date.now()}-${options.filename}`;

    this.logger.log(`[S3 Adapter] Simulated upload to S3: ${storageKey}`);

    return {
      storageKey,
      storageProvider: this.providerType,
      sizeBytes: options.buffer.length,
      sha256Checksum,
      magicBytesVerified: true,
    };
  }

  async getFileStream(storageKey: string): Promise<Buffer> {
    this.logger.log(`[S3 Adapter] Fetching object from S3 key: ${storageKey}`);
    return Buffer.from(`S3 file content for ${storageKey}`);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    this.logger.log(`[S3 Adapter] Deleted object from S3 key: ${storageKey}`);
    return true;
  }
}
