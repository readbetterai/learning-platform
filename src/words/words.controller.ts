import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { WordsService } from './words.service';
import {
  CreateWordDto,
  UpdateWordDto,
  QueryWordsDto,
  WordResponseDto,
  PaginatedWordsResponseDto,
  CreateDefinitionDto,
  CreateExampleSentenceDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Words')
@Controller('words')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all words with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Words list retrieved successfully',
    type: PaginatedWordsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  findAll(@Query() query: QueryWordsDto) {
    return this.wordsService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get word by ID' })
  @ApiParam({
    name: 'id',
    description: 'Word ID',
    example: 'clx1234567890',
  })
  @ApiQuery({
    name: 'include',
    description: 'Include related entities (comma-separated: definitions, examples)',
    required: false,
    example: 'definitions,examples',
  })
  @ApiResponse({
    status: 200,
    description: 'Word found',
    type: WordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Word not found',
  })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    return this.wordsService.findOne(id, include);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Create new word with definitions and examples (teacher only)' })
  @ApiResponse({
    status: 201,
    description: 'Word created successfully',
    type: WordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - word already exists',
  })
  create(@Body() dto: CreateWordDto) {
    return this.wordsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Update word (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Word ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Word updated successfully',
    type: WordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  @ApiResponse({
    status: 404,
    description: 'Word not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - word already exists',
  })
  update(@Param('id') id: string, @Body() dto: UpdateWordDto) {
    return this.wordsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete word (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Word ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Word deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Word deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  @ApiResponse({
    status: 404,
    description: 'Word not found',
  })
  remove(@Param('id') id: string) {
    return this.wordsService.remove(id);
  }

  @Post(':id/definitions')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Add definition to word (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Word ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 201,
    description: 'Definition added successfully',
    type: WordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  @ApiResponse({
    status: 404,
    description: 'Word not found',
  })
  addDefinition(@Param('id') id: string, @Body() dto: CreateDefinitionDto) {
    return this.wordsService.addDefinition(id, dto.definition);
  }

  @Post(':id/examples')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Add example sentence to word (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Word ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 201,
    description: 'Example sentence added successfully',
    type: WordResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  @ApiResponse({
    status: 404,
    description: 'Word not found',
  })
  addExample(@Param('id') id: string, @Body() dto: CreateExampleSentenceDto) {
    return this.wordsService.addExample(id, dto.sentence);
  }
}
