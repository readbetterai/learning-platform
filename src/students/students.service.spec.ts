import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

describe('StudentsService', () => {
  let service: StudentsService;
  let prismaService: PrismaService;

  const mockStudent = {
    id: 'student-id-123',
    email: 'student@test.com',
    username: 'teststudent',
    password: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'Student',
    currentLevel: 'BEGINNER',
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockStudentResponse = {
    id: 'student-id-123',
    email: 'student@test.com',
    username: 'teststudent',
    firstName: 'Test',
    lastName: 'Student',
    currentLevel: 'BEGINNER',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const studentUser: CurrentUserPayload = {
    userId: 'student-id-123',
    email: 'student@test.com',
    role: 'student',
  };

  const otherStudentUser: CurrentUserPayload = {
    userId: 'other-student-id',
    email: 'other@test.com',
    role: 'student',
  };

  const teacherUser: CurrentUserPayload = {
    userId: 'teacher-id-123',
    email: 'teacher@test.com',
    role: 'teacher',
  };

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const students = [mockStudentResponse];
      mockPrismaService.student.count.mockResolvedValue(1);
      mockPrismaService.student.findMany.mockResolvedValue(students);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(students);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.student.count.mockResolvedValue(0);
      mockPrismaService.student.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 10, search: 'john' });

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
              { username: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter by currentLevel', async () => {
      mockPrismaService.student.count.mockResolvedValue(0);
      mockPrismaService.student.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 10, currentLevel: 'ADVANCED' as any });

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentLevel: 'ADVANCED',
          }),
        }),
      );
    });

    it('should only return active students', async () => {
      mockPrismaService.student.count.mockResolvedValue(0);
      mockPrismaService.student.findMany.mockResolvedValue([]);

      await service.findAll({ page: 1, limit: 10 });

      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return student for owner', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudentResponse,
        isActive: true,
      });

      const result = await service.findOne('student-id-123', studentUser);

      expect(result).toEqual(mockStudentResponse);
    });

    it('should return student for teacher', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudentResponse,
        isActive: true,
      });

      const result = await service.findOne('student-id-123', teacherUser);

      expect(result).toEqual(mockStudentResponse);
    });

    it('should throw ForbiddenException for other students', async () => {
      await expect(
        service.findOne('student-id-123', otherStudentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-id', teacherUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for soft-deleted student (teacher viewing)', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudentResponse,
        isActive: false,
      });

      await expect(
        service.findOne('student-id-123', teacherUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update own profile', async () => {
      const updateDto = { firstName: 'Updated' };
      const updatedStudent = { ...mockStudentResponse, firstName: 'Updated' };

      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-id-123',
        isActive: true,
      });
      mockPrismaService.student.update.mockResolvedValue(updatedStudent);

      const result = await service.update('student-id-123', updateDto, studentUser);

      expect(result.firstName).toBe('Updated');
      expect(mockPrismaService.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-id-123' },
          data: updateDto,
        }),
      );
    });

    it('should throw ForbiddenException for other students', async () => {
      await expect(
        service.update('student-id-123', { firstName: 'Updated' }, otherStudentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for teacher', async () => {
      await expect(
        service.update('student-id-123', { firstName: 'Updated' }, teacherUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { firstName: 'Updated' }, {
          userId: 'invalid-id',
          email: 'test@test.com',
          role: 'student',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for deactivated account', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-id-123',
        isActive: false,
      });

      await expect(
        service.update('student-id-123', { firstName: 'Updated' }, studentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-id-123',
        isActive: true,
        email: 'student@test.com',
      });
      mockPrismaService.student.update.mockResolvedValue({});

      const result = await service.softDelete('student-id-123');

      expect(result.message).toBe('Student deleted successfully');
      expect(mockPrismaService.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-id-123' },
          data: expect.objectContaining({
            isActive: false,
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw NotFoundException for invalid ID', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for already deleted student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-id-123',
        isActive: false,
        email: 'student@test.com',
      });

      await expect(service.softDelete('student-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
