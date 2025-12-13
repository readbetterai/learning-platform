import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';

export enum ContentType {
  BOOK = 'BOOK',
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST',
}

export class CreateContentDto {
  @ApiProperty({
    description: 'Type of content',
    enum: ContentType,
    example: ContentType.BOOK,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    description: 'Title of the content',
    example: 'The Great Gatsby',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Author of the content',
    example: 'F. Scott Fitzgerald',
  })
  @IsString()
  author: string;

  @ApiProperty({
    description: 'Description of the content',
    required: false,
    example: 'A classic American novel about the Jazz Age',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ISBN (for books only)',
    required: false,
    example: '978-0743273565',
  })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({
    description: 'Year of publication',
    required: false,
    example: 1925,
  })
  @IsInt()
  @IsOptional()
  publishedYear?: number;

  @ApiProperty({
    description: 'URL to cover image',
    required: false,
    example: 'https://example.com/cover.jpg',
  })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Average difficulty score (1-100)',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  averageDifficulty?: number;

  @ApiProperty({
    description: 'Type-specific metadata (sourceUrl, duration, etc.)',
    required: false,
    example: { sourceUrl: 'https://example.com/article', duration: 300 },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
