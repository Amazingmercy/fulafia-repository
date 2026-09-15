import { StorageProviderType } from '@fulafia/shared';

export interface UploadFileOptions {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  directory?: string;
}

export interface UploadResult {
  storageKey: string;
  storageProvider: StorageProviderType;
  sizeBytes: number;
  sha256Checksum: string;
  magicBytesVerified: boolean;
}

export interface IStorageProvider {
  readonly providerType: StorageProviderType;
  uploadFile(options: UploadFileOptions): Promise<UploadResult>;
  getFileStream(storageKey: string): Promise<Buffer | NodeJS.ReadableStream>;
  deleteFile(storageKey: string): Promise<boolean>;
}
