import {
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { StudentsService } from './students.service';
import {
  UpdateStudentDto,
  QueryStudentsDto,
  StudentResponseDto,
  PaginatedStudentsResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get all students (teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'List of students retrieved successfully',
    type: PaginatedStudentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teachers only',
  })
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get student by ID (self or teacher)' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Student found',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only access own profile (students)',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.studentsService.findOne(id, user);
  }

  @Patch(':id')
  @SkipThrottle()
  @ApiOperation({ summary: 'Update student profile (self only)' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
    type: StudentResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.studentsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @ApiOperation({ summary: 'Soft delete student (teacher only)' })
  @ApiParam({
    name: 'id',
    description: 'Student ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Student deleted successfully',
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
    description: 'Student not found',
  })
  remove(@Param('id') id: string) {
    return this.studentsService.softDelete(id);
  }
}
