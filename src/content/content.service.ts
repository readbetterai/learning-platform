import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  ContentResponseDto,
} from './dto';
import {
  buildPaginatedResult,
  calculateSkip,
  PaginatedResult,
} from '../common/utils/pagination.util';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all content with pagination, search, and filtering
   */
  async findAll(
    query: QueryContentDto,
  ): Promise<PaginatedResult<ContentResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      contentType,
      difficulty,
      sortBy,
      sortOrder,
      include,
    } = query;

    // Build where clause
    const where: any = {};

    // Search across title and author
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by content type
    if (contentType) {
      where.contentType = contentType;
    }

    // Filter by difficulty (within +/- 10 range)
    if (difficulty) {
      where.averageDifficulty = {
        gte: difficulty - 10,
        lte: difficulty + 10,
      };
    }

    // Get total count for pagination
    const total = await this.prisma.content.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('chapters')) {
        includeClause.chapters = {
          orderBy: { chapterNumber: 'asc' },
        };
      }
    }

    // Fetch content
    const contentItems = await this.prisma.content.findMany({
      where,
      skip: calculateSkip(page, limit),
      take: limit,
      orderBy,
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    return buildPaginatedResult(
      contentItems as ContentResponseDto[],
      total,
      { page, limit },
    );
  }

  /**
   * Get a single content item by ID
   */
  async findOne(id: string, include?: string): Promise<ContentResponseDto> {
    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('chapters')) {
        includeClause.chapters = {
          orderBy: { chapterNumber: 'asc' },
        };
      }
    }

    const content = await this.prisma.content.findUnique({
      where: { id },
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content as ContentResponseDto;
  }

  /**
   * Create new content
   */
  async create(dto: CreateContentDto): Promise<ContentResponseDto> {
    const content = await this.prisma.content.create({
      data: dto,
    });

    return content as ContentResponseDto;
  }

  /**
   * Update content by ID
   */
  async update(id: string, dto: UpdateContentDto): Promise<ContentResponseDto> {
    // Check if content exists
    const existing = await this.prisma.content.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: dto,
    });

    return updated as ContentResponseDto;
  }

  /**
   * Delete content by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    // Check if content exists
    const existing = await this.prisma.content.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.content.delete({ where: { id } });

    return { message: 'Content deleted successfully' };
  }
}
