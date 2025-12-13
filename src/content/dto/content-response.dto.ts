import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from './create-content.dto';
import type { PaginationMeta } from '../../common/utils/pagination.util';

export class ContentResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id: string;

  @ApiProperty({ enum: ContentType, example: ContentType.BOOK })
  contentType: ContentType;

  @ApiProperty({ example: 'The Great Gatsby' })
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  author: string;

  @ApiProperty({ example: 'A classic American novel', nullable: true })
  description: string | null;

  @ApiProperty({ example: '978-0743273565', nullable: true })
  isbn: string | null;

  @ApiProperty({ example: 1925, nullable: true })
  publishedYear: number | null;

  @ApiProperty({ example: 'https://example.com/cover.jpg', nullable: true })
  coverImageUrl: string | null;

  @ApiProperty({ example: 50, nullable: true })
  averageDifficulty: number | null;

  @ApiProperty({ example: { sourceUrl: 'https://example.com' }, nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedContentResponseDto {
  @ApiProperty({ type: [ContentResponseDto] })
  data: ContentResponseDto[];

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
