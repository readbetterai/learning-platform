import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set high throttle limits for testing
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '10000';

describe('StudentsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let studentAccessToken: string;
  let teacherAccessToken: string;
  let testStudentId: string;

  const testStudent = {
    email: `e2e-student-${Date.now()}@example.com`,
    username: `student${Date.now()}`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Student',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Register a test student and get token
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testStudent);

    studentAccessToken = registerRes.body.accessToken;
    testStudentId = registerRes.body.user.id;

    // Login as teacher (using seeded teacher account)
    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher@test.com',
        password: 'password123',
      });

    teacherAccessToken = teacherRes.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test student
    if (testStudentId) {
      await prisma.refreshToken.deleteMany({
        where: { userId: testStudentId },
      });
      await prisma.loginAttempt.deleteMany({
        where: { email: testStudent.email },
      });
      await prisma.student.delete({
        where: { id: testStudentId },
      }).catch(() => {});
    }
    await app.close();
  });

  describe('GET /api/v1/students', () => {
    it('should return paginated students for teacher', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('total');
        });
    });

    it('should return 403 for student trying to list all students', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(403);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .expect(401);
    });

    it('should filter students by search term', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .query({ search: 'Test' })
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/students/:id', () => {
    it('should return student for owner', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testStudentId);
          expect(res.body.email).toBe(testStudent.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return student for teacher', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testStudentId);
        });
    });

    it('should return 403 when student tries to view another student', async () => {
      // Get another student ID from the database
      const anotherStudent = await prisma.student.findFirst({
        where: { id: { not: testStudentId } },
      });

      if (anotherStudent) {
        return request(app.getHttpServer())
          .get(`/api/v1/students/${anotherStudent.id}`)
          .set('Authorization', `Bearer ${studentAccessToken}`)
          .expect(403);
      }
    });

    it('should return 404 for non-existent student', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students/nonexistent-id')
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/students/:id', () => {
    it('should update own profile', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({ firstName: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
        });
    });

    it('should update currentLevel', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({ currentLevel: 'INTERMEDIATE' })
        .expect(200)
        .expect((res) => {
          expect(res.body.currentLevel).toBe('INTERMEDIATE');
        });
    });

    it('should return 403 when teacher tries to update student', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .send({ firstName: 'TeacherUpdate' })
        .expect(403);
    });

    it('should return 403 when student tries to update another student', async () => {
      const anotherStudent = await prisma.student.findFirst({
        where: { id: { not: testStudentId } },
      });

      if (anotherStudent) {
        return request(app.getHttpServer())
          .patch(`/api/v1/students/${anotherStudent.id}`)
          .set('Authorization', `Bearer ${studentAccessToken}`)
          .send({ firstName: 'Hacker' })
          .expect(403);
      }
    });

    it('should reject invalid currentLevel', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({ currentLevel: 'INVALID' })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    let studentToDelete: any;
    let deleteToken: string;

    beforeAll(async () => {
      // Create a student specifically for deletion test
      const deleteStudent = {
        email: `e2e-delete-${Date.now()}@example.com`,
        username: `delete${Date.now()}`,
        password: 'SecurePass123!',
        firstName: 'Delete',
        lastName: 'Me',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(deleteStudent);

      studentToDelete = res.body.user;
      deleteToken = res.body.accessToken;
    });

    afterAll(async () => {
      // Clean up the student if still exists
      if (studentToDelete?.id) {
        await prisma.refreshToken.deleteMany({
          where: { userId: studentToDelete.id },
        });
        await prisma.student.delete({
          where: { id: studentToDelete.id },
        }).catch(() => {});
      }
    });

    it('should return 403 when student tries to delete', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${studentToDelete.id}`)
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(403);
    });

    it('should soft delete student as teacher', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${studentToDelete.id}`)
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Student deleted successfully');
        });
    });

    it('should return 404 when deleting already deleted student', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${studentToDelete.id}`)
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent student', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/students/nonexistent-id')
        .set('Authorization', `Bearer ${teacherAccessToken}`)
        .expect(404);
    });
  });
});
