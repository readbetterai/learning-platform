import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  // Rate limiting applied via global ThrottlerModule - uses env config
  @ApiOperation({ summary: 'Register a new student account' })
  @ApiResponse({
    status: 201,
    description: 'Student registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts',
  })
  async register(@Body() dto: RegisterDto, @Ip() ipAddress: string) {
    const user = await this.authService.register(dto);
    const result = await this.authService.login(
      { email: dto.email, password: dto.password },
      ipAddress,
    );
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Rate limiting applied via global ThrottlerModule - uses env config
  // Additional protection via account lockout after 5 failed attempts
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 403,
    description: 'Account temporarily locked',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
  })
  async login(@Body() dto: LoginDto, @Ip() ipAddress: string) {
    return this.authService.login(dto, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // Rate limiting applied via global ThrottlerModule - uses env config
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many refresh attempts',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @SkipThrottle() // Profile endpoint doesn't need rate limiting for authenticated users
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.userId, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Logout doesn't need rate limiting for authenticated users
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'The refresh token to revoke',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.revokeRefreshToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Logout doesn't need rate limiting for authenticated users
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async logoutAll(@CurrentUser() user: CurrentUserPayload) {
    await this.authService.revokeAllUserTokens(user.userId, user.role);
    return { message: 'Logged out from all devices successfully' };
  }
}
