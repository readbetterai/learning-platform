import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockStudent = {
    id: 'student-id-123',
    email: 'student@test.com',
    username: 'teststudent',
    password: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'Student',
    currentLevel: 'BEGINNER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeacher = {
    id: 'teacher-id-123',
    email: 'teacher@test.com',
    username: 'testteacher',
    password: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'Teacher',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '7d',
        'jwt.refreshExpiresIn': '30d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newstudent@test.com',
      username: 'newstudent',
      password: 'password123',
      firstName: 'New',
      lastName: 'Student',
    };

    it('should successfully register a new student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue({
        id: 'new-student-id',
        ...registerDto,
        password: 'hashed-password',
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: 'new-student-id',
        email: registerDto.email,
        username: registerDto.username,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'student',
      });
      expect(mockPrismaService.student.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.student.findUnique.mockResolvedValueOnce(mockStudent);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.student.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockStudent); // username check

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return student user if valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudent,
        password: hashedPassword,
      });

      const result = await service.validateUser(
        'student@test.com',
        'password123',
      );

      expect(result).toEqual({
        id: mockStudent.id,
        email: mockStudent.email,
        username: mockStudent.username,
        firstName: mockStudent.firstName,
        lastName: mockStudent.lastName,
        role: 'student',
      });
    });

    it('should return teacher user if valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      mockPrismaService.teacher.findUnique.mockResolvedValue({
        ...mockTeacher,
        password: hashedPassword,
      });

      const result = await service.validateUser(
        'teacher@test.com',
        'password123',
      );

      expect(result).toEqual({
        id: mockTeacher.id,
        email: mockTeacher.email,
        username: mockTeacher.username,
        firstName: mockTeacher.firstName,
        lastName: mockTeacher.lastName,
        role: 'teacher',
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'unknown@test.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudent,
        password: hashedPassword,
      });

      const result = await service.validateUser(
        'student@test.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudent,
        password: hashedPassword,
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'student@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: mockStudent.id,
          email: mockStudent.email,
          username: mockStudent.username,
          firstName: mockStudent.firstName,
          lastName: mockStudent.lastName,
          role: 'student',
        },
      });
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens on valid refresh token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'student-id-123',
        email: 'student@test.com',
        role: 'student',
      });
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.refreshTokens('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'deleted-user-id',
        email: 'deleted@test.com',
        role: 'student',
      });
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return student profile', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getProfile('student-id-123', 'student');

      expect(result).toMatchObject({
        id: mockStudent.id,
        email: mockStudent.email,
        role: 'student',
      });
    });

    it('should return teacher profile', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue(mockTeacher);

      const result = await service.getProfile('teacher-id-123', 'teacher');

      expect(result).toMatchObject({
        id: mockTeacher.id,
        email: mockTeacher.email,
        role: 'teacher',
      });
    });

    it('should throw UnauthorizedException if student not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.getProfile('unknown-id', 'student'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
