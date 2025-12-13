import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum StudentLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export class UpdateStudentDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Current learning level',
    example: 'INTERMEDIATE',
    enum: StudentLevel,
    required: false,
  })
  @IsEnum(StudentLevel, {
    message: 'currentLevel must be BEGINNER, INTERMEDIATE, or ADVANCED',
  })
  @IsOptional()
  currentLevel?: StudentLevel;
}
