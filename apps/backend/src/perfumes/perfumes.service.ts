import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerfumesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 50, gender?: string) {
    const skip = (page - 1) * limit;
    return this.prisma.perfume.findMany({
      where: gender && gender !== 'All' ? { gender } : {},
      select: {
        id: true,
        name: true,
        brand: true,
        release_year: true,
        gender: true,
        image_url: true,
        rating: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });
  }

  async search(query: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.perfume.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        brand: true,
        release_year: true,
        gender: true,
        image_url: true,
        rating: true,
      },
      skip,
      take: limit,
    });
  }

  async findOne(id: string) {
    return this.prisma.perfume.findUnique({
      where: { id }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.perfume.update({
      where: { id },
      data
    });
  }
}
