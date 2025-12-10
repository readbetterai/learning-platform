import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
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
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    loginAttempt: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
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
      password: 'SecurePass123!',
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

    it('should throw ConflictException with generic message if email already exists', async () => {
      // Both checks run in parallel now, so mock both
      mockPrismaService.student.findUnique
        .mockResolvedValueOnce(mockStudent) // email check - found
        .mockResolvedValueOnce(null); // username check

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException with generic message if username already exists', async () => {
      mockPrismaService.student.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockStudent); // username check - found

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
    beforeEach(() => {
      // Default: no lockout (0 failed attempts)
      mockPrismaService.loginAttempt.count.mockResolvedValue(0);
      mockPrismaService.loginAttempt.create.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});
    });

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
      // Verify login attempt was logged
      expect(mockPrismaService.loginAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'student@test.com',
          success: true,
        }),
      });
      // Verify refresh token was stored
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
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

      // Verify failed login attempt was logged
      expect(mockPrismaService.loginAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'unknown@test.com',
          success: false,
        }),
      });
    });

    it('should throw ForbiddenException when account is locked out', async () => {
      // Simulate 5 failed attempts in the last 15 minutes
      mockPrismaService.loginAttempt.count.mockResolvedValue(5);

      await expect(
        service.login({
          email: 'student@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.login({
          email: 'student@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(/Account temporarily locked/);
    });
  });

  describe('refreshTokens', () => {
    const mockStoredToken = {
      id: 'token-id-123',
      token: 'valid-refresh-token',
      userId: 'student-id-123',
      userType: 'student',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      revoked: false,
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.refreshToken.update.mockResolvedValue({});
    });

    it('should return new tokens on valid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockStoredToken,
      );
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
      // Verify old token was revoked (rotation)
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockStoredToken.id },
        data: { revoked: true },
      });
      // Verify new token was stored
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token not found in database', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('unknown-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens('unknown-refresh-token'),
      ).rejects.toThrow(/Invalid or revoked/);
    });

    it('should throw UnauthorizedException if token is revoked', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        revoked: true,
      });

      await expect(
        service.refreshTokens('revoked-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired in database', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...mockStoredToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      await expect(
        service.refreshTokens('expired-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens('expired-refresh-token'),
      ).rejects.toThrow(/expired/);
    });

    it('should throw UnauthorizedException on invalid JWT signature', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockStoredToken,
      );
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.refreshTokens('tampered-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockStoredToken,
      );
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

  describe('revokeRefreshToken', () => {
    it('should revoke a specific refresh token', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken('token-to-revoke');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'token-to-revoke' },
        data: { revoked: true },
      });
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all refresh tokens for a user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserTokens('student-id-123', 'student');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'student-id-123',
          userType: 'student',
          revoked: false,
        },
        data: { revoked: true },
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('cleanupOldLoginAttempts', () => {
    it('should delete login attempts older than 24 hours', async () => {
      mockPrismaService.loginAttempt.deleteMany.mockResolvedValue({ count: 10 });

      const result = await service.cleanupOldLoginAttempts();

      expect(result).toBe(10);
      expect(mockPrismaService.loginAttempt.deleteMany).toHaveBeenCalled();
    });
  });
});
