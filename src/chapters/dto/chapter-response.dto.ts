import { ApiProperty } from '@nestjs/swagger';
import type { PaginationMeta } from '../../common/utils/pagination.util';

export class ChapterResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ example: 'clx0987654321' })
  contentId: string;

  @ApiProperty({ example: 1 })
  chapterNumber: number;

  @ApiProperty({ example: 'Chapter 1: The Beginning' })
  title: string;

  @ApiProperty({ example: 'In my younger and more vulnerable years...', nullable: true })
  content: string | null;

  @ApiProperty({ example: 5000 })
  wordCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedChaptersResponseDto {
  @ApiProperty({ type: [ChapterResponseDto] })
  data: ChapterResponseDto[];

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
