import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  async create(data: { name: string; code: string; faculty: string }) {
    return this.prisma.department.create({ data });
  }
}
