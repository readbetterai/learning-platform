import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { UpdateStudentDto, QueryStudentsDto } from './dto';
import {
  buildPaginatedResult,
  calculateSkip,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { StudentResponseDto } from './dto/student-response.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active students with pagination, search, and filtering
   * Only accessible by teachers
   */
  async findAll(
    query: QueryStudentsDto,
  ): Promise<PaginatedResult<StudentResponseDto>> {
    const { page = 1, limit = 10, search, currentLevel, sortBy, sortOrder } = query;

    // Build where clause
    const where: any = {
      isActive: true, // Only show active students
    };

    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by level
    if (currentLevel) {
      where.currentLevel = currentLevel;
    }

    // Get total count for pagination
    const total = await this.prisma.student.count({ where });

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch students
    const students = await this.prisma.student.findMany({
      where,
      skip: calculateSkip(page, limit),
      take: limit,
      orderBy,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        currentLevel: true,
        createdAt: true,
        updatedAt: true,
        // Never expose: password, isActive, deletedAt
      },
    });

    return buildPaginatedResult(
      students as StudentResponseDto[],
      total,
      { page, limit },
    );
  }

  /**
   * Get a single student by ID
   * Students can view their own profile
   * Teachers can view any student
   */
  async findOne(
    id: string,
    currentUser: CurrentUserPayload,
  ): Promise<StudentResponseDto> {
    // Authorization check
    if (currentUser.role === 'student' && currentUser.userId !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        currentLevel: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Don't show soft-deleted students (except to themselves for recovery info)
    if (!student.isActive && currentUser.role !== 'student') {
      throw new NotFoundException('Student not found');
    }

    // Remove isActive from response
    const { isActive, ...studentResponse } = student;
    return studentResponse as StudentResponseDto;
  }

  /**
   * Update student profile
   * Students can only update their own profile
   */
  async update(
    id: string,
    dto: UpdateStudentDto,
    currentUser: CurrentUserPayload,
  ): Promise<StudentResponseDto> {
    // Only students can update profiles, and only their own
    if (currentUser.role !== 'student') {
      throw new ForbiddenException('Only students can update profiles');
    }

    if (currentUser.userId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Check if student exists and is active
    const existingStudent = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existingStudent) {
      throw new NotFoundException('Student not found');
    }

    if (!existingStudent.isActive) {
      throw new ForbiddenException('Cannot update deactivated account');
    }

    // Update student
    const updated = await this.prisma.student.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        currentLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated as StudentResponseDto;
  }

  /**
   * Soft delete a student
   * Only teachers can delete students
   */
  async softDelete(id: string): Promise<{ message: string }> {
    // Check if student exists
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true, isActive: true, email: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.isActive) {
      throw new NotFoundException('Student already deleted');
    }

    // Soft delete
    await this.prisma.student.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'Student deleted successfully' };
  }
}
