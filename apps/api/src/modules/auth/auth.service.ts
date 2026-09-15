import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@fulafia/shared';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  departmentId: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || UserRole.STUDENT,
        departmentId: dto.departmentId,
      },
      include: { department: true },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'USER_REGISTER',
      targetEntity: 'User',
      targetId: user.id,
      metadata: { role: user.role, email: user.email },
      ipAddress,
      userAgent,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        isMfaEnabled: user.isMfaEnabled,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      await this.auditService.log({
        action: 'AUTH_LOGIN_FAILED',
        targetEntity: 'User',
        targetId: user.id,
        metadata: { email: dto.email },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      targetEntity: 'User',
      targetId: user.id,
      ipAddress,
      userAgent,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        isMfaEnabled: user.isMfaEnabled,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { department: true } } },
    });

    if (!existingToken || existingToken.isRevoked || existingToken.expiresAt < new Date()) {
      if (existingToken && existingToken.isRevoked) {
        // Reuse detection trigger: revoke all user refresh tokens!
        await this.prisma.refreshToken.updateMany({
          where: { userId: existingToken.userId },
          data: { isRevoked: true },
        });
        await this.auditService.log({
          actorId: existingToken.userId,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          targetEntity: 'RefreshToken',
          targetId: existingToken.id,
          ipAddress,
          userAgent,
        });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke current refresh token & rotate
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokenPair(
      existingToken.user.id,
      existingToken.user.email,
      existingToken.user.role,
      ipAddress,
      userAgent,
    );

    return tokens;
  }

  async logout(rawRefreshToken: string, userId?: string, ipAddress?: string, userAgent?: string) {
    let resolvedUserId = userId;

    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);

      // Resolve userId from the token record if not supplied (logout without JWT guard)
      if (!resolvedUserId) {
        const record = await this.prisma.refreshToken.findFirst({ where: { tokenHash }, select: { userId: true } });
        resolvedUserId = record?.userId;
      }

      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    if (resolvedUserId) {
      await this.auditService.log({
        actorId: resolvedUserId,
        action: 'AUTH_LOGOUT',
        targetEntity: 'User',
        targetId: resolvedUserId,
        ipAddress,
        userAgent,
      });
    }

    return { message: 'Logged out successfully' };
  }


  private async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'fulafia-repo-super-secret-jwt-key-2026'),
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}
