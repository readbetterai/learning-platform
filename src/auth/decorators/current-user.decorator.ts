import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * The user object attached to the request by the JWT strategy.
 */
export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
}

/**
 * Extracts the current authenticated user from the request.
 * The user is attached by the JWT strategy after successful token validation.
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: CurrentUserPayload) {
 *   return this.authService.getProfile(user.userId, user.role);
 * }
 *
 * @example
 * // Get specific property
 * @Get('my-id')
 * getMyId(@CurrentUser('userId') userId: string) {
 *   return { userId };
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    return data ? user?.[data] : user;
  },
);
