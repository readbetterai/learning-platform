import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWordDto,
  UpdateWordDto,
  QueryWordsDto,
  WordResponseDto,
} from './dto';
import {
  buildPaginatedResult,
  calculateSkip,
  PaginatedResult,
} from '../common/utils/pagination.util';

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all words with pagination and filtering
   */
  async findAll(
    query: QueryWordsDto,
  ): Promise<PaginatedResult<WordResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      difficulty,
      minDifficulty,
      maxDifficulty,
      sortBy,
      sortOrder,
      include,
    } = query;

    // Build where clause
    const where: any = {};

    // Search by word
    if (search) {
      where.word = { contains: search.toLowerCase(), mode: 'insensitive' };
    }

    // Filter by difficulty range
    if (difficulty) {
      where.difficultyScore = {
        gte: difficulty - 10,
        lte: difficulty + 10,
      };
    } else if (minDifficulty || maxDifficulty) {
      where.difficultyScore = {};
      if (minDifficulty) {
        where.difficultyScore.gte = minDifficulty;
      }
      if (maxDifficulty) {
        where.difficultyScore.lte = maxDifficulty;
      }
    }

    // Get total count for pagination
    const total = await this.prisma.word.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.word = 'asc';
    }

    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('definitions')) {
        includeClause.definitions = true;
      }
      if (includes.includes('examples')) {
        includeClause.exampleSentences = true;
      }
    }

    // Fetch words
    const words = await this.prisma.word.findMany({
      where,
      skip: calculateSkip(page, limit),
      take: limit,
      orderBy,
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    return buildPaginatedResult(
      words as WordResponseDto[],
      total,
      { page, limit },
    );
  }

  /**
   * Get a single word by ID
   */
  async findOne(id: string, include?: string): Promise<WordResponseDto> {
    // Build include clause
    const includeClause: any = {};
    if (include) {
      const includes = include.split(',').map((i) => i.trim());
      if (includes.includes('definitions')) {
        includeClause.definitions = true;
      }
      if (includes.includes('examples')) {
        includeClause.exampleSentences = true;
      }
    }

    const word = await this.prisma.word.findUnique({
      where: { id },
      include: Object.keys(includeClause).length > 0 ? includeClause : undefined,
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word as WordResponseDto;
  }

  /**
   * Create a new word with optional definitions and examples
   */
  async create(dto: CreateWordDto): Promise<WordResponseDto> {
    // Normalize word to lowercase
    const normalizedWord = dto.word.toLowerCase().trim();

    // Check for duplicate word
    const existing = await this.prisma.word.findUnique({
      where: { word: normalizedWord },
    });

    if (existing) {
      throw new ConflictException(`Word "${normalizedWord}" already exists`);
    }

    // Create word with nested relations
    const word = await this.prisma.word.create({
      data: {
        word: normalizedWord,
        difficultyScore: dto.difficultyScore,
        definitions: dto.definitions
          ? {
              create: dto.definitions.map((d) => ({
                definition: d.definition,
              })),
            }
          : undefined,
        exampleSentences: dto.exampleSentences
          ? {
              create: dto.exampleSentences.map((e) => ({
                sentence: e.sentence,
              })),
            }
          : undefined,
      },
      include: {
        definitions: true,
        exampleSentences: true,
      },
    });

    return word as WordResponseDto;
  }

  /**
   * Update a word by ID
   */
  async update(id: string, dto: UpdateWordDto): Promise<WordResponseDto> {
    // Check if word exists
    const existing = await this.prisma.word.findUnique({
      where: { id },
      select: { id: true, word: true },
    });

    if (!existing) {
      throw new NotFoundException('Word not found');
    }

    // If updating word text, check for duplicates
    if (dto.word) {
      const normalizedWord = dto.word.toLowerCase().trim();
      if (normalizedWord !== existing.word) {
        const duplicate = await this.prisma.word.findUnique({
          where: { word: normalizedWord },
        });
        if (duplicate) {
          throw new ConflictException(`Word "${normalizedWord}" already exists`);
        }
        dto.word = normalizedWord;
      }
    }

    const updated = await this.prisma.word.update({
      where: { id },
      data: dto,
      include: {
        definitions: true,
        exampleSentences: true,
      },
    });

    return updated as WordResponseDto;
  }

  /**
   * Delete a word by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    // Check if word exists
    const existing = await this.prisma.word.findUnique({
      where: { id },
      select: { id: true, word: true },
    });

    if (!existing) {
      throw new NotFoundException('Word not found');
    }

    // Cascade delete will remove definitions and examples
    await this.prisma.word.delete({ where: { id } });

    return { message: 'Word deleted successfully' };
  }

  /**
   * Add a definition to an existing word
   */
  async addDefinition(
    wordId: string,
    definition: string,
  ): Promise<WordResponseDto> {
    // Check if word exists
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    await this.prisma.wordDefinition.create({
      data: {
        wordId,
        definition,
      },
    });

    return this.findOne(wordId, 'definitions,examples');
  }

  /**
   * Add an example sentence to an existing word
   */
  async addExample(wordId: string, sentence: string): Promise<WordResponseDto> {
    // Check if word exists
    const word = await this.prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    await this.prisma.exampleSentence.create({
      data: {
        wordId,
        sentence,
      },
    });

    return this.findOne(wordId, 'definitions,examples');
  }
}
