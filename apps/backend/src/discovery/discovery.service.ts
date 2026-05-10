import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscoveryItemDto, UpdateDiscoveryItemDto } from './discovery.dto';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  private async ensureUser(userId: string, email?: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, username: email ?? userId, isPublic: false },
    });
  }

  async findAllForUser(userId: string, email?: string) {
    await this.ensureUser(userId, email);
    return this.prisma.discoveryItem.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    });
  }

  async create(userId: string, email: string, dto: CreateDiscoveryItemDto) {
    await this.ensureUser(userId, email);
    return this.prisma.discoveryItem.create({
      data: {
        userId,
        perfumeId: dto.perfumeId ?? null,
        perfumeName: dto.perfumeName ?? null,
        perfumeBrand: dto.perfumeBrand ?? null,
        status: dto.status,
        sillage: dto.sillage ?? null,
        longevity: dto.longevity ?? null,
        verdict: dto.verdict ?? null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateDiscoveryItemDto) {
    return this.prisma.discoveryItem.updateMany({
      where: { id, userId },
      data: {
        ...(dto.perfumeId !== undefined && { perfumeId: dto.perfumeId }),
        ...(dto.perfumeName !== undefined && { perfumeName: dto.perfumeName }),
        ...(dto.perfumeBrand !== undefined && { perfumeBrand: dto.perfumeBrand }),
        ...(dto.status && { status: dto.status }),
        ...(dto.sillage !== undefined && { sillage: dto.sillage }),
        ...(dto.longevity !== undefined && { longevity: dto.longevity }),
        ...(dto.verdict !== undefined && { verdict: dto.verdict }),
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.discoveryItem.deleteMany({
      where: { id, userId },
    });
  }
}
