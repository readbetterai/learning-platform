import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Verify the user still exists in the database
    if (payload.role === 'student') {
      const student = await this.prisma.student.findUnique({
        where: { id: payload.sub },
      });
      if (!student) {
        throw new UnauthorizedException('User not found');
      }
    } else if (payload.role === 'teacher') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: payload.sub },
      });
      if (!teacher) {
        throw new UnauthorizedException('User not found');
      }
    }

    // Return the payload which will be attached to request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
