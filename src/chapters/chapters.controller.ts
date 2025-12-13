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
import { ChaptersService } from './chapters.service';
import {
  CreateChapterDto,
  UpdateChapterDto,
  QueryChaptersDto,
  ChapterResponseDto,
  PaginatedChaptersResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Chapters')
@Controller('chapters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all chapters with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Chapters list retrieved successfully',
    type: PaginatedChaptersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  findAll(@Query() query: QueryChaptersDto) {
    return this.chaptersService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get chapter by ID' })
  @ApiParam({
    name: 'id',
    description: 'Chapter ID',
    example: 'clx1234567890',
  })
  @ApiQuery({
    name: 'include',
    description: 'Include related entities (comma-separated: sentences)',
    required: false,
    example: 'sentences',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter found',
    type: ChapterResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found',
  })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    return this.chaptersService.findOne(id, include);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Create new chapter (teacher only)' })
  @ApiResponse({
    status: 201,
    description: 'Chapter created successfully',
    type: ChapterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - content not found or duplicate chapter number',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Update chapter (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Chapter ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter updated successfully',
    type: ChapterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - duplicate chapter number',
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
    description: 'Chapter not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete chapter (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Chapter ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Chapter deleted successfully',
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
    description: 'Chapter not found',
  })
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }
}
