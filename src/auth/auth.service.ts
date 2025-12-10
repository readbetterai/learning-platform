import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'teacher';
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
    // Check if email already exists
    const existingEmail = await this.prisma.student.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.student.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
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

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  async refreshTokens(refreshToken: string) {
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

      const tokens = await this.generateTokens(user);

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
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '30d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePasswords(
    plainText: string,
    hashed: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
