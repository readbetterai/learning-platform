import { ApiProperty } from '@nestjs/swagger';
import type { PaginationMeta } from '../../common/utils/pagination.util';

export class DefinitionResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'clx0987654321' })
  wordId: string;

  @ApiProperty({ example: 'Fluent or persuasive in speaking or writing' })
  definition: string;
}

export class ExampleSentenceResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'clx0987654321' })
  wordId: string;

  @ApiProperty({ example: 'She gave an eloquent speech at the conference.' })
  sentence: string;
}

export class WordResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'eloquent' })
  word: string;

  @ApiProperty({ example: 65 })
  difficultyScore: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [DefinitionResponseDto], required: false })
  definitions?: DefinitionResponseDto[];

  @ApiProperty({ type: [ExampleSentenceResponseDto], required: false })
  exampleSentences?: ExampleSentenceResponseDto[];
}

export class PaginatedWordsResponseDto {
  @ApiProperty({ type: [WordResponseDto] })
  data: WordResponseDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total: { type: 'number', example: 100 },
      totalPages: { type: 'number', example: 5 },
    },
  })
  meta: PaginationMeta;
}
