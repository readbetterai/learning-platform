import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDefinitionDto {
  @ApiProperty({
    description: 'Definition text',
    example: 'Fluent or persuasive in speaking or writing',
  })
  @IsString()
  definition: string;
}

export class CreateExampleSentenceDto {
  @ApiProperty({
    description: 'Example sentence',
    example: 'She gave an eloquent speech at the conference.',
  })
  @IsString()
  sentence: string;
}

export class CreateWordDto {
  @ApiProperty({
    description: 'The word (stored in lowercase)',
    example: 'eloquent',
  })
  @IsString()
  word: string;

  @ApiProperty({
    description: 'Difficulty score (1-100)',
    minimum: 1,
    maximum: 100,
    example: 65,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  difficultyScore: number;

  @ApiProperty({
    description: 'Word definitions',
    type: [CreateDefinitionDto],
    required: false,
    example: [{ definition: 'Fluent or persuasive in speaking or writing' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDefinitionDto)
  @ArrayMinSize(1)
  @IsOptional()
  definitions?: CreateDefinitionDto[];

  @ApiProperty({
    description: 'Example sentences for the word',
    type: [CreateExampleSentenceDto],
    required: false,
    example: [{ sentence: 'She gave an eloquent speech at the conference.' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExampleSentenceDto)
  @IsOptional()
  exampleSentences?: CreateExampleSentenceDto[];
}
