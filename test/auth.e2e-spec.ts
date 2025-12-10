import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Set high throttle limits for testing
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '10000';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testStudent = {
    email: `e2e-test-${Date.now()}@example.com`,
    username: `e2etest${Date.now()}`,
    password: 'SecurePass123!', // Updated to meet stronger password requirements
    firstName: 'E2E',
    lastName: 'Test',
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

    // Clean up any existing test data from previous runs
    await prisma.loginAttempt.deleteMany({
      where: { email: { contains: 'e2e-test' } },
    });
    await prisma.loginAttempt.deleteMany({
      where: { email: 'teacher@test.com' },
    });
  });

  afterAll(async () => {
    // Clean up test data
    const student = await prisma.student.findUnique({
      where: { email: testStudent.email },
    });
    if (student) {
      // Clean up refresh tokens and login attempts first
      await prisma.refreshToken.deleteMany({
        where: { userId: student.id },
      });
      await prisma.loginAttempt.deleteMany({
        where: { email: testStudent.email },
      });
      await prisma.student.delete({
        where: { id: student.id },
      });
    }
    await app.close();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new student', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testStudent)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testStudent.email);
          expect(res.body.user.role).toBe('student');
        });
    });

    it('should fail to register with existing email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testStudent)
        .expect(409);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: 'invalid-email',
          username: 'uniqueuser',
        })
        .expect(400);
    });

    it('should fail with weak password (no uppercase, number, special char)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: 'another@example.com',
          username: 'anotheruser',
          password: 'weakpassword', // Missing uppercase, number, special char
        })
        .expect(400);
    });

    it('should fail with password missing special character', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testStudent,
          email: 'another2@example.com',
          username: 'anotheruser2',
          password: 'Password123', // Missing special char
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testStudent.email);
        });
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      // Clean up any previous login attempts for this email to avoid lockout
      await prisma.loginAttempt.deleteMany({
        where: { email: 'nonexistent@example.com' },
      });

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      accessToken = response.body.accessToken;
    });

    it('should return profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testStudent.email);
          expect(res.body.role).toBe('student');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      refreshToken = response.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Teacher login', () => {
    it('should login existing teacher from seed data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'teacher@test.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user.role).toBe('teacher');
        });
    });
  });

  describe('/api/v1/auth/logout (POST)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should logout and invalidate refresh token', async () => {
      // First, logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successfully');
        });

      // Verify the refresh token is now invalid
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);
    });
  });

  describe('/api/v1/auth/logout-all (POST)', () => {
    let accessToken: string;
    let refreshToken1: string;
    let refreshToken2: string;

    beforeAll(async () => {
      // Login twice to get two refresh tokens
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      accessToken = response1.body.accessToken;
      refreshToken1 = response1.body.refreshToken;

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      refreshToken2 = response2.body.refreshToken;
    });

    it('should logout from all devices and invalidate all refresh tokens', async () => {
      // Logout from all devices
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('all devices');
        });

      // Verify both refresh tokens are now invalid
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(401);
    });
  });

  describe('Token rotation on refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });
      refreshToken = response.body.refreshToken;
    });

    it('should invalidate old refresh token after rotation', async () => {
      const oldRefreshToken = refreshToken;

      // Get new tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken);

      // Old token should no longer work
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    });
  });
});
