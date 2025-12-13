import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'teacher';
  jti?: string; // JWT ID for unique identification
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthenticatedUser> {
    // Check if email or username already exists (combined check to prevent enumeration)
    const [existingEmail, existingUsername] = await Promise.all([
      this.prisma.student.findUnique({ where: { email: dto.email } }),
      this.prisma.student.findUnique({ where: { username: dto.username } }),
    ]);

    if (existingEmail || existingUsername) {
      // Use generic message to prevent user enumeration
      throw new ConflictException(
        'Unable to create account. The email or username may already be in use.',
      );
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create student
    const student = await this.prisma.student.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return {
      id: student.id,
      email: student.email,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      role: 'student',
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    // Check student table first
    const student = await this.prisma.student.findUnique({
      where: { email },
    });

    if (student) {
      const isPasswordValid = await this.comparePasswords(
        password,
        student.password,
      );
      if (isPasswordValid) {
        return {
          id: student.id,
          email: student.email,
          username: student.username,
          firstName: student.firstName,
          lastName: student.lastName,
          role: 'student',
        };
      }
    }

    // Check teacher table if not found in student
    const teacher = await this.prisma.teacher.findUnique({
      where: { email },
    });

    if (teacher) {
      const isPasswordValid = await this.comparePasswords(
        password,
        teacher.password,
      );
      if (isPasswordValid) {
        return {
          id: teacher.id,
          email: teacher.email,
          username: teacher.username,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          role: 'teacher',
        };
      }
    }

    return null;
  }

  async login(dto: LoginDto, ipAddress?: string) {
    // Check for account lockout (5 failed attempts in 15 minutes)
    const lockoutWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const recentFailures = await this.prisma.loginAttempt.count({
      where: {
        email: dto.email,
        success: false,
        createdAt: { gte: lockoutWindow },
      },
    });

    if (recentFailures >= 5) {
      throw new ForbiddenException(
        'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.',
      );
    }

    const user = await this.validateUser(dto.email, dto.password);

    // Log the login attempt
    await this.prisma.loginAttempt.create({
      data: {
        email: dto.email,
        success: !!user,
        ipAddress,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    // Store refresh token in database
    await this.storeRefreshToken(tokens.refreshToken, user.id, user.role);

    return {
      ...tokens,
      user,
    };
  }

  async refreshTokens(refreshToken: string) {
    // Verify the token exists in database and is not revoked
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      // Verify the user still exists
      let user: AuthenticatedUser | null = null;

      if (payload.role === 'student') {
        const student = await this.prisma.student.findUnique({
          where: { id: payload.sub },
        });
        if (student) {
          user = {
            id: student.id,
            email: student.email,
            username: student.username,
            firstName: student.firstName,
            lastName: student.lastName,
            role: 'student',
          };
        }
      } else if (payload.role === 'teacher') {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: payload.sub },
        });
        if (teacher) {
          user = {
            id: teacher.id,
            email: teacher.email,
            username: teacher.username,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            role: 'teacher',
          };
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Revoke the old refresh token (token rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Store new refresh token
      await this.storeRefreshToken(tokens.refreshToken, user.id, user.role);

      return {
        ...tokens,
        user,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string, role: 'student' | 'teacher') {
    if (role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          currentLevel: true,
          createdAt: true,
        },
      });

      if (!student) {
        throw new UnauthorizedException('User not found');
      }

      return { ...student, role: 'student' };
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (!teacher) {
      throw new UnauthorizedException('User not found');
    }

    return { ...teacher, role: 'teacher' };
  }

  private async generateTokens(user: AuthenticatedUser) {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Add unique jti to refresh token to prevent duplicate token issues
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomUUID(), // Unique identifier ensures each refresh token is unique
    };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtSecret,
        expiresIn: '15m', // Reduced from 7d to 15 minutes for security
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: '7d', // Reduced from 30d to 7 days for security
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Store refresh token in database for tracking and revocation
   */
  private async storeRefreshToken(
    token: string,
    userId: string,
    userType: 'student' | 'teacher',
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        userType,
        expiresAt,
      },
    });
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(
    userId: string,
    userType: 'student' | 'teacher',
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        userType,
        revoked: false,
      },
      data: { revoked: true },
    });
  }

  // TODO: Set up a scheduled task (e.g., @nestjs/schedule) to call
  // cleanupExpiredTokens() and cleanupOldLoginAttempts() periodically (e.g., daily)

  /**
   * Clean up expired tokens (can be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }],
      },
    });
    return result.count;
  }

  /**
   * Clean up old login attempts (can be run as a cron job)
   */
  async cleanupOldLoginAttempts(): Promise<number> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const result = await this.prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12); // Increased from 10 to 12 rounds for better security
  }

  private async comparePasswords(
    plainText: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
