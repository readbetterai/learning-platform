import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({
    description: 'Content ID this chapter belongs to',
    example: 'clx1234567890',
  })
  @IsString()
  contentId: string;

  @ApiProperty({
    description: 'Chapter number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  chapterNumber: number;

  @ApiProperty({
    description: 'Chapter title',
    example: 'Chapter 1: The Beginning',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Full chapter text content',
    required: false,
    example: 'In my younger and more vulnerable years...',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Word count of the chapter',
    required: false,
    default: 0,
    example: 5000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  wordCount?: number = 0;
}
