import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryChaptersDto {
  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by content ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  contentId?: string;

  @ApiProperty({
    description: 'Search term (searches title)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sort by field',
    default: 'chapterNumber',
    enum: ['chapterNumber', 'title', 'createdAt', 'wordCount'],
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'chapterNumber';

  @ApiProperty({
    description: 'Sort order',
    default: 'asc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiProperty({
    description: 'Include related entities (comma-separated: sentences)',
    required: false,
    example: 'sentences',
  })
  @IsString()
  @IsOptional()
  include?: string;
}
