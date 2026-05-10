import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionItemDto, UpdateCollectionItemDto } from './collection.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  /** Crée le profil User si inexistant (pour respecter la FK) */
  private async ensureUser(userId: string, email?: string) {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        username: email ?? userId, // utilise l'email comme username par défaut
        isPublic: false,
      },
    });
  }

  async findAllForUser(userId: string, email?: string) {
    await this.ensureUser(userId, email);
    return this.prisma.collectionItem.findMany({
      where: { userId },
      include: {
        perfume: {
          select: {
            id: true,
            name: true,
            brand: true,
            image_url: true,
            notes_top: true,
            notes_middle: true,
            notes_base: true,
            rating: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async create(userId: string, email: string, dto: CreateCollectionItemDto) {
    await this.ensureUser(userId, email);
    
    let perfumeId = dto.perfumeId;
    
    // If no perfumeId, check if we have brand/name to create a shell record
    if (!perfumeId && dto.perfumeName) {
      const shell = await this.prisma.perfume.create({
        data: {
          name: dto.perfumeName,
          brand: dto.perfumeBrand || "Unknown",
        }
      });
      perfumeId = shell.id;
    }

    if (!perfumeId) throw new Error("perfumeId or perfumeName is required");

    return this.prisma.collectionItem.create({
      data: {
        userId,
        perfumeId,
        format: dto.format,
        level: dto.level ?? 100,
        openedAt: new Date(dto.openedAt),
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateCollectionItemDto) {
    return this.prisma.collectionItem.updateMany({
      where: { id, userId },
      data: {
        ...(dto.format && { format: dto.format }),
        ...(dto.level !== undefined && { level: dto.level }),
        ...(dto.openedAt && { openedAt: new Date(dto.openedAt) }),
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.collectionItem.deleteMany({
      where: { id, userId },
    });
  }
}
