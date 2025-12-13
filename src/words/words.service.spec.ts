import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WordsService } from './words.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WordsService', () => {
  let service: WordsService;

  const mockWord = {
    id: 'word-id-123',
    word: 'eloquent',
    difficultyScore: 65,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    definitions: [{ id: 'def-1', wordId: 'word-id-123', definition: 'Fluent or persuasive' }],
    exampleSentences: [{ id: 'ex-1', wordId: 'word-id-123', sentence: 'She was eloquent.' }],
  };

  const mockPrismaService = {
    word: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    wordDefinition: {
      create: jest.fn(),
    },
    exampleSentence: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated words', async () => {
      mockPrismaService.word.count.mockResolvedValue(1);
      mockPrismaService.word.findMany.mockResolvedValue([mockWord]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([mockWord]);
      expect(result.meta.total).toBe(1);
    });

    it('should search by word', async () => {
      mockPrismaService.word.count.mockResolvedValue(0);
      mockPrismaService.word.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, search: 'elo' });

      expect(mockPrismaService.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            word: { contains: 'elo', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by difficulty range', async () => {
      mockPrismaService.word.count.mockResolvedValue(0);
      mockPrismaService.word.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, difficulty: 60 });

      expect(mockPrismaService.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficultyScore: { gte: 50, lte: 70 },
          }),
        }),
      );
    });

    it('should filter by min/max difficulty', async () => {
      mockPrismaService.word.count.mockResolvedValue(0);
      mockPrismaService.word.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, minDifficulty: 40, maxDifficulty: 80 });

      expect(mockPrismaService.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficultyScore: { gte: 40, lte: 80 },
          }),
        }),
      );
    });

    it('should include definitions when requested', async () => {
      mockPrismaService.word.count.mockResolvedValue(0);
      mockPrismaService.word.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, include: 'definitions' });

      expect(mockPrismaService.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            definitions: true,
          }),
        }),
      );
    });

    it('should include examples when requested', async () => {
      mockPrismaService.word.count.mockResolvedValue(0);
      mockPrismaService.word.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 20, include: 'examples' });

      expect(mockPrismaService.word.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            exampleSentences: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return word by ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(mockWord);

      const result = await service.findOne('word-id-123');

      expect(result).toEqual(mockWord);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create word with definitions and examples', async () => {
      const createDto = {
        word: 'Eloquent',
        difficultyScore: 65,
        definitions: [{ definition: 'Fluent or persuasive' }],
        exampleSentences: [{ sentence: 'She was eloquent.' }],
      };
      mockPrismaService.word.findUnique.mockResolvedValue(null);
      mockPrismaService.word.create.mockResolvedValue(mockWord);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWord);
      expect(mockPrismaService.word.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            word: 'eloquent', // normalized to lowercase
            definitions: expect.objectContaining({
              create: expect.any(Array),
            }),
          }),
        }),
      );
    });

    it('should throw ConflictException for duplicate word', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(mockWord);

      await expect(
        service.create({ word: 'eloquent', difficultyScore: 65 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize word to lowercase', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);
      mockPrismaService.word.create.mockResolvedValue(mockWord);

      await service.create({ word: 'ELOQUENT', difficultyScore: 65 });

      expect(mockPrismaService.word.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            word: 'eloquent',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update word', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue({ id: 'word-id-123', word: 'eloquent' });
      mockPrismaService.word.update.mockResolvedValue({ ...mockWord, difficultyScore: 70 });

      const result = await service.update('word-id-123', { difficultyScore: 70 });

      expect(result.difficultyScore).toBe(70);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { difficultyScore: 70 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate word when renaming', async () => {
      mockPrismaService.word.findUnique
        .mockResolvedValueOnce({ id: 'word-id-123', word: 'eloquent' })
        .mockResolvedValueOnce({ id: 'other-word', word: 'verbose' });

      await expect(
        service.update('word-id-123', { word: 'verbose' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete word', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue({ id: 'word-id-123', word: 'eloquent' });
      mockPrismaService.word.delete.mockResolvedValue({});

      const result = await service.remove('word-id-123');

      expect(result.message).toBe('Word deleted successfully');
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addDefinition', () => {
    it('should add definition to word', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(mockWord);
      mockPrismaService.wordDefinition.create.mockResolvedValue({});

      await service.addDefinition('word-id-123', 'New definition');

      expect(mockPrismaService.wordDefinition.create).toHaveBeenCalledWith({
        data: {
          wordId: 'word-id-123',
          definition: 'New definition',
        },
      });
    });

    it('should throw NotFoundException for invalid word ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);

      await expect(
        service.addDefinition('invalid-id', 'New definition'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addExample', () => {
    it('should add example to word', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(mockWord);
      mockPrismaService.exampleSentence.create.mockResolvedValue({});

      await service.addExample('word-id-123', 'New example sentence');

      expect(mockPrismaService.exampleSentence.create).toHaveBeenCalledWith({
        data: {
          wordId: 'word-id-123',
          sentence: 'New example sentence',
        },
      });
    });

    it('should throw NotFoundException for invalid word ID', async () => {
      mockPrismaService.word.findUnique.mockResolvedValue(null);

      await expect(
        service.addExample('invalid-id', 'New example'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
