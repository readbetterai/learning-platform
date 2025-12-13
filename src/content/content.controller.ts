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
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  ContentResponseDto,
  PaginatedContentResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Content')
@Controller('content')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all content with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Content list retrieved successfully',
    type: PaginatedContentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({
    name: 'id',
    description: 'Content ID',
    example: 'clx1234567890',
  })
  @ApiQuery({
    name: 'include',
    description: 'Include related entities (comma-separated: chapters)',
    required: false,
    example: 'chapters',
  })
  @ApiResponse({
    status: 200,
    description: 'Content found',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Content not found',
  })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    return this.contentService.findOne(id, include);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Create new content (teacher only)' })
  @ApiResponse({
    status: 201,
    description: 'Content created successfully',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  create(@Body() dto: CreateContentDto) {
    return this.contentService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Update content (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Content ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Content updated successfully',
    type: ContentResponseDto,
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
    description: 'Content not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete content (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Content ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Content deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Content deleted successfully',
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
    description: 'Content not found',
  })
  remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }
}
