import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditLogOptions {
  actorId?: string;
  action: string;
  targetEntity: string;
  targetId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(options: AuditLogOptions) {
    try {
      const entry = await this.prisma.auditLog.create({
        data: {
          actorId: options.actorId,
          action: options.action,
          targetEntity: options.targetEntity,
          targetId: options.targetId,
          metadata: options.metadata || {},
          ipAddress: options.ipAddress || '0.0.0.0',
          userAgent: options.userAgent || 'UNKNOWN',
        },
      });
      this.logger.log(`AuditLog [${options.action}] on ${options.targetEntity}:${options.targetId} by ${options.actorId || 'SYSTEM'}`);
      return entry;
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
    }
  }

  async getLogs(page = 1, limit = 20, entity?: string) {
    const skip = (page - 1) * limit;
    const where = entity ? { targetEntity: entity } : {};

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
