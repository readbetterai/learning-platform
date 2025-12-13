import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

// For updates, we only allow updating basic fields
// Definitions and examples are managed separately
export class UpdateWordDto {
  @ApiProperty({
    description: 'The word (stored in lowercase)',
    required: false,
    example: 'eloquent',
  })
  @IsString()
  @IsOptional()
  word?: string;

  @ApiProperty({
    description: 'Difficulty score (1-100)',
    minimum: 1,
    maximum: 100,
    required: false,
    example: 65,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  difficultyScore?: number;
}
