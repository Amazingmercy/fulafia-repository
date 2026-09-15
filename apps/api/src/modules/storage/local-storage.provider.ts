import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { IStorageProvider, UploadFileOptions, UploadResult } from './storage.interface';
import { StorageProviderType } from '@fulafia/shared';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  readonly providerType = StorageProviderType.LOCAL;
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false;
    const hex = buffer.toString('hex', 0, 4).toUpperCase();

    // PDF magic bytes: 25 50 44 46 (%PDF)
    if (mimeType === 'application/pdf' || hex.startsWith('25504446')) {
      return buffer.toString('utf8', 0, 4) === '%PDF';
    }
    // ZIP / DOCX / XLSX magic bytes: 50 4B 03 04 (PK..)
    if (
      mimeType.includes('zip') ||
      mimeType.includes('vnd.openxmlformats') ||
      mimeType.includes('wordprocessingml') ||
      hex.startsWith('504B0304')
    ) {
      return hex.startsWith('504B0304');
    }
    // PNG: 89 50 4E 47
    if (mimeType === 'image/png' || hex.startsWith('89504E47')) {
      return hex.startsWith('89504E47');
    }
    // JPEG: FF D8 FF
    if (mimeType === 'image/jpeg' || hex.startsWith('FFD8FF')) {
      return hex.startsWith('FFD8FF');
    }
    // Text / CSV fallback
    return true;
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const magicBytesVerified = this.verifyMagicBytes(options.buffer, options.mimeType);
    if (!magicBytesVerified) {
      this.logger.warn(`Magic bytes check failed for file: ${options.filename} (${options.mimeType})`);
    }

    const sha256Checksum = crypto.createHash('sha256').update(options.buffer).digest('hex');
    const ext = path.extname(options.filename);
    const storageKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(this.uploadDir, storageKey);

    await fs.promises.writeFile(filePath, options.buffer);

    this.logger.log(`Uploaded local file ${storageKey} (${options.buffer.length} bytes, SHA256: ${sha256Checksum})`);

    return {
      storageKey,
      storageProvider: this.providerType,
      sizeBytes: options.buffer.length,
      sha256Checksum,
      magicBytesVerified,
    };
  }

  async getFileStream(storageKey: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}
