import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from './dto';

describe('ContentService', () => {
  let service: ContentService;

  const mockContent = {
    id: 'content-id-123',
    contentType: ContentType.BOOK,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'A classic American novel',
    isbn: '978-0743273565',
    publishedYear: 1925,
    coverImageUrl: null,
    averageDifficulty: 50,
    metadata: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    content: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated content', async () => {
      mockPrismaService.content.count.mockResolvedValue(1);
      mockPrismaService.content.findMany.mockResolvedValue([mockContent]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockContent]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by content type', async () => {
      mockPrismaService.content.count.mockResolvedValue(0);
      mockPrismaService.content.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, contentType: ContentType.BOOK });

      expect(mockPrismaService.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: ContentType.BOOK,
          }),
        }),
      );
    });

    it('should filter by difficulty range', async () => {
      mockPrismaService.content.count.mockResolvedValue(0);
      mockPrismaService.content.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, difficulty: 50 });

      expect(mockPrismaService.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            averageDifficulty: { gte: 40, lte: 60 },
          }),
        }),
      );
    });

    it('should search by title and author', async () => {
      mockPrismaService.content.count.mockResolvedValue(0);
      mockPrismaService.content.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, search: 'gatsby' });

      expect(mockPrismaService.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'gatsby', mode: 'insensitive' } },
              { author: { contains: 'gatsby', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should include chapters when requested', async () => {
      mockPrismaService.content.count.mockResolvedValue(0);
      mockPrismaService.content.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, include: 'chapters' });

      expect(mockPrismaService.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            chapters: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return content by ID', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);

      const result = await service.findOne('content-id-123');

      expect(result).toEqual(mockContent);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should include chapters when requested', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(mockContent);

      await service.findOne('content-id-123', 'chapters');

      expect(mockPrismaService.content.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            chapters: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create content', async () => {
      const createDto = {
        contentType: ContentType.BOOK,
        title: 'New Book',
        author: 'Author Name',
        difficultyScore: 50,
      };
      mockPrismaService.content.create.mockResolvedValue({ ...mockContent, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.title).toBe('New Book');
      expect(mockPrismaService.content.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('update', () => {
    it('should update content', async () => {
      const updateDto = { title: 'Updated Title' };
      mockPrismaService.content.findUnique.mockResolvedValue({ id: 'content-id-123' });
      mockPrismaService.content.update.mockResolvedValue({ ...mockContent, ...updateDto });

      const result = await service.update('content-id-123', updateDto);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete content', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue({ id: 'content-id-123', title: 'Test' });
      mockPrismaService.content.delete.mockResolvedValue({});

      const result = await service.remove('content-id-123');

      expect(result.message).toBe('Content deleted successfully');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.content.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
