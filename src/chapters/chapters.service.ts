import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  QueryChaptersDto,
  ChapterResponseDto,
} from './dto';
import {
  buildPaginatedResult,
  calculateSkip,
  PaginatedResult,
} from '../common/utils/pagination.util';

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all chapters with pagination and filtering
   */
  async findAll(
    query: QueryChaptersDto,
  ): Promise<PaginatedResult<ChapterResponseDto>> {
    const {
      page = 1,
      limit = 20,
      contentId,
      search,
      sortBy,
      sortOrder,
      include,
    } = query;

    // Build where clause
    const where: any = {};

    // Filter by content ID
    if (contentId) {
      where.contentId = contentId;
    }

    // Search by title
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await this.prisma.chapter.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.chapterNumber = 'asc';
    }

    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('sentences')) {
        includeClause.sentences = {
          orderBy: { position: 'asc' },
        };
      }
    }

    // Fetch chapters
    const chapters = await this.prisma.chapter.findMany({
      where,
      skip: calculateSkip(page, limit),
      take: limit,
      orderBy,
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    return buildPaginatedResult(
      chapters as ChapterResponseDto[],
      total,
      { page, limit },
    );
  }

  /**
   * Get a single chapter by ID
   */
  async findOne(id: string, include?: string): Promise<ChapterResponseDto> {
    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('sentences')) {
        includeClause.sentences = {
          orderBy: { position: 'asc' },
        };
      }
    }

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    return chapter as ChapterResponseDto;
  }

  /**
   * Create a new chapter
   */
  async create(dto: CreateChapterDto): Promise<ChapterResponseDto> {
    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: dto.contentId },
      select: { id: true },
    });

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    // Check for duplicate chapter number within the same content
    const existingChapter = await this.prisma.chapter.findUnique({
      where: {
        contentId_chapterNumber: {
          contentId: dto.contentId,
          chapterNumber: dto.chapterNumber,
        },
      },
    });

    if (existingChapter) {
      throw new BadRequestException(
        `Chapter ${dto.chapterNumber} already exists for this content`,
      );
    }

    const chapter = await this.prisma.chapter.create({
      data: dto,
    });

    return chapter as ChapterResponseDto;
  }

  /**
   * Update a chapter by ID
   */
  async update(id: string, dto: UpdateChapterDto): Promise<ChapterResponseDto> {
    // Check if chapter exists
    const existing = await this.prisma.chapter.findUnique({
      where: { id },
      select: { id: true, contentId: true, chapterNumber: true },
    });

    if (!existing) {
      throw new NotFoundException('Chapter not found');
    }

    // Check for duplicate chapter number if changing it
    if (dto.chapterNumber && dto.chapterNumber !== existing.chapterNumber) {
      const duplicate = await this.prisma.chapter.findUnique({
        where: {
          contentId_chapterNumber: {
            contentId: existing.contentId,
            chapterNumber: dto.chapterNumber,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Chapter ${dto.chapterNumber} already exists for this content`,
        );
      }
    }

    const updated = await this.prisma.chapter.update({
      where: { id },
      data: dto,
    });

    return updated as ChapterResponseDto;
  }

  /**
   * Delete a chapter by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    // Check if chapter exists
    const existing = await this.prisma.chapter.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundException('Chapter not found');
    }

    await this.prisma.chapter.delete({ where: { id } });

    return { message: 'Chapter deleted successfully' };
  }
}
