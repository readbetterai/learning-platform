import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChaptersService', () => {
  let service: ChaptersService;

  const mockChapter = {
    id: 'chapter-id-123',
    contentId: 'content-id-123',
    chapterNumber: 1,
    title: 'Chapter 1: Introduction',
    content: 'This is the chapter content...',
    wordCount: 1000,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    chapter: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    content: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ChaptersService>(ChaptersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated chapters', async () => {
      mockPrismaService.chapter.count.mockResolvedValue(1);
      mockPrismaService.chapter.findMany.mockResolvedValue([mockChapter]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockChapter]);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by contentId', async () => {
      mockPrismaService.chapter.count.mockResolvedValue(0);
      mockPrismaService.chapter.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, contentId: 'content-id-123' });

      expect(mockPrismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentId: 'content-id-123',
          }),
        }),
      );
    });

    it('should search by title', async () => {
      mockPrismaService.chapter.count.mockResolvedValue(0);
      mockPrismaService.chapter.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, search: 'introduction' });

      expect(mockPrismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: { contains: 'introduction', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should include sentences when requested', async () => {
      mockPrismaService.chapter.count.mockResolvedValue(0);
      mockPrismaService.chapter.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, include: 'sentences' });

      expect(mockPrismaService.chapter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            sentences: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return chapter by ID', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue(mockChapter);

      const result = await service.findOne('chapter-id-123');

      expect(result).toEqual(mockChapter);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create chapter', async () => {
      const createDto = {
        contentId: 'content-id-123',
        chapterNumber: 2,
        title: 'Chapter 2',
      };
      mockPrismaService.content.findUnique.mockResolvedValue({ id: 'content-id-123' });
      mockPrismaService.chapter.findUnique.mockResolvedValue(null);
      mockPrismaService.chapter.create.mockResolvedValue({ ...mockChapter, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.title).toBe('Chapter 2');
    });

    it('should throw BadRequestException for invalid contentId', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ contentId: 'invalid', chapterNumber: 1, title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for duplicate chapter number', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue({ id: 'content-id-123' });
      mockPrismaService.chapter.findUnique.mockResolvedValue(mockChapter);

      await expect(
        service.create({ contentId: 'content-id-123', chapterNumber: 1, title: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update chapter', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue({
        id: 'chapter-id-123',
        contentId: 'content-id-123',
        chapterNumber: 1,
      });
      mockPrismaService.chapter.update.mockResolvedValue({
        ...mockChapter,
        title: 'Updated Title',
      });

      const result = await service.update('chapter-id-123', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for duplicate chapter number', async () => {
      mockPrismaService.chapter.findUnique
        .mockResolvedValueOnce({
          id: 'chapter-id-123',
          contentId: 'content-id-123',
          chapterNumber: 1,
        })
        .mockResolvedValueOnce({ id: 'other-chapter' });

      await expect(
        service.update('chapter-id-123', { chapterNumber: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete chapter', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue({ id: 'chapter-id-123', title: 'Test' });
      mockPrismaService.chapter.delete.mockResolvedValue({});

      const result = await service.remove('chapter-id-123');

      expect(result.message).toBe('Chapter deleted successfully');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.chapter.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
