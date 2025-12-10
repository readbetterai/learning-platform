import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restricts access to users with specific roles.
 * Use with RolesGuard to enforce role-based access control.
 *
 * @param roles - The roles that are allowed to access the route
 *
 * @example
 * @Roles('teacher')
 * @Get('students')
 * getAllStudents() {
 *   return this.studentsService.findAll();
 * }
 *
 * @example
 * @Roles('student', 'teacher')
 * @Get('content')
 * getContent() {
 *   return this.contentService.findAll();
 * }
 */
export const Roles = (...roles: ('student' | 'teacher')[]) =>
  SetMetadata(ROLES_KEY, roles);
