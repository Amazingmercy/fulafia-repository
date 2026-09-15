import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@fulafia/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: UserRole, departmentId?: string) {
    const where: any = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findSupervisors(departmentId?: string) {
    return this.findAll(UserRole.SUPERVISOR, departmentId);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, mfaSecret, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  async updateRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }
}
