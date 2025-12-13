import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from './create-content.dto';

export class QueryContentDto {
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
    description: 'Search term (searches title and author)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by content type',
    enum: ContentType,
    required: false,
  })
  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @ApiProperty({
    description: 'Filter by difficulty (returns items within +/- 10 of this value)',
    required: false,
    example: 50,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  difficulty?: number;

  @ApiProperty({
    description: 'Sort by field',
    default: 'createdAt',
    enum: ['createdAt', 'title', 'author', 'publishedYear', 'averageDifficulty'],
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    default: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Include related entities (comma-separated: chapters)',
    required: false,
    example: 'chapters',
  })
  @IsString()
  @IsOptional()
  include?: string;
}
