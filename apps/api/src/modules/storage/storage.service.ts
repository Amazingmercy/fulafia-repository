import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { IStorageProvider, UploadFileOptions, UploadResult } from './storage.interface';
import { StorageProviderType } from '@fulafia/shared';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private activeProvider: IStorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageProvider: LocalStorageProvider,
    private readonly s3StorageProvider: S3StorageProvider,
  ) {
    const providerConfig = this.configService.get<string>('STORAGE_PROVIDER', 'LOCAL').toUpperCase();
    if (providerConfig === 'S3') {
      this.activeProvider = this.s3StorageProvider;
    } else {
      this.activeProvider = this.localStorageProvider;
    }
    this.logger.log(`Initialized StorageService with provider: ${this.activeProvider.providerType}`);
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    return this.activeProvider.uploadFile(options);
  }

  async getFileStream(storageKey: string, provider?: StorageProviderType): Promise<Buffer | NodeJS.ReadableStream> {
    const providerToUse = provider === StorageProviderType.S3 ? this.s3StorageProvider : this.localStorageProvider;
    return providerToUse.getFileStream(storageKey);
  }

  async deleteFile(storageKey: string, provider?: StorageProviderType): Promise<boolean> {
    const providerToUse = provider === StorageProviderType.S3 ? this.s3StorageProvider : this.localStorageProvider;
    return providerToUse.deleteFile(storageKey);
  }
}
