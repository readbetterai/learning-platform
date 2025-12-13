import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StudentLevel } from './update-student.dto';

export class QueryStudentsDto {
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
    default: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Search term (searches firstName, lastName, email, username)',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by current level',
    enum: StudentLevel,
    required: false,
  })
  @IsEnum(StudentLevel)
  @IsOptional()
  currentLevel?: StudentLevel;

  @ApiProperty({
    description: 'Sort by field',
    default: 'createdAt',
    enum: ['createdAt', 'firstName', 'lastName', 'email', 'currentLevel'],
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
}
