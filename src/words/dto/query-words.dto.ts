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

export class QueryWordsDto {
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
    description: 'Search term (searches word)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

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
    description: 'Minimum difficulty score',
    required: false,
    example: 40,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  minDifficulty?: number;

  @ApiProperty({
    description: 'Maximum difficulty score',
    required: false,
    example: 60,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxDifficulty?: number;

  @ApiProperty({
    description: 'Sort by field',
    default: 'word',
    enum: ['word', 'difficultyScore', 'createdAt'],
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'word';

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
    description: 'Include related entities (comma-separated: definitions, examples)',
    required: false,
    example: 'definitions,examples',
  })
  @IsString()
  @IsOptional()
  include?: string;
}
