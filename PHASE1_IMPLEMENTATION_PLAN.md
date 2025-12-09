# PHASE 1 IMPLEMENTATION PLAN
## English Learning Platform - REST API Foundation

**Duration**: 5-6 weeks (accelerated with NestJS)
**Stack**: Node.js + TypeScript + **NestJS** + Prisma + PostgreSQL + JWT
**Architecture**: Modular Monolith with DDD (4-layer architecture)
**API Style**: RESTful with OpenAPI/Swagger documentation

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Implementation Timeline](#implementation-timeline)
3. [Milestone Breakdown](#milestone-breakdown)
   - Milestone 0: Foundation (includes Task 0.6: Deployment Preparation)
   - Milestones 1-6: Core Features
   - Milestone 7: Testing Infrastructure
   - Milestone 7.5: CI/CD Setup
   - **Milestone 8: Production Deployment (NEW)**
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [API Endpoints Summary](#api-endpoints-summary)
7. [Testing Strategy](#testing-strategy)
8. [Potential Challenges](#potential-challenges)
9. [Development Workflow](#development-workflow)
10. [Why NestJS](#why-nestjs)
11. [Deployment Strategy](#deployment-strategy) (see Milestone 8)

---

## PROJECT OVERVIEW

### Goals
- Build production-ready REST API foundation
- Implement core learning platform features (vocabulary, quizzes, progress tracking)
- Establish clean architecture patterns that support future enhancements
- Achieve **80%+ test coverage** (upgraded from 70% with better testing tools)
- Create comprehensive API documentation

### Deliverables
- **~40 REST endpoints** fully documented
- **6 DDD modules**: Auth, Student, Content, Homework, Quiz, Progress
- **Comprehensive test suite**: Unit + Integration + E2E (80%+ coverage)
- **Auto-generated OpenAPI/Swagger** documentation at `/api-docs`
- **Security hardening**: JWT guards, rate limiting, input validation, CORS
- **Logging & monitoring**: Pino (high-performance structured logging with PII redaction)
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **Production Deployment**: Live API deployed to Railway/Render with monitoring
- **Foundation for Phase 2**: Architecture supports essay feedback system (see `ESSAY_FEEDBACK_FEATURE_PLAN.md`)

### Time Savings with NestJS
- **30-40% faster development** compared to Express
- Built-in validation, guards, interceptors, pipes
- Automatic Swagger documentation generation
- Superior testing utilities with dependency injection
- **Estimated completion: 5-6 weeks instead of 8 weeks**

---

## IMPLEMENTATION TIMELINE

### Week 1: Foundation
- **Milestone 0**: NestJS project setup, database, modules, middleware
  - Includes **Task 0.6**: Deployment preparation (health checks, configs)

### Week 2: Authentication
- **Milestone 1**: JWT auth with Passport, registration, login, guards

### Week 3: Core Entities
- **Milestone 2**: Student management
- **Milestone 3**: Content management (Content items: content/articles/videos/podcasts, Chapters, Words)

### Week 4: Workflows
- **Milestone 4**: Homework assignment system
- **Milestone 5**: Quiz generation and taking

### Week 5: Intelligence & Testing
- **Milestone 6**: Progress tracking with spaced repetition
- **Milestone 7**: Comprehensive testing infrastructure

### Week 5-6: CI/CD & Deployment Preparation
- **Milestone 7.5**: GitHub Actions workflows, deployment automation

### Week 6: Production Deployment
- **Milestone 8**: Deploy to production (Render/Railway)
  - Platform selection and setup (2-4 hours)
  - Database migration & seeding (1 hour)
  - Monitoring & logging setup (2 hours)
  - Documentation & team handoff (2 hours)
  - Production verification & testing (2 hours)
  - **Total**: 13-17 hours (can run in parallel with final testing)

---

## MILESTONE BREAKDOWN

### MILESTONE 0: Project Foundation & Setup (Week 1)

**STATUS: ✅ COMPLETED**

**Completion Date**: December 9, 2025

**Summary of Completed Work**:
- ✅ NestJS project initialized with TypeScript configuration
- ✅ All core dependencies installed (Prisma, JWT, validation, Swagger, security, logging)
- ✅ Development tooling configured (Prettier, ESLint, Jest)
- ✅ Environment configuration with `.env` and type-safe config module
- ✅ Pino logger configured with PII redaction and pretty-printing
- ✅ PostgreSQL 16 database setup with 21 tables (including essay feedback models)
- ✅ Prisma migrations applied successfully
- ✅ Application bootstrap configured with Swagger, validation, security middleware
- ✅ Comprehensive seed data created and loaded:
  - Test student account: `student@test.com` / `password123`
  - Test teacher account: `teacher@test.com` / `password123`
  - Sample content (The Great Gatsby) with chapter and vocabulary words
  - Essay assignment with 2 versions (v1 with feedback, v2 submitted)
  - Homework assignment
- ✅ Application running successfully at http://localhost:3000
- ✅ Swagger documentation available at http://localhost:3000/api-docs

**Current Application State**:
- Server running on port 3000
- Database: PostgreSQL 16 with full schema
- API prefix: `/api/v1`
- Test data loaded and ready for development

**Next Milestone**: Milestone 1 - Authentication & Authorization

---

#### Task 0.1: Initialize NestJS Project
**Dependencies**: None

**Steps**:

1. **Install NestJS CLI globally**:
   ```bash
   npm i -g @nestjs/cli
   ```

2. **Create new NestJS project**:
   ```bash
   nest new learning-platform
   cd learning-platform
   ```
   - Choose **npm** as package manager
   - This scaffolds complete project structure with TypeScript config

3. **Install core dependencies**:
   ```bash
   # Prisma
   npm install @prisma/client prisma

   # Authentication
   npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
   npm install --save-dev @types/passport-jwt @types/bcryptjs

   # Validation
   npm install class-validator class-transformer

   # Configuration
   npm install @nestjs/config

   # Swagger documentation
   npm install @nestjs/swagger swagger-ui-express

   # Security
   npm install helmet
   npm install @nestjs/throttler  # Rate limiting

   # Logging (Pino - high-performance structured logging)
   npm install nestjs-pino pino-http
   npm install --save-dev pino-pretty  # Development pretty-printing

   # Testing (already included with NestJS)
   # - @nestjs/testing
   # - jest
   # - supertest
   ```

4. **Verify installation**:
   ```bash
   npm run start:dev
   ```
   - Visit `http://localhost:3000`
   - Should see "Hello World!"

**Files Auto-Created by NestJS CLI**:
- `/src/app.module.ts` - Root application module
- `/src/app.controller.ts` - Root controller
- `/src/app.service.ts` - Root service
- `/src/main.ts` - Application entry point
- `/test/` - Test configuration
- `tsconfig.json` - TypeScript configuration
- `nest-cli.json` - NestJS CLI configuration

---

#### Task 0.2: Development Tooling Configuration
**Dependencies**: Task 0.1

**Steps**:

1. **Configure ESLint** (already configured by NestJS CLI)
   - Located at `.eslintrc.js`
   - NestJS-specific rules included
   - Update if needed:
   ```javascript
   module.exports = {
     parser: '@typescript-eslint/parser',
     parserOptions: {
       project: 'tsconfig.json',
       tsconfigRootDir: __dirname,
       sourceType: 'module',
     },
     plugins: ['@typescript-eslint/eslint-plugin'],
     extends: [
       'plugin:@typescript-eslint/recommended',
       'plugin:prettier/recommended',
     ],
     root: true,
     env: {
       node: true,
       jest: true,
     },
     ignorePatterns: ['.eslintrc.js'],
     rules: {
       '@typescript-eslint/interface-name-prefix': 'off',
       '@typescript-eslint/explicit-function-return-type': 'off',
       '@typescript-eslint/explicit-module-boundary-types': 'off',
       '@typescript-eslint/no-explicit-any': 'warn',
     },
   };
   ```

2. **Configure Prettier** (`.prettierrc`):
   ```json
   {
     "singleQuote": true,
     "trailingComma": "all",
     "semi": true,
     "printWidth": 100,
     "tabWidth": 2,
     "arrowParens": "always"
   }
   ```

3. **Jest Configuration** (already configured)
   - NestJS includes Jest configuration in `package.json`
   - Test files: `*.spec.ts` or `*.test.ts`
   - E2E tests: `test/*.e2e-spec.ts`

4. **Update npm scripts** (add to `package.json`):
   ```json
   {
     "scripts": {
       "prebuild": "rimraf dist",
       "build": "nest build",
       "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
       "start": "nest start",
       "start:dev": "nest start --watch",
       "start:debug": "nest start --debug --watch",
       "start:prod": "node dist/main",
       "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
       "test": "jest",
       "test:watch": "jest --watch",
       "test:cov": "jest --coverage",
       "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
       "test:e2e": "jest --config ./test/jest-e2e.json",
       "prisma:generate": "prisma generate",
       "prisma:migrate": "prisma migrate dev",
       "prisma:studio": "prisma studio",
       "prisma:seed": "ts-node prisma/seed.ts"
     }
   }
   ```

**Files to Review/Update**:
- `.eslintrc.js` (auto-created, review/customize)
- `.prettierrc` (create)
- `package.json` (add Prisma scripts)

---

#### Task 0.3: Environment Configuration
**Dependencies**: Task 0.1

**Steps**:

1. **Create `.env.example`**:
   ```env
   # Server
   NODE_ENV=development
   PORT=3000

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/learning_platform?schema=public"

   # JWT
   JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key-different-from-access
   JWT_REFRESH_EXPIRES_IN=30d

   # CORS
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173

   # Rate Limiting
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```

2. **Create `.env`** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. **Create Configuration Module** (`src/config/configuration.ts`):
   ```typescript
   export default () => ({
     port: parseInt(process.env.PORT, 10) || 3000,
     database: {
       url: process.env.DATABASE_URL,
     },
     jwt: {
       secret: process.env.JWT_SECRET,
       expiresIn: process.env.JWT_EXPIRES_IN || '7d',
       refreshSecret: process.env.JWT_REFRESH_SECRET,
       refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
     },
     cors: {
       origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
     },
     throttle: {
       ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
       limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
     },
   });
   ```

4. **Import ConfigModule in AppModule** (`src/app.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import configuration from './config/configuration';

   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         load: [configuration],
       }),
     ],
   })
   export class AppModule {}
   ```

**Files to Create**:
- `.env.example`
- `.env`
- `/src/config/configuration.ts`

---

#### Task 0.3b: Logger Configuration (Pino)
**Dependencies**: Task 0.3

**Steps**:

1. **Import LoggerModule in AppModule** (`src/app.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { LoggerModule } from 'nestjs-pino';
   import configuration from './config/configuration';

   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         load: [configuration],
       }),
       LoggerModule.forRoot({
         pinoHttp: {
           level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
           transport: process.env.NODE_ENV !== 'production'
             ? {
                 target: 'pino-pretty',
                 options: {
                   colorize: true,
                   translateTime: 'yyyy-mm-dd HH:MM:ss',
                   ignore: 'pid,hostname',
                   singleLine: false,
                 }
               }
             : undefined, // No pretty-print in production (JSON only)
           autoLogging: true, // Auto-log all HTTP requests
           redact: {
             paths: [
               'req.headers.authorization',
               'req.headers.cookie',
               '*.password',
               '*.email',
               'student.email',
               'student.phone',
               'password',
               'email'
             ],
             censor: '[REDACTED]',
             remove: false
           },
           customProps: (req) => ({
             userId: req.user?.id,
             studentId: req.user?.studentId,
           }),
           customLogLevel: (req, res, err) => {
             if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
             if (res.statusCode >= 500 || err) return 'error';
             if (res.statusCode >= 300 && res.statusCode < 400) return 'info';
             return 'info';
           },
           serializers: {
             req: (req) => ({
               id: req.id,
               method: req.method,
               url: req.url,
               query: req.query,
               params: req.params,
               userId: req.user?.id,
             }),
             res: (res) => ({
               statusCode: res.statusCode,
             }),
           },
         },
       }),
     ],
   })
   export class AppModule {}
   ```

2. **Update main.ts to use Pino logger** (`src/main.ts`):
   ```typescript
   import { NestFactory } from '@nestjs/core';
   import { ValidationPipe } from '@nestjs/common';
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
   import { Logger } from 'nestjs-pino';  // Import Pino Logger
   import helmet from 'helmet';
   import { AppModule } from './app.module';

   async function bootstrap() {
     const app = await NestFactory.create(AppModule, { bufferLogs: true });

     // Use Pino logger globally
     app.useLogger(app.get(Logger));

     // ... rest of bootstrap code
   }
   ```

**Logger Features Configured**:
- **Development**: Pretty-printed, colorized logs with timestamps
- **Production**: Structured JSON logs (CloudWatch/DataDog compatible)
- **PII Redaction**: Automatic redaction of passwords, emails, auth headers
- **Request Context**: Automatic request ID binding to all logs
- **HTTP Logging**: All requests/responses logged automatically
- **Custom Levels**: 4xx → warn, 5xx → error

**Files to Update**:
- `/src/app.module.ts`
- `/src/main.ts`

---

#### Task 0.4: Database Setup with Prisma
**Dependencies**: Task 0.3

**Steps**:

1. **Initialize Prisma**:
   ```bash
   npx prisma init
   ```
   - This creates `prisma/schema.prisma` and updates `.env`

2. **Copy existing schema** (you already have `prisma/schema.prisma`)

3. **Create Prisma Module** (`src/prisma/prisma.module.ts`):
   ```typescript
   import { Global, Module } from '@nestjs/common';
   import { PrismaService } from './prisma.service';

   @Global()
   @Module({
     providers: [PrismaService],
     exports: [PrismaService],
   })
   export class PrismaModule {}
   ```

4. **Create Prisma Service** (`src/prisma/prisma.service.ts`):
   ```typescript
   import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
   import { PrismaClient } from '@prisma/client';

   @Injectable()
   export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
     async onModuleInit() {
       await this.$connect();
     }

     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```

5. **Import PrismaModule in AppModule**:
   ```typescript
   import { PrismaModule } from './prisma/prisma.module';

   @Module({
     imports: [
       ConfigModule.forRoot({ ... }),
       PrismaModule,
     ],
   })
   export class AppModule {}
   ```

6. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

7. **Create initial migration**:
   ```bash
   npm run prisma:migrate -- --name init
   ```

8. **Create database seeding script** (`prisma/seed.ts`):
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import * as bcrypt from 'bcryptjs';

   const prisma = new PrismaClient();

   async function main() {
     console.log('🌱 Seeding database...');

     // Create test student
     const hashedPassword = await bcrypt.hash('password123', 10);
     const student = await prisma.student.upsert({
       where: { email: 'student@test.com' },
       update: {},
       create: {
         username: 'teststudent',
         email: 'student@test.com',
         password: hashedPassword,
         firstName: 'Test',
         lastName: 'Student',
         currentLevel: 'BEGINNER',
       },
     });

     // Create sample content (book)
     const content = await prisma.content.create({
       data: {
         title: 'Sample English Book',
        contentType: 'BOOK',         author: 'John Doe',
         description: 'A sample book for testing',
         publishedYear: 2024,
         averageDifficulty: 50,
       },
     });

     // Create sample chapter
     const chapter = await prisma.chapter.create({
       data: {
         contentId: content.id,
         chapterNumber: 1,
         title: 'Introduction',
         content: 'This is a sample chapter content.',
         wordCount: 5,
       },
     });

     // Create sample words
     await prisma.word.create({
       data: {
         word: 'eloquent',
         difficultyScore: 65,
         definitions: {
           create: {
             definition: 'Fluent or persuasive in speaking or writing',
           },
         },
         exampleSentences: {
           create: {
             sentence: 'She gave an eloquent speech at the conference.',
           },
         },
       },
     });

     console.log('✅ Seeding completed!');
     console.log({ student, content, chapter });
   }

   main()
     .catch((e) => {
       console.error('❌ Seeding failed:', e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

9. **Add seed script to `package.json`**:
   ```json
   {
     "prisma": {
       "seed": "ts-node prisma/seed.ts"
     }
   }
   ```

10. **Run seed**:
    ```bash
    npm run prisma:seed
    ```

**Files to Create**:
- `/src/prisma/prisma.module.ts`
- `/src/prisma/prisma.service.ts`
- `/prisma/seed.ts`

**Gotchas**:
- Ensure PostgreSQL is running before migration
- DATABASE_URL must be correctly formatted
- PrismaService automatically manages connection lifecycle

---

#### Task 0.5: Application Setup (Main.ts & Global Middleware)
**Dependencies**: Tasks 0.1-0.4

**Steps**:

1. **Update `src/main.ts`** (application bootstrap):
   ```typescript
   import { NestFactory } from '@nestjs/core';
   import { ValidationPipe } from '@nestjs/common';
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
   import { Logger } from 'nestjs-pino';
   import helmet from 'helmet';
   import { AppModule } from './app.module';

   async function bootstrap() {
     const app = await NestFactory.create(AppModule, { bufferLogs: true });

     // Use Pino logger globally
     app.useLogger(app.get(Logger));

     // Global prefix
     app.setGlobalPrefix('api/v1');

     // Security
     app.use(helmet());
     app.enableCors({
       origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
       credentials: true,
     });

     // Global validation pipe
     app.useGlobalPipes(
       new ValidationPipe({
         whitelist: true, // Strip properties that don't have decorators
         forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
         transform: true, // Auto-transform payloads to DTO instances
         transformOptions: {
           enableImplicitConversion: true, // Auto-convert types (string to number, etc.)
         },
       }),
     );

     // Swagger documentation
     const config = new DocumentBuilder()
       .setTitle('English Learning Platform API')
       .setDescription('REST API for vocabulary tracking, quizzes, and progress monitoring')
       .setVersion('1.0')
       .addBearerAuth() // JWT authentication
       .addTag('Authentication', 'User registration and login')
       .addTag('Students', 'Student profile management')
       .addTag('Content', 'Contents, chapters, and words')
       .addTag('Homework', 'Homework assignments and tracking')
       .addTag('Quizzes', 'Quiz creation and attempts')
       .addTag('Progress', 'Learning progress tracking')
       .build();

     const document = SwaggerModule.createDocument(app, config);
     SwaggerModule.setup('api-docs', app, document);

     const port = process.env.PORT || 3000;
     await app.listen(port);

     // Use Pino logger instead of console.log
     const logger = app.get(Logger);
     logger.log(`🚀 Application is running on: http://localhost:${port}`);
     logger.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
   }

   bootstrap();
   ```

2. **Create Global Exception Filter** (optional, for custom error formatting):
   `src/common/filters/http-exception.filter.ts`:
   ```typescript
   import {
     ExceptionFilter,
     Catch,
     ArgumentsHost,
     HttpException,
     HttpStatus,
   } from '@nestjs/common';
   import { Request, Response } from 'express';

   @Catch(HttpException)
   export class HttpExceptionFilter implements ExceptionFilter {
     catch(exception: HttpException, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse<Response>();
       const request = ctx.getRequest<Request>();
       const status = exception.getStatus();
       const exceptionResponse = exception.getResponse();

       const error =
         typeof exceptionResponse === 'string'
           ? { message: exceptionResponse }
           : (exceptionResponse as object);

       response.status(status).json({
         statusCode: status,
         timestamp: new Date().toISOString(),
         path: request.url,
         ...error,
       });
     }
   }
   ```

3. **Enable Rate Limiting** (add to `app.module.ts`):
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';

   @Module({
     imports: [
       ThrottlerModule.forRoot([{
         ttl: 60000, // 60 seconds
         limit: 100, // 100 requests per TTL
       }]),
       // ... other imports
     ],
   })
   export class AppModule {}
   ```

**Files to Update/Create**:
- `/src/main.ts` (update)
- `/src/common/filters/http-exception.filter.ts` (optional)

**Testing**:
- Run `npm run start:dev`
- Visit `http://localhost:3000/api/v1` (should get 404, which is expected)
- Visit `http://localhost:3000/api-docs` (Swagger UI should load)

---

#### Task 0.6: Deployment Preparation
**Dependencies**: Tasks 0.1-0.5

**Overview**: Prepare the application for deployment by creating health check endpoints, deployment configuration files, and production build scripts.

**Steps**:

1. **Create Health Check Module** (`src/health/health.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { HealthController } from './health.controller';

   @Module({
     controllers: [HealthController],
   })
   export class HealthModule {}
   ```

2. **Create Health Check Controller** (`src/health/health.controller.ts`):
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
   import { PrismaService } from '../prisma/prisma.service';

   @ApiTags('Health')
   @Controller('health')
   export class HealthController {
     constructor(private prisma: PrismaService) {}

     @Get()
     @ApiOperation({ summary: 'Health check endpoint' })
     @ApiResponse({ status: 200, description: 'Application is healthy' })
     async check() {
       // Database connectivity check
       try {
         await this.prisma.$queryRaw`SELECT 1`;
       } catch (error) {
         return {
           status: 'unhealthy',
           database: 'disconnected',
           timestamp: new Date().toISOString(),
           error: error.message,
         };
       }

       return {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         memory: {
           used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
           total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
         },
         database: 'connected',
         version: process.env.npm_package_version || '1.0.0',
       };
     }
   }
   ```

3. **Import HealthModule in AppModule**:
   ```typescript
   import { HealthModule } from './health/health.module';

   @Module({
     imports: [
       // ... existing imports
       HealthModule,
     ],
   })
   export class AppModule {}
   ```

4. **Create Render Deployment Config** (`render.yaml`):
   ```yaml
   services:
     - type: web
       name: learning-platform-api
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm run start:prod
       healthCheckPath: /api/v1/health
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           fromDatabase:
             name: learning-platform-db
             property: connectionString
         - key: JWT_SECRET
           generateValue: true
         - key: JWT_REFRESH_SECRET
           generateValue: true
         - key: CORS_ORIGIN
           value: https://yourdomain.com

   databases:
     - name: learning-platform-db
       databaseName: learning_platform
       plan: starter
   ```

5. **Create Railway Config** (`railway.json`):
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm ci && npm run build && npx prisma generate"
     },
     "deploy": {
       "startCommand": "npx prisma migrate deploy && npm run start:prod",
       "healthcheckPath": "/api/v1/health",
       "healthcheckTimeout": 300,
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

6. **Create Nixpacks Config for Railway** (`nixpacks.toml`):
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs-18_x", "openssl"]

   [phases.install]
   cmds = ["npm ci"]

   [phases.build]
   cmds = [
     "npm run build",
     "npx prisma generate"
   ]

   [start]
   cmd = "npx prisma migrate deploy && npm run start:prod"
   ```

7. **Create Dockerfile** (for AWS/GCP/custom deployments):
   ```dockerfile
   # Multi-stage build for optimized production image

   # Stage 1: Dependencies
   FROM node:18-alpine AS dependencies
   RUN apk add --no-cache libc6-compat openssl
   WORKDIR /app
   COPY package*.json ./
   COPY prisma ./prisma/
   RUN npm ci --only=production && npm cache clean --force
   RUN npx prisma generate

   # Stage 2: Build
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   COPY prisma ./prisma/
   RUN npm ci
   COPY . .
   RUN npm run build

   # Stage 3: Production
   FROM node:18-alpine AS production
   RUN apk add --no-cache dumb-init openssl
   RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
   WORKDIR /app
   COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
   COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
   COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
   COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

   USER nestjs
   EXPOSE 3000

   HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

   ENTRYPOINT ["dumb-init", "--"]
   CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
   ```

8. **Create .dockerignore**:
   ```
   node_modules
   dist
   npm-debug.log
   .env
   .env.local
   .env.*.local
   .git
   .gitignore
   README.md
   .vscode
   .idea
   coverage
   .DS_Store
   *.md
   .github
   test
   ```

9. **Update package.json scripts for deployment**:
   ```json
   {
     "scripts": {
       "prebuild": "rimraf dist",
       "build": "nest build",
       "start": "nest start",
       "start:dev": "nest start --watch",
       "start:debug": "nest start --debug --watch",
       "start:prod": "node dist/main",
       "deploy:prepare": "npm run build && npm run prisma:generate",
       "deploy:migrate": "prisma migrate deploy",
       "railway:build": "npm ci && npm run build && npx prisma generate",
       "railway:start": "npx prisma migrate deploy && npm run start:prod",
       "render:build": "npm install && npm run build",
       "render:start": "npm run deploy:migrate && npm run start:prod"
     }
   }
   ```

10. **Create environment template for production** (`.env.production.example`):
    ```env
    # Production Environment Template
    NODE_ENV=production
    PORT=3000

    # Database (replace with actual production DATABASE_URL)
    DATABASE_URL=postgresql://user:password@host:5432/learning_platform?schema=public

    # JWT Secrets (generate with: openssl rand -base64 32)
    JWT_SECRET=GENERATE_32_CHAR_RANDOM_STRING
    JWT_REFRESH_SECRET=GENERATE_DIFFERENT_32_CHAR_STRING

    # CORS (production domain)
    CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

    # Rate Limiting
    THROTTLE_TTL=60
    THROTTLE_LIMIT=100

    # Logging
    LOG_LEVEL=info
    ```

**Files to Create**:
- `/src/health/health.module.ts`
- `/src/health/health.controller.ts`
- `/render.yaml`
- `/railway.json`
- `/nixpacks.toml`
- `/Dockerfile`
- `/.dockerignore`
- `/.env.production.example`

**Testing**:
- Visit `http://localhost:3000/api/v1/health` (should return healthy status)
- Verify database connectivity in health check
- Test Docker build: `docker build -t learning-platform:test .`

**Duration**: +4 hours

---

### MILESTONE 1: Authentication & Authorization (Week 2)

**STATUS: ⏳ NEXT - Ready to Start**

**Prerequisites**: ✅ Milestone 0 completed

**Overview**:
This milestone implements JWT-based authentication with Passport.js, including:
- Student and Teacher registration endpoints
- Login with JWT access and refresh tokens
- JWT authentication guards
- Password hashing with bcrypt
- Swagger documentation for auth endpoints

**Key Deliverables**:
- Auth module with registration and login
- JWT strategy with Passport.js
- Auth guards and decorators
- Refresh token mechanism
- Comprehensive auth tests

---

#### Task 1.1: JWT Strategy & Guards
**Dependencies**: Milestone 0

**Steps**:

1. **Create Auth Module**:
   ```bash
   nest g module auth
   nest g service auth
   nest g controller auth
   ```

2. **Create DTOs** (`src/auth/dto/`):

   **register.dto.ts**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString, IsEmail, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';

   export class RegisterDto {
     @ApiProperty({ example: 'john_doe' })
     @IsString()
     @MinLength(3)
     @MaxLength(30)
     username: string;

     @ApiProperty({ example: 'john@example.com' })
     @IsEmail()
     email: string;

     @ApiProperty({ example: 'SecurePass123', minLength: 8 })
     @IsString()
     @MinLength(8)
     password: string;

     @ApiProperty({ example: 'John' })
     @IsString()
     @MinLength(1)
     firstName: string;

     @ApiProperty({ example: 'Doe' })
     @IsString()
     @MinLength(1)
     lastName: string;

     @ApiProperty({ example: 'BEGINNER', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
     @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
     @IsOptional()
     currentLevel?: string;
   }
   ```

   **login.dto.ts**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsEmail, IsString, MinLength } from 'class-validator';

   export class LoginDto {
     @ApiProperty({ example: 'john@example.com' })
     @IsEmail()
     email: string;

     @ApiProperty({ example: 'SecurePass123' })
     @IsString()
     @MinLength(1)
     password: string;
   }
   ```

3. **Create JWT Strategy** (`src/auth/strategies/jwt.strategy.ts`):
   ```typescript
   import { Injectable, UnauthorizedException } from '@nestjs/common';
   import { PassportStrategy } from '@nestjs/passport';
   import { ExtractJwt, Strategy } from 'passport-jwt';
   import { ConfigService } from '@nestjs/config';
   import { PrismaService } from '../../prisma/prisma.service';

   export interface JwtPayload {
     sub: string; // student ID
     email: string;
     username: string;
   }

   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy) {
     constructor(
       private configService: ConfigService,
       private prisma: PrismaService,
     ) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: configService.get<string>('jwt.secret'),
       });
     }

     async validate(payload: JwtPayload) {
       const student = await this.prisma.student.findUnique({
         where: { id: payload.sub },
       });

       if (!student) {
         throw new UnauthorizedException('Student not found');
       }

       return {
         id: student.id,
         email: student.email,
         username: student.username,
       };
     }
   }
   ```

4. **Create JWT Auth Guard** (`src/auth/guards/jwt-auth.guard.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';

   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {}
   ```

5. **Update Auth Module** (`src/auth/auth.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { JwtModule } from '@nestjs/jwt';
   import { PassportModule } from '@nestjs/passport';
   import { ConfigService } from '@nestjs/config';
   import { AuthService } from './auth.service';
   import { AuthController } from './auth.controller';
   import { JwtStrategy } from './strategies/jwt.strategy';

   @Module({
     imports: [
       PassportModule,
       JwtModule.registerAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService) => ({
           secret: config.get<string>('jwt.secret'),
           signOptions: {
             expiresIn: config.get<string>('jwt.expiresIn'),
           },
         }),
       }),
     ],
     controllers: [AuthController],
     providers: [AuthService, JwtStrategy],
     exports: [AuthService],
   })
   export class AuthModule {}
   ```

**Files to Create**:
- `/src/auth/dto/register.dto.ts`
- `/src/auth/dto/login.dto.ts`
- `/src/auth/strategies/jwt.strategy.ts`
- `/src/auth/guards/jwt-auth.guard.ts`

---

#### Task 1.2: Auth Service & Controller
**Dependencies**: Task 1.1

**Steps**:

1. **Create Auth Service** (`src/auth/auth.service.ts`):
   ```typescript
   import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
   import { JwtService } from '@nestjs/jwt';
   import { ConfigService } from '@nestjs/config';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import * as bcrypt from 'bcryptjs';
   import { PrismaService } from '../prisma/prisma.service';
   import { RegisterDto } from './dto/register.dto';
   import { LoginDto } from './dto/login.dto';

   @Injectable()
   export class AuthService {
     constructor(
       private prisma: PrismaService,
       private jwtService: JwtService,
       private configService: ConfigService,
       @InjectPinoLogger(AuthService.name)
       private readonly logger: PinoLogger,
     ) {}

     async register(dto: RegisterDto) {
       this.logger.info({ username: dto.username }, 'Registration attempt');

       // Check if email exists
       const existingEmail = await this.prisma.student.findUnique({
         where: { email: dto.email },
       });
       if (existingEmail) {
         this.logger.warn({ email: dto.email }, 'Registration failed: email already exists');
         throw new ConflictException('Email already registered');
       }

       // Check if username exists
       const existingUsername = await this.prisma.student.findUnique({
         where: { username: dto.username },
       });
       if (existingUsername) {
         this.logger.warn({ username: dto.username }, 'Registration failed: username taken');
         throw new ConflictException('Username already taken');
       }

       // Hash password
       const hashedPassword = await bcrypt.hash(dto.password, 10);

       // Create student
       const student = await this.prisma.student.create({
         data: {
           username: dto.username,
           email: dto.email,
           password: hashedPassword,
           firstName: dto.firstName,
           lastName: dto.lastName,
           currentLevel: dto.currentLevel || 'BEGINNER',
         },
       });

       this.logger.info({ studentId: student.id, username: student.username }, 'Student registered successfully');

       // Generate tokens
       const tokens = await this.generateTokens(student.id, student.email, student.username);

       // Remove password from response
       const { password, ...studentWithoutPassword } = student;

       return {
         student: studentWithoutPassword,
         ...tokens,
       };
     }

     async login(dto: LoginDto) {
       this.logger.info({ email: dto.email }, 'Login attempt');

       // Find student
       const student = await this.prisma.student.findUnique({
         where: { email: dto.email },
       });

       if (!student) {
         this.logger.warn({ email: dto.email }, 'Login failed: student not found');
         throw new UnauthorizedException('Invalid credentials');
       }

       // Verify password
       const isPasswordValid = await bcrypt.compare(dto.password, student.password);
       if (!isPasswordValid) {
         this.logger.warn({ email: dto.email, studentId: student.id }, 'Login failed: invalid password');
         throw new UnauthorizedException('Invalid credentials');
       }

       this.logger.info({ studentId: student.id, username: student.username }, 'Login successful');

       // Generate tokens
       const tokens = await this.generateTokens(student.id, student.email, student.username);

       // Remove password from response
       const { password, ...studentWithoutPassword } = student;

       return {
         student: studentWithoutPassword,
         ...tokens,
       };
     }

     async getProfile(studentId: string) {
       this.logger.debug({ studentId }, 'Fetching student profile');

       const student = await this.prisma.student.findUnique({
         where: { id: studentId },
       });

       if (!student) {
         this.logger.warn({ studentId }, 'Profile not found');
         throw new UnauthorizedException('Student not found');
       }

       this.logger.debug({ studentId }, 'Profile retrieved successfully');

       const { password, ...studentWithoutPassword } = student;
       return studentWithoutPassword;
     }

     private async generateTokens(studentId: string, email: string, username: string) {
       const payload = { sub: studentId, email, username };

       const [accessToken, refreshToken] = await Promise.all([
         this.jwtService.signAsync(payload),
         this.jwtService.signAsync(payload, {
           secret: this.configService.get<string>('jwt.refreshSecret'),
           expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
         }),
       ]);

       this.logger.debug({ studentId }, 'JWT tokens generated');

       return {
         accessToken,
         refreshToken,
       };
     }
   }
   ```

2. **Create Auth Controller** (`src/auth/auth.controller.ts`):
   ```typescript
   import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
   import { AuthService } from './auth.service';
   import { RegisterDto } from './dto/register.dto';
   import { LoginDto } from './dto/login.dto';
   import { JwtAuthGuard } from './guards/jwt-auth.guard';

   @ApiTags('Authentication')
   @Controller('auth')
   export class AuthController {
     constructor(private authService: AuthService) {}

     @Post('register')
     @ApiOperation({ summary: 'Register a new student' })
     @ApiResponse({ status: 201, description: 'Student successfully registered' })
     @ApiResponse({ status: 409, description: 'Email or username already exists' })
     register(@Body() registerDto: RegisterDto) {
       return this.authService.register(registerDto);
     }

     @Post('login')
     @ApiOperation({ summary: 'Login student' })
     @ApiResponse({ status: 200, description: 'Login successful' })
     @ApiResponse({ status: 401, description: 'Invalid credentials' })
     login(@Body() loginDto: LoginDto) {
       return this.authService.login(loginDto);
     }

     @Get('profile')
     @UseGuards(JwtAuthGuard)
     @ApiBearerAuth()
     @ApiOperation({ summary: 'Get current user profile' })
     @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
     @ApiResponse({ status: 401, description: 'Unauthorized' })
     getProfile(@Request() req) {
       return this.authService.getProfile(req.user.id);
     }
   }
   ```

3. **Import AuthModule in AppModule**:
   ```typescript
   import { AuthModule } from './auth/auth.module';

   @Module({
     imports: [
       // ... existing imports
       AuthModule,
     ],
   })
   export class AppModule {}
   ```

**API Endpoints Created**:
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/profile
```

**Testing**:
- Use Swagger UI at `http://localhost:3000/api-docs`
- Test registration, login, and profile retrieval
- Verify JWT token authentication works

---

### MILESTONE 2: Student Management (Week 3)

#### Task 2.1: Student Module
**Dependencies**: Milestone 1

**Steps**:

1. **Generate Student Module**:
   ```bash
   nest g module students
   nest g service students
   nest g controller students
   ```

2. **Create DTOs** (`src/students/dto/update-student.dto.ts`):
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

   export class UpdateStudentDto {
     @ApiProperty({ example: 'John', required: false })
     @IsString()
     @MinLength(1)
     @MaxLength(50)
     @IsOptional()
     firstName?: string;

     @ApiProperty({ example: 'Doe', required: false })
     @IsString()
     @MinLength(1)
     @MaxLength(50)
     @IsOptional()
     lastName?: string;

     @ApiProperty({ example: 'INTERMEDIATE', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], required: false })
     @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
     @IsOptional()
     currentLevel?: string;
   }
   ```

3. **Create Students Service** (`src/students/students.service.ts`):
   ```typescript
   import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import { PrismaService } from '../prisma/prisma.service';
   import { UpdateStudentDto } from './dto/update-student.dto';

   @Injectable()
   export class StudentsService {
     constructor(
       private prisma: PrismaService,
       @InjectPinoLogger(StudentsService.name)
       private readonly logger: PinoLogger,
     ) {}

     async findOne(id: string, requestingUserId: string) {
       this.logger.debug({ studentId: id, requestingUserId }, 'Fetching student profile');

       // Authorization: Only allow students to view their own profile
       if (id !== requestingUserId) {
         this.logger.warn({ studentId: id, requestingUserId }, 'Unauthorized profile access attempt');
         throw new ForbiddenException('You can only access your own profile');
       }

       const student = await this.prisma.student.findUnique({
         where: { id },
       });

       if (!student) {
         this.logger.warn({ studentId: id }, 'Student not found');
         throw new NotFoundException('Student not found');
       }

       this.logger.debug({ studentId: id }, 'Student profile retrieved successfully');

       const { password, ...studentWithoutPassword } = student;
       return studentWithoutPassword;
     }

     async update(id: string, dto: UpdateStudentDto, requestingUserId: string) {
       this.logger.info({ studentId: id, updates: Object.keys(dto) }, 'Updating student profile');

       // Authorization: Only allow students to update their own profile
       if (id !== requestingUserId) {
         this.logger.warn({ studentId: id, requestingUserId }, 'Unauthorized profile update attempt');
         throw new ForbiddenException('You can only update your own profile');
       }

       const student = await this.prisma.student.findUnique({
         where: { id },
       });

       if (!student) {
         this.logger.warn({ studentId: id }, 'Student not found for update');
         throw new NotFoundException('Student not found');
       }

       const updated = await this.prisma.student.update({
         where: { id },
         data: dto,
       });

       this.logger.info({ studentId: id }, 'Student profile updated successfully');

       const { password, ...studentWithoutPassword } = updated;
       return studentWithoutPassword;
     }
   }
   ```

4. **Create Students Controller** (`src/students/students.controller.ts`):
   ```typescript
   import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
   import { StudentsService } from './students.service';
   import { UpdateStudentDto } from './dto/update-student.dto';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

   @ApiTags('Students')
   @Controller('students')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth()
   export class StudentsController {
     constructor(private studentsService: StudentsService) {}

     @Get(':id')
     @ApiOperation({ summary: 'Get student by ID' })
     @ApiResponse({ status: 200, description: 'Student found' })
     @ApiResponse({ status: 403, description: 'Forbidden - can only access own profile' })
     @ApiResponse({ status: 404, description: 'Student not found' })
     findOne(@Param('id') id: string, @Request() req) {
       return this.studentsService.findOne(id, req.user.id);
     }

     @Patch(':id')
     @ApiOperation({ summary: 'Update student profile' })
     @ApiResponse({ status: 200, description: 'Student updated successfully' })
     @ApiResponse({ status: 403, description: 'Forbidden - can only update own profile' })
     @ApiResponse({ status: 404, description: 'Student not found' })
     update(@Param('id') id: string, @Body() dto: UpdateStudentDto, @Request() req) {
       return this.studentsService.update(id, dto, req.user.id);
     }
   }
   ```

**API Endpoints Created**:
```
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
```

---

### MILESTONE 3: Content Management (Week 3-4)

#### Task 3.1: Content items: content/articles/videos/podcasts, Chapters, Words Modules
**Dependencies**: Milestone 1

**Note**: This milestone involves creating 3 similar modules. I'll provide detailed example for Content, then summarize Chapters and Words.

**Steps**:

1. **Generate Content Modules**:
   ```bash
   nest g module content
   nest g service content
   nest g controller content

   nest g module chapters
   nest g service chapters
   nest g controller chapters

   nest g module words
   nest g service words
   nest g controller words
   ```

2. **Create Pagination Utility** (`src/common/utils/pagination.util.ts`):
   ```typescript
   export interface PaginationParams {
     page: number;
     limit: number;
     sort?: string;
     order?: 'asc' | 'desc';
   }

   export interface PaginatedResult<T> {
     data: T[];
     meta: {
       page: number;
       limit: number;
       total: number;
       totalPages: number;
     };
     links: {
       first: string;
       prev: string | null;
       next: string | null;
       last: string;
     };
   }

   export function buildPaginatedResult<T>(
     data: T[],
     total: number,
     params: PaginationParams,
     baseUrl: string,
   ): PaginatedResult<T> {
     const totalPages = Math.ceil(total / params.limit);

     return {
       data,
       meta: {
         page: params.page,
         limit: params.limit,
         total,
         totalPages,
       },
       links: {
         first: `${baseUrl}?page=1&limit=${params.limit}`,
         prev: params.page > 1 ? `${baseUrl}?page=${params.page - 1}&limit=${params.limit}` : null,
         next: params.page < totalPages ? `${baseUrl}?page=${params.page + 1}&limit=${params.limit}` : null,
         last: `${baseUrl}?page=${totalPages}&limit=${params.limit}`,
       },
     };
   }
   ```

3. **Create Content DTOs**:

   `src/content/dto/create-content.dto.ts`:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

   export class CreateContentDto {
     @ApiProperty({ example: 'The Great Gatsby' })
     @IsString()
     title: string;

     @ApiProperty({ example: 'F. Scott Fitzgerald' })
     @IsString()
     author: string;

    @ApiProperty({ enum: ['BOOK', 'ARTICLE', 'VIDEO', 'PODCAST'], example: 'BOOK' })
    @IsIn(['BOOK', 'ARTICLE', 'VIDEO', 'PODCAST'])
    contentType: 'BOOK' | 'ARTICLE' | 'VIDEO' | 'PODCAST';

    @ApiProperty({ example: '978-1234567890', required: false })
    @IsString()
    @IsOptional()
    isbn?: string;

     @ApiProperty({ example: 'A classic American novel', required: false })
     @IsString()
     @IsOptional()
     description?: string;

     @ApiProperty({ example: 1925, required: false })
     @IsInt()
     @IsOptional()
     publishedYear?: number;

     @ApiProperty({ example: 50, minimum: 1, maximum: 100, required: false })
     @IsInt()
     @Min(1)
     @Max(100)
     @IsOptional()
     averageDifficulty?: number;

    @ApiProperty({ 
      required: false, 
      example: { sourceUrl: 'https://example.com/article', duration: 300 }, 
      description: 'Type-specific metadata (sourceUrl for articles/videos, duration for videos/podcasts, etc.)' 
    })
    @IsOptional()
    metadata?: Record<string, any>;
   }
   ```

   `src/content/dto/update-content.dto.ts`:
   ```typescript
   import { PartialType } from '@nestjs/swagger';
   import { CreateContentDto } from './create-content.dto';

   export class UpdateContentDto extends PartialType(CreateContentDto) {}
   ```

   `src/content/dto/query-content.dto.ts`:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
   import { Type } from 'class-transformer';

   export class QueryContentDto {
     @ApiProperty({ required: false, default: 1 })
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @IsOptional()
     page?: number = 1;

     @ApiProperty({ required: false, default: 20 })
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @IsOptional()
     limit?: number = 20;

     @ApiProperty({ required: false, example: 'title' })
     @IsString()
     @IsOptional()
     sort?: string;

     @ApiProperty({ required: false, enum: ['asc', 'desc'] })

    @ApiProperty({ required: false, enum: ['BOOK', 'ARTICLE', 'VIDEO', 'PODCAST'], example: 'BOOK' })
    @IsIn(['BOOK', 'ARTICLE', 'VIDEO', 'PODCAST'])
    @IsOptional()
    contentType?: 'BOOK' | 'ARTICLE' | 'VIDEO' | 'PODCAST';
     @IsIn(['asc', 'desc'])
     @IsOptional()
     order?: 'asc' | 'desc';

     @ApiProperty({ required: false, example: 50 })
     @Type(() => Number)
     @IsInt()
     @IsOptional()
     difficulty?: number;

     @ApiProperty({ required: false, example: 'chapters' })
     @IsString()
     @IsOptional()
     include?: string;
   }
   ```

4. **Create Content Service** (`src/content/content.service.ts`):
   ```typescript
   import { Injectable, NotFoundException } from '@nestjs/common';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import { PrismaService } from '../prisma/prisma.service';
   import { CreateContentDto } from './dto/create-content.dto';
   import { UpdateContentDto } from './dto/update-content.dto';
   import { QueryContentDto } from './dto/query-content.dto';
   import { buildPaginatedResult } from '../common/utils/pagination.util';

   @Injectable()
   export class ContentService {
     constructor(
       private prisma: PrismaService,
       @InjectPinoLogger(ContentService.name)
       private readonly logger: PinoLogger,
     ) {}

     async findAll(query: QueryContentDto, baseUrl: string) {
       const { page, limit, sort, order, difficulty, contentType, include } = query;

       this.logger.debug({ query }, 'Fetching content with pagination');

       // Build where clause
       const where: any = {};
       if (difficulty) {
         where.averageDifficulty = {
           gte: difficulty - 10,
           lte: difficulty + 10,
         };
       }
      if (contentType) {
        where.contentType = contentType;
      }

       // Build include clause
       const includeClause: any = {};
       if (include) {
         const includes = include.split(',');
         if (includes.includes('chapters')) {
           includeClause.chapters = true;
         }
       }

       // Execute query
       const [contentItems, total] = await Promise.all([
         this.prisma.content.findMany({
           where,
           skip: (page - 1) * limit,
           take: limit,
           orderBy: sort ? { [sort]: order || 'asc' } : { createdAt: 'desc' },
           include: includeClause,
         }),
         this.prisma.content.count({ where }),
       ]);

       this.logger.info({ count: contentItems.length, total, page, limit }, 'Content retrieved successfully');

       return buildPaginatedResult(contentItems, total, { page, limit, sort, order }, baseUrl);
     }

     async findOne(id: string, include?: string) {
       this.logger.debug({ contentId: id, include }, 'Fetching content by ID');

       const includeClause: any = {};
       if (include) {
         const includes = include.split(',');
         if (includes.includes('chapters')) {
           includeClause.chapters = true;
         }
       }

       const contentItem = await this.prisma.content.findUnique({
         where: { id },
         include: includeClause,
       });

       if (!contentItem) {
         this.logger.warn({ contentId: id }, 'Content not found');
         throw new NotFoundException('Content not found');
       }

       this.logger.debug({ contentId: id, title: contentItem.title }, 'Content retrieved successfully');

       return contentItem;
     }

     async create(dto: CreateContentDto) {
       this.logger.info({ title: dto.title, author: dto.author }, 'Creating new content');

       const contentItem = await this.prisma.content.create({
         data: dto,
       });

       this.logger.info({ contentId: content.id, title: contentItem.title }, 'Content created successfully');

       return contentItem;
     }

     async update(id: string, dto: UpdateContentDto) {
       this.logger.info({ contentId: id, updates: Object.keys(dto) }, 'Updating content');

       const contentItem = await this.prisma.content.findUnique({ where: { id } });
       if (!contentItem) {
         this.logger.warn({ contentId: id }, 'Content not found for update');
         throw new NotFoundException('Content not found');
       }

       const updated = await this.prisma.content.update({
         where: { id },
         data: dto,
       });

       this.logger.info({ contentId: id }, 'Content updated successfully');

       return updated;
     }

     async remove(id: string) {
       this.logger.info({ contentId: id }, 'Deleting content');

       const contentItem = await this.prisma.content.findUnique({ where: { id } });
       if (!contentItem) {
         this.logger.warn({ contentId: id }, 'Content not found for deletion');
         throw new NotFoundException('Content not found');
       }

       await this.prisma.content.delete({ where: { id } });

       this.logger.info({ contentId: id, title: contentItem.title }, 'Content deleted successfully');

       return { message: 'Content deleted successfully' };
     }
   }
   ```

5. **Create Content Controller** (`src/content/content.controller.ts`):
   ```typescript
   import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
   import { ContentService } from './content.service';
   import { CreateContentDto } from './dto/create-content.dto';
   import { UpdateContentDto } from './dto/update-content.dto';
   import { QueryContentDto } from './dto/query-content.dto';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

   @ApiTags('Content')
   @Controller('content')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth()
   export class ContentController {
     constructor(private contentService: ContentService) {}

     @Get()
     @ApiOperation({ summary: 'Get all content with pagination and filtering' })
     @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
     findAll(@Query() query: QueryContentDto) {
       return this.contentService.findAll(query, '/api/v1/content');
     }

     @Get(':id')
     @ApiOperation({ summary: 'Get content by ID' })
     @ApiQuery({ name: 'include', required: false, example: 'chapters' })
     @ApiResponse({ status: 200, description: 'Content found' })
     @ApiResponse({ status: 404, description: 'Content not found' })
     findOne(@Param('id') id: string, @Query('include') include?: string) {
       return this.contentService.findOne(id, include);
     }

     @Post()
     @ApiOperation({ summary: 'Create new content' })
     @ApiResponse({ status: 201, description: 'Content created successfully' })
     create(@Body() dto: CreateContentDto) {
       return this.contentService.create(dto);
     }

     @Patch(':id')
     @ApiOperation({ summary: 'Update content' })
     @ApiResponse({ status: 200, description: 'Content updated successfully' })
     @ApiResponse({ status: 404, description: 'Content not found' })
     update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
       return this.contentService.update(id, dto);
     }

     @Delete(':id')
     @ApiOperation({ summary: 'Delete content' })
     @ApiResponse({ status: 200, description: 'Content deleted successfully' })
     @ApiResponse({ status: 404, description: 'Content not found' })
     remove(@Param('id') id: string) {
       return this.contentService.remove(id);
     }
   }
   ```

**Repeat similar pattern for Chapters and Words modules** with appropriate DTOs, services, and controllers.

**API Endpoints Created**:
```
GET    /api/v1/content?page=1&limit=20&difficulty=50&include=chapters
GET    /api/v1/content/:id?include=chapters
POST   /api/v1/content
PATCH  /api/v1/content/:id
DELETE /api/v1/content/:id

GET    /api/v1/chapters?contentId=xxx
GET    /api/v1/chapters/:id?include=sentences
POST   /api/v1/chapters
PATCH  /api/v1/chapters/:id
DELETE /api/v1/chapters/:id

GET    /api/v1/words?difficulty=50&page=1
GET    /api/v1/words/:id?include=definitions,examples
POST   /api/v1/words
PATCH  /api/v1/words/:id
DELETE /api/v1/words/:id
```

---

### MILESTONE 4: Homework Workflow (Week 4)

#### Task 4.1: Homework Module
**Dependencies**: Milestones 1, 3

**Steps**:

1. **Generate Module**:
   ```bash
   nest g module homework
   nest g service homework
   nest g controller homework
   ```

2. **Create DTOs** (`src/homework/dto/create-homework.dto.ts`):
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString, IsDateString, IsInt, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

   export class CreateHomeworkDto {
     @ApiProperty({ example: 'student-id-123' })
     @IsString()
     studentId: string;

     @ApiProperty({ example: '2025-12-31T23:59:59Z' })
     @IsDateString()
     dueDate: string;

     @ApiProperty({ example: 50, required: false })
     @IsInt()
     @IsOptional()
     difficultyThreshold?: number;

     @ApiProperty({ example: ['word-id-1', 'word-id-2'], type: [String] })
     @IsArray()
     @ArrayMinSize(1)
     @IsString({ each: true })
     wordIds: string[];
   }
   ```

3. **Create Homework Service** with auto-status updates:
   ```typescript
   import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import { PrismaService } from '../prisma/prisma.service';
   import { CreateHomeworkDto } from './dto/create-homework.dto';

   @Injectable()
   export class HomeworkService {
     constructor(
       private prisma: PrismaService,
       @InjectPinoLogger(HomeworkService.name)
       private readonly logger: PinoLogger,
     ) {}

     async create(dto: CreateHomeworkDto) {
       this.logger.info({
         studentId: dto.studentId,
         wordCount: dto.wordIds.length,
         dueDate: dto.dueDate
       }, 'Creating homework assignment');

       const homework = await this.prisma.homework.create({
         data: {
           studentId: dto.studentId,
           dueDate: new Date(dto.dueDate),
           difficultyThreshold: dto.difficultyThreshold,
           status: 'ASSIGNED',
           assignedWords: {
             create: dto.wordIds.map((wordId) => ({
               wordId,
               completed: false,
             })),
           },
         },
         include: {
           assignedWords: {
             include: {
               word: true,
             },
           },
         },
       });

       this.logger.info({
         homeworkId: homework.id,
         studentId: dto.studentId,
         wordCount: dto.wordIds.length
       }, 'Homework assignment created successfully');

       return homework;
     }

     async completeWord(homeworkWordId: string, studentId: string) {
       this.logger.info({ homeworkWordId, studentId }, 'Marking homework word as completed');

       // Get homework word with homework
       const homeworkWord = await this.prisma.homeworkWord.findUnique({
         where: { id: homeworkWordId },
         include: { homework: true },
       });

       if (!homeworkWord) {
         this.logger.warn({ homeworkWordId }, 'Homework word not found');
         throw new NotFoundException('Homework word not found');
       }

       // Verify ownership
       if (homeworkWord.homework.studentId !== studentId) {
         this.logger.warn({
           homeworkWordId,
           expectedStudentId: homeworkWord.homework.studentId,
           actualStudentId: studentId
         }, 'Unauthorized homework word completion attempt');
         throw new ForbiddenException('Not authorized');
       }

       // Mark word as completed
       await this.prisma.homeworkWord.update({
         where: { id: homeworkWordId },
         data: { completed: true },
       });

       // Check if all words completed
       const allWords = await this.prisma.homeworkWord.findMany({
         where: { homeworkId: homeworkWord.homeworkId },
       });

       const allCompleted = allWords.every((w) => w.id === homeworkWordId || w.completed);
       const completedCount = allWords.filter(w => w.id === homeworkWordId || w.completed).length;

       // Update homework status
       if (allCompleted) {
         await this.prisma.homework.update({
           where: { id: homeworkWord.homeworkId },
           data: {
             status: 'COMPLETED',
             completedAt: new Date(),
           },
         });
         this.logger.info({
           homeworkId: homeworkWord.homeworkId,
           studentId,
           totalWords: allWords.length
         }, 'Homework completed - all words done');
       } else if (homeworkWord.homework.status === 'ASSIGNED') {
         await this.prisma.homework.update({
           where: { id: homeworkWord.homeworkId },
           data: { status: 'IN_PROGRESS' },
         });
         this.logger.info({
           homeworkId: homeworkWord.homeworkId,
           completedWords: completedCount,
           totalWords: allWords.length
         }, 'Homework status changed to IN_PROGRESS');
       } else {
         this.logger.debug({
           homeworkId: homeworkWord.homeworkId,
           completedWords: completedCount,
           totalWords: allWords.length
         }, 'Word marked complete, homework still in progress');
       }

       return { message: 'Word completed successfully' };
     }
   }
   ```

4. **Create Controller** with appropriate guards

**API Endpoints Created**:
```
POST   /api/v1/homework
GET    /api/v1/homework/:studentId?status=ACTIVE&include=words
GET    /api/v1/homework/:id?include=words.progress
PATCH  /api/v1/homework-words/:id/complete
```

---

### MILESTONE 5: Quiz System (Week 4-5)

#### Task 5.1: Quiz & Quiz Attempts Modules
**Dependencies**: Milestones 1, 3

**Similar pattern to Homework**:
- Create quiz and quiz-attempts modules
- DTOs for creating quizzes, starting attempts, submitting answers
- Services with answer validation and score calculation
- Controllers with proper guards

**API Endpoints Created**:
```
POST   /api/v1/quizzes
GET    /api/v1/quizzes?page=1
GET    /api/v1/quizzes/:id?include=questions
POST   /api/v1/quiz-attempts
GET    /api/v1/quiz-attempts/:id
POST   /api/v1/quiz-attempts/:id/answers
POST   /api/v1/quiz-attempts/:id/complete
GET    /api/v1/quiz-attempts/student/:studentId
```

---

### MILESTONE 6: Progress Tracking (Week 5)

#### Task 6.1: Progress Module with Spaced Repetition
**Dependencies**: Milestones 1, 3

**Create progress module** with:
- DTOs for updating progress
- Service with spaced repetition algorithm
- Review queue functionality
- Controller with proper authorization

**API Endpoints Created**:
```
GET    /api/v1/progress/:studentId?status=LEARNING&include=word
PATCH  /api/v1/progress/:studentId/words/:wordId
POST   /api/v1/progress/:studentId/words/:wordId/track
GET    /api/v1/progress/:studentId/review-queue
```

---

### MILESTONE 7: Testing Infrastructure (Week 5-6)

#### Task 7.1: Unit & Integration Tests
**Dependencies**: All feature milestones

**Steps**:

1. **Unit Test Example with Logger Mocking** (`src/auth/auth.service.spec.ts`):
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { AuthService } from './auth.service';
   import { PrismaService } from '../prisma/prisma.service';
   import { JwtService } from '@nestjs/jwt';
   import { ConfigService } from '@nestjs/config';
   import { ConflictException } from '@nestjs/common';
   import { PinoLogger } from 'nestjs-pino';

   describe('AuthService', () => {
     let service: AuthService;
     let prisma: PrismaService;
     let logger: PinoLogger;

     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           AuthService,
           {
             provide: PrismaService,
             useValue: {
               student: {
                 findUnique: jest.fn(),
                 create: jest.fn(),
               },
             },
           },
           {
             provide: JwtService,
             useValue: {
               signAsync: jest.fn().mockResolvedValue('token'),
             },
           },
           {
             provide: ConfigService,
             useValue: {
               get: jest.fn((key) => {
                 if (key === 'jwt.secret') return 'test-secret';
                 if (key === 'jwt.refreshSecret') return 'test-refresh-secret';
                 return null;
               }),
             },
           },
           {
             provide: PinoLogger,
             useValue: {
               info: jest.fn(),
               warn: jest.fn(),
               error: jest.fn(),
               debug: jest.fn(),
               setContext: jest.fn(),
             },
           },
         ],
       }).compile();

       service = module.get<AuthService>(AuthService);
       prisma = module.get<PrismaService>(PrismaService);
       logger = module.get<PinoLogger>(PinoLogger);
     });

     it('should be defined', () => {
       expect(service).toBeDefined();
     });

     describe('register', () => {
       it('should throw ConflictException if email exists', async () => {
         jest.spyOn(prisma.student, 'findUnique').mockResolvedValue({
           id: '1',
           email: 'test@test.com',
         } as any);

         await expect(
           service.register({
             email: 'test@test.com',
             username: 'test',
             password: 'password',
             firstName: 'Test',
             lastName: 'User',
           }),
         ).rejects.toThrow(ConflictException);

         // Verify logger was called
         expect(logger.warn).toHaveBeenCalledWith(
           { email: 'test@test.com' },
           'Registration failed: email already exists'
         );
       });

       it('should create student successfully', async () => {
         jest.spyOn(prisma.student, 'findUnique').mockResolvedValue(null);
         jest.spyOn(prisma.student, 'create').mockResolvedValue({
           id: '1',
           email: 'new@test.com',
           username: 'newuser',
           password: 'hashed',
           firstName: 'New',
           lastName: 'User',
           currentLevel: 'BEGINNER',
           createdAt: new Date(),
           updatedAt: new Date(),
         });

         const result = await service.register({
           email: 'new@test.com',
           username: 'newuser',
           password: 'password',
           firstName: 'New',
           lastName: 'User',
         });

         expect(result.student.email).toBe('new@test.com');
         expect(result.accessToken).toBeDefined();

         // Verify logger calls
         expect(logger.info).toHaveBeenCalledWith(
           { username: 'newuser' },
           'Registration attempt'
         );
         expect(logger.info).toHaveBeenCalledWith(
           expect.objectContaining({ studentId: '1', username: 'newuser' }),
           'Student registered successfully'
         );
       });
     });
   });
   ```

2. **E2E Test Example** (`test/auth.e2e-spec.ts`):
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication, ValidationPipe } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { PrismaService } from '../src/prisma/prisma.service';

   describe('AuthController (e2e)', () => {
     let app: INestApplication;
     let prisma: PrismaService;

     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       }).compile();

       app = moduleFixture.createNestApplication();
       app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
       await app.init();

       prisma = app.get<PrismaService>(PrismaService);
     });

     beforeEach(async () => {
       await prisma.student.deleteMany();
     });

     afterAll(async () => {
       await app.close();
     });

     describe('/api/v1/auth/register (POST)', () => {
       it('should register a new student', () => {
         return request(app.getHttpServer())
           .post('/api/v1/auth/register')
           .send({
             email: 'test@example.com',
             username: 'testuser',
             password: 'SecurePass123',
             firstName: 'Test',
             lastName: 'User',
           })
           .expect(201)
           .expect((res) => {
             expect(res.body.student.email).toBe('test@example.com');
             expect(res.body.accessToken).toBeDefined();
             expect(res.body.student.password).toBeUndefined();
           });
       });

       it('should return 409 for duplicate email', async () => {
         await request(app.getHttpServer())
           .post('/api/v1/auth/register')
           .send({
             email: 'duplicate@test.com',
             username: 'user1',
             password: 'SecurePass123',
             firstName: 'Test',
             lastName: 'User',
           });

         return request(app.getHttpServer())
           .post('/api/v1/auth/register')
           .send({
             email: 'duplicate@test.com',
             username: 'user2',
             password: 'SecurePass123',
             firstName: 'Test',
             lastName: 'User',
           })
           .expect(409);
       });
     });
   });
   ```

3. **Test all modules** with similar patterns

**Coverage Goals**:
- **Services**: 80%+
- **Controllers**: 80%+
- **Overall**: 80%+

**Run Tests**:
```bash
npm test               # Unit tests
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests
```

---

### MILESTONE 7.5: CI/CD Setup (Week 5-6)

#### Task 7.5.1: GitHub Actions Configuration
**Dependencies**: Milestone 7

**Overview**: Set up continuous integration and continuous deployment pipeline using GitHub Actions for automated testing and deployment.

**Steps**:

1. **Create GitHub Actions Workflow Directory**:
   ```bash
   mkdir -p .github/workflows
   ```

2. **Create CI Workflow** (`.github/workflows/ci.yml`):
   ```yaml
   name: CI Pipeline

   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main, develop]

   jobs:
     test:
       runs-on: ubuntu-latest

       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_USER: postgres
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: learning_platform_test
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
           ports:
             - 5432:5432

       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Generate Prisma Client
           run: npx prisma generate

         - name: Run database migrations
           run: npx prisma migrate deploy
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/learning_platform_test

         - name: Run linter
           run: npm run lint

         - name: Run unit tests
           run: npm run test:cov
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/learning_platform_test
             JWT_SECRET: test-secret-key-for-ci
             JWT_REFRESH_SECRET: test-refresh-secret-key-for-ci

         - name: Run E2E tests
           run: npm run test:e2e
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/learning_platform_test
             JWT_SECRET: test-secret-key-for-ci
             JWT_REFRESH_SECRET: test-refresh-secret-key-for-ci

         - name: Upload coverage reports
           uses: codecov/codecov-action@v3
           with:
             token: ${{ secrets.CODECOV_TOKEN }}
             files: ./coverage/lcov.info
             flags: unittests
             name: codecov-umbrella

     build:
       needs: test
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Generate Prisma Client
           run: npx prisma generate

         - name: Build application
           run: npm run build

         - name: Verify build output
           run: |
             if [ ! -d "dist" ]; then
               echo "Build failed: dist directory not found"
               exit 1
             fi
             echo "Build successful"
   ```

3. **Create CD Workflow for Railway** (`.github/workflows/deploy-railway.yml`):
   ```yaml
   name: Deploy to Railway

   on:
     push:
       branches: [main]
     workflow_dispatch:

   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: production

       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install Railway CLI
           run: npm install -g @railway/cli

         - name: Deploy to Railway
           run: railway up --service api --detach
           env:
             RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

         - name: Wait for deployment
           run: sleep 60

         - name: Health check
           run: |
             DEPLOY_URL="${{ secrets.RAILWAY_DEPLOY_URL }}"
             echo "Checking health at $DEPLOY_URL/api/v1/health"

             RESPONSE=$(curl -f -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/v1/health" || echo "failed")

             if [ "$RESPONSE" = "200" ]; then
               echo "✅ Deployment successful - Health check passed"
             else
               echo "❌ Deployment failed - Health check returned: $RESPONSE"
               exit 1
             fi

         - name: Notify deployment status
           if: always()
           run: |
             if [ ${{ job.status }} == 'success' ]; then
               echo "🚀 Deployment to Railway completed successfully"
             else
               echo "❌ Deployment to Railway failed"
             fi
   ```

4. **Create CD Workflow for Render** (`.github/workflows/deploy-render.yml`):
   ```yaml
   name: Deploy to Render

   on:
     push:
       branches: [main]
     workflow_dispatch:

   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: production

       steps:
         - uses: actions/checkout@v3

         - name: Trigger Render deployment
           run: |
             curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
             echo "Render deployment triggered"

         - name: Wait for deployment
           run: sleep 90

         - name: Health check
           run: |
             DEPLOY_URL="${{ secrets.RENDER_DEPLOY_URL }}"
             echo "Checking health at $DEPLOY_URL/api/v1/health"

             for i in {1..5}; do
               RESPONSE=$(curl -f -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/api/v1/health" || echo "failed")

               if [ "$RESPONSE" = "200" ]; then
                 echo "✅ Deployment successful - Health check passed"
                 exit 0
               fi

               echo "Attempt $i failed, retrying in 15s..."
               sleep 15
             done

             echo "❌ Deployment failed - Health check did not pass after 5 attempts"
             exit 1
   ```

5. **Create Database Migration Workflow** (`.github/workflows/migrate.yml`):
   ```yaml
   name: Run Database Migrations

   on:
     workflow_dispatch:
       inputs:
         environment:
           description: 'Environment to run migrations'
           required: true
           type: choice
           options:
             - staging
             - production

   jobs:
     migrate:
       runs-on: ubuntu-latest
       environment: ${{ github.event.inputs.environment }}

       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install dependencies
           run: npm ci

         - name: Run migrations
           run: npx prisma migrate deploy
           env:
             DATABASE_URL: ${{ secrets.DATABASE_URL }}

         - name: Verify migrations
           run: npx prisma migrate status
           env:
             DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```

**GitHub Secrets to Configure**:
Navigate to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
RAILWAY_TOKEN=<your-railway-token>
RAILWAY_DEPLOY_URL=https://your-app.railway.app
RENDER_DEPLOY_HOOK_URL=<your-render-deploy-hook>
RENDER_DEPLOY_URL=https://your-app.onrender.com
DATABASE_URL=<production-database-url>
CODECOV_TOKEN=<codecov-token> (optional)
```

**How to Get Secrets**:
- **Railway Token**: Run `railway token` after logging in with Railway CLI
- **Render Deploy Hook**: Render Dashboard → Service → Settings → Deploy Hook
- **Database URL**: From Railway/Render dashboard environment variables

---

#### Task 7.5.2: Pre-Deployment Checklist
**Dependencies**: Task 7.5.1

**Create Pre-Deployment Checklist** (`DEPLOYMENT_CHECKLIST.md`):

```markdown
# Deployment Checklist

## Pre-Deployment (Complete Before Each Deploy)

### Code Quality
- [ ] All tests passing locally (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Test coverage ≥ 80% (`npm run test:cov`)
- [ ] No console.log statements (use Pino logger)
- [ ] ESLint warnings resolved (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] TypeScript strict mode enabled
- [ ] No TypeScript errors (`npm run build`)

### Security
- [ ] JWT secrets generated (32+ characters)
  ```bash
  openssl rand -base64 32  # JWT_SECRET
  openssl rand -base64 32  # JWT_REFRESH_SECRET
  ```
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled (100 req/min default)
- [ ] Helmet security headers active
- [ ] Input validation on all DTOs
- [ ] SQL injection protected (Prisma ORM)
- [ ] Environment variables never committed to git
- [ ] Sensitive data redacted in logs (Pino config)

### Database
- [ ] Migrations created (`npx prisma migrate dev`)
- [ ] Migrations tested on staging database
- [ ] Backup of production database taken
- [ ] Indexes created for frequent queries
- [ ] Foreign key constraints verified
- [ ] Connection pooling configured
- [ ] Database credentials rotated (if needed)

### Infrastructure
- [ ] Production environment variables configured
- [ ] DATABASE_URL set correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (auto with Railway/Render)
- [ ] Health endpoint returns 200 OK
- [ ] CI/CD pipeline tests pass

### Monitoring
- [ ] Pino logger configured for production
- [ ] Log level set to 'info' or 'warn'
- [ ] Error tracking configured (optional: Sentry)
- [ ] Performance monitoring enabled
- [ ] Database query logging disabled in production

### Documentation
- [ ] API documentation (Swagger) up to date
- [ ] README.md updated
- [ ] Environment variable template updated (.env.example)
- [ ] CHANGELOG.md updated with new features
- [ ] Migration notes documented (if schema changes)

## Post-Deployment (Verify After Deploy)

### Smoke Tests
- [ ] Health endpoint accessible: `GET /api/v1/health`
- [ ] Returns `status: "healthy"` and `database: "connected"`
- [ ] API documentation accessible: `/api-docs`
- [ ] Authentication works: Register → Login → Get Profile
- [ ] Database migrations applied successfully
- [ ] No errors in application logs

### Performance
- [ ] API response time < 200ms (p95)
- [ ] Database query time < 100ms
- [ ] Memory usage stable
- [ ] No memory leaks observed
- [ ] CPU usage < 70% under normal load

### Monitoring
- [ ] Logs streaming correctly (Railway/Render dashboard)
- [ ] No critical errors in logs
- [ ] Health checks passing
- [ ] Deployment marked as successful in platform

### Rollback Plan
- [ ] Previous deployment version noted
- [ ] Rollback command documented
- [ ] Database backup confirmed accessible
- [ ] Team notified of deployment

## Emergency Rollback

If deployment fails:

**Railway:**
```bash
railway rollback
```

**Render:**
- Go to Dashboard → Service → Events
- Click "Rollback" on previous successful deployment

**Database Rollback:**
```bash
# Restore from backup (example with PostgreSQL)
pg_restore -d learning_platform backup-20251208.sql
```

## Deployment Commands

### Railway
```bash
# Deploy manually
railway up

# Check status
railway status

# View logs
railway logs --follow

# Rollback
railway rollback
```

### Render
```bash
# Trigger deployment via webhook
curl -X POST "$RENDER_DEPLOY_HOOK_URL"

# Or push to main branch (auto-deploys)
git push origin main
```

### Docker (AWS/GCP)
```bash
# Build and tag
docker build -t learning-platform:latest .

# Push to registry
docker push your-registry/learning-platform:latest

# Deploy (example with AWS ECS)
aws ecs update-service --cluster prod --service api --force-new-deployment
```
```

**Files to Create**:
- `/.github/workflows/ci.yml`
- `/.github/workflows/deploy-railway.yml`
- `/.github/workflows/deploy-render.yml`
- `/.github/workflows/migrate.yml`
- `/DEPLOYMENT_CHECKLIST.md`

**Duration**: +6 hours

---

### MILESTONE 8: Production Deployment (Week 6)

**Duration**: 1 week (can be done in parallel with final testing)

**Prerequisites**:
- All features complete (Milestones 0-6)
- Test coverage ≥80% (Milestone 7)
- CI/CD pipeline configured (Milestone 7.5)
- Deployment preparation complete (Task 0.6)

**Goal**: Deploy the application to production and verify it's working correctly with proper monitoring and documentation.

---

#### Task 8.1: Choose Deployment Platform
**Dependencies**: Milestone 7.5

**Decision Matrix**: Choose one platform based on your requirements

| Platform | Best For | Cost (Mo 1-3) | Setup Time | Scalability |
|----------|----------|---------------|------------|-------------|
| **Render (Free)** | MVP Testing | $0 | 2 hours | Low |
| **Railway** | Production (Recommended) | $12-25 | 4 hours | Medium-High |
| **AWS Elastic Beanstalk** | Enterprise | $10-68* | 1-2 days | Very High |

*AWS Free tier for first year

**Recommended**: Start with **Render Free Tier** for Week 6, then migrate to **Railway** for long-term production (Month 2+).

---

#### Task 8.2: Deploy to Render (Free Tier - Quick MVP)
**Dependencies**: Task 8.1

**Steps**:

1. **Create Render Account**:
   - Visit https://render.com
   - Sign up with GitHub account

2. **Create PostgreSQL Database**:
   - Dashboard → New → PostgreSQL
   - Name: `learning-platform-db`
   - Database: `learning_platform`
   - User: Auto-generated
   - Region: Choose closest to users
   - Plan: **Free** (1GB, 90-day trial)
   - Click "Create Database"

3. **Get Database Connection String**:
   - Click on database → "Info" tab
   - Copy "External Database URL"
   - Format: `postgresql://user:password@host:5432/database`

4. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: `learning-platform-api`
   - Environment: Node
   - Region: Same as database
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run render:start`
   - Plan: **Free**

5. **Configure Environment Variables**:
   In Render Dashboard → Service → Environment:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-from-database-info>
   JWT_SECRET=<generate-with-openssl-rand-base64-32>
   JWT_REFRESH_SECRET=<generate-different-secret>
   CORS_ORIGIN=https://your-frontend-domain.com
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```

6. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically:
     - Build the application
     - Run database migrations (via start command)
     - Start the server
     - Assign a URL: `https://learning-platform-api.onrender.com`

7. **Verify Deployment**:
   ```bash
   # Test health endpoint
   curl https://learning-platform-api.onrender.com/api/v1/health

   # Should return:
   # {
   #   "status": "healthy",
   #   "database": "connected",
   #   "timestamp": "...",
   #   "uptime": 123.45
   # }
   ```

8. **Test API Endpoints**:
   - Visit `https://learning-platform-api.onrender.com/api-docs`
   - Test registration: POST `/api/v1/auth/register`
   - Test login: POST `/api/v1/auth/login`
   - Verify JWT authentication works

**Important Notes**:
- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- Perfect for MVP testing, NOT suitable for production traffic
- Upgrade to Starter ($7/month) for 24/7 uptime

**Duration**: 2-3 hours

---

#### Task 8.3: Deploy to Railway (Production - Recommended)
**Dependencies**: Task 8.1

**Steps**:

1. **Create Railway Account**:
   - Visit https://railway.app
   - Sign up with GitHub account
   - Verify email address

2. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli

   # Login
   railway login

   # This will open browser for authentication
   ```

3. **Initialize Railway Project**:
   ```bash
   cd /path/to/learning-platform

   # Create new project
   railway init

   # Enter project name: learning-platform
   ```

4. **Add PostgreSQL Database**:
   ```bash
   # Add PostgreSQL service
   railway add postgresql

   # Railway automatically:
   # - Provisions PostgreSQL instance
   # - Injects DATABASE_URL environment variable
   # - Configures connection
   ```

5. **Configure Environment Variables**:
   ```bash
   # Set production environment variables
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   railway variables set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   railway variables set CORS_ORIGIN="https://yourdomain.com"
   railway variables set THROTTLE_TTL=60
   railway variables set THROTTLE_LIMIT=100

   # Verify variables
   railway variables list
   ```

6. **Deploy Application**:
   ```bash
   # Deploy to Railway
   railway up

   # Railway will:
   # 1. Upload code
   # 2. Build using nixpacks.toml config
   # 3. Run database migrations
   # 4. Start application
   # 5. Assign temporary URL
   ```

7. **Monitor Deployment**:
   ```bash
   # Watch logs in real-time
   railway logs --follow

   # Check deployment status
   railway status
   ```

8. **Get Deployment URL**:
   ```bash
   # Generate Railway subdomain
   railway domain

   # Example: learning-platform-production.up.railway.app
   ```

9. **Verify Deployment**:
   ```bash
   # Get URL
   URL=$(railway status --json | jq -r '.deployments[0].url')

   # Test health endpoint
   curl $URL/api/v1/health

   # Test Swagger docs
   open $URL/api-docs
   ```

10. **Configure Custom Domain** (Optional):
    - Railway Dashboard → Service → Settings → Domains
    - Click "Add Custom Domain"
    - Enter: `api.yourdomain.com`
    - Add CNAME record to DNS:
      ```
      CNAME api.yourdomain.com → yourapp.up.railway.app
      ```
    - Railway auto-provisions SSL certificate

11. **Set Up GitHub Auto-Deploy**:
    Railway automatically deploys on push to main branch (GitHub integration active)

    Test:
    ```bash
    # Make a change
    echo "# Railway Deployment Test" >> README.md
    git add README.md
    git commit -m "test: verify Railway auto-deploy"
    git push origin main

    # Watch deployment
    railway logs --follow
    ```

**Cost Breakdown**:
- Month 1-3: ~$12/month (Hobby plan, 512MB app + 1GB DB)
- Month 4-6: ~$25/month (500 users)
- Month 7-12: ~$45/month (1000+ users)

**Duration**: 4 hours

---

#### Task 8.3b: Cloudflare R2 File Storage Setup (Railway)
**Dependencies**: Task 8.3

**Why Cloudflare R2?**
- **FREE** for 10GB storage (perfect for 200 students)
- **Zero egress fees** (S3 charges $0.09/GB for downloads)
- **S3-compatible API** (drop-in replacement, works with AWS SDK)
- **Cost savings**: $60-120/year vs Railway Volumes or S3

**Use Cases**:
- Student essay submissions (PDF, DOCX)
- Teacher feedback files
- Content chapter text files
- Profile images

**Steps**:

1. **Create Cloudflare R2 Account**:
   - Visit https://dash.cloudflare.com
   - Sign up for Cloudflare account (free tier)
   - Navigate to R2 Object Storage
   - Click "Create Bucket"

2. **Create R2 Bucket**:
   ```
   Bucket Name: english-learning-files
   Location: Automatic (closest to users)
   Storage Class: Standard
   ```

3. **Generate R2 API Credentials**:
   - R2 Dashboard → Manage R2 API Tokens
   - Click "Create API Token"
   - Token Name: `learning-platform-production`
   - Permissions: "Object Read & Write"
   - Bucket: `english-learning-files`
   - Click "Create API Token"
   - **Save credentials** (shown only once):
     ```
     Access Key ID: <R2_ACCESS_KEY_ID>
     Secret Access Key: <R2_SECRET_ACCESS_KEY>
     Account ID: <R2_ACCOUNT_ID>
     ```

4. **Add R2 Environment Variables to Railway**:
   ```bash
   railway variables set R2_ACCOUNT_ID="your-account-id"
   railway variables set R2_ACCESS_KEY_ID="your-access-key-id"
   railway variables set R2_SECRET_ACCESS_KEY="your-secret-access-key"
   railway variables set R2_BUCKET_NAME="english-learning-files"
   railway variables set R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
   ```

5. **Install AWS SDK for R2 Integration**:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

6. **Create Storage Module** (`src/storage/storage.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { StorageService } from './storage.service';
   import { StorageController } from './storage.controller';

   @Module({
     imports: [ConfigModule],
     providers: [StorageService],
     controllers: [StorageController],
     exports: [StorageService],
   })
   export class StorageModule {}
   ```

7. **Create Storage Service** (`src/storage/storage.service.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
   import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

   @Injectable()
   export class StorageService {
     private readonly s3Client: S3Client;
     private readonly bucketName: string;

     constructor(
       private readonly configService: ConfigService,
       @InjectPinoLogger(StorageService.name)
       private readonly logger: PinoLogger,
     ) {
       const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
       this.bucketName = this.configService.get<string>('R2_BUCKET_NAME');

       this.s3Client = new S3Client({
         region: 'auto',
         endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
         credentials: {
           accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID'),
           secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
         },
       });

       this.logger.info({ bucketName: this.bucketName }, 'R2 Storage initialized');
     }

     /**
      * Generate pre-signed upload URL (valid for 1 hour)
      * Client uploads directly to R2, no server bandwidth used
      */
     async getUploadPresignedUrl(
       key: string,
       contentType: string,
       expiresIn = 3600,
     ): Promise<string> {
       const command = new PutObjectCommand({
         Bucket: this.bucketName,
         Key: key,
         ContentType: contentType,
       });

       const url = await getSignedUrl(this.s3Client, command, { expiresIn });

       this.logger.debug({ key, contentType, expiresIn }, 'Generated upload pre-signed URL');

       return url;
     }

     /**
      * Generate pre-signed download URL (valid for 1 hour)
      * Client downloads directly from R2, no egress fees
      */
     async getDownloadPresignedUrl(
       key: string,
       expiresIn = 3600,
     ): Promise<string> {
       const command = new GetObjectCommand({
         Bucket: this.bucketName,
         Key: key,
       });

       const url = await getSignedUrl(this.s3Client, command, { expiresIn });

       this.logger.debug({ key, expiresIn }, 'Generated download pre-signed URL');

       return url;
     }

     /**
      * Delete file from R2
      */
     async deleteFile(key: string): Promise<void> {
       const command = new DeleteObjectCommand({
         Bucket: this.bucketName,
         Key: key,
       });

       await this.s3Client.send(command);

       this.logger.info({ key }, 'File deleted from R2');
     }

     /**
      * Generate storage key for homework essay
      */
     generateHomeworkKey(studentId: string, homeworkId: string, filename: string): string {
       const timestamp = Date.now();
       const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
       return `homework/${studentId}/${homeworkId}/${timestamp}-${sanitizedFilename}`;
     }

     /**
      * Generate storage key for feedback file
      */
     generateFeedbackKey(homeworkId: string, filename: string): string {
       const timestamp = Date.now();
       const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
       return `feedback/${homeworkId}/${timestamp}-${sanitizedFilename}`;
     }
   }
   ```

8. **Create Storage Controller** (`src/storage/storage.controller.ts`):
   ```typescript
   import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
   import { StorageService } from './storage.service';
   import { GetUser } from '../auth/decorators/get-user.decorator';

   class GetUploadUrlDto {
     filename: string;
     contentType: string;
     homeworkId: string;
   }

   @ApiTags('Storage')
   @Controller('api/v1/storage')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth()
   export class StorageController {
     constructor(private readonly storageService: StorageService) {}

     @Post('upload-url')
     @ApiOperation({ summary: 'Get pre-signed URL for homework essay upload' })
     @ApiBody({ type: GetUploadUrlDto })
     async getUploadUrl(
       @GetUser('id') studentId: string,
       @Body() dto: GetUploadUrlDto,
     ) {
       const key = this.storageService.generateHomeworkKey(
         studentId,
         dto.homeworkId,
         dto.filename,
       );

       const uploadUrl = await this.storageService.getUploadPresignedUrl(
         key,
         dto.contentType,
       );

       return {
         uploadUrl,
         key,
         expiresIn: 3600,
       };
     }

     @Get('download-url/:key')
     @ApiOperation({ summary: 'Get pre-signed URL for file download' })
     async getDownloadUrl(@Param('key') key: string) {
       const downloadUrl = await this.storageService.getDownloadPresignedUrl(key);

       return {
         downloadUrl,
         expiresIn: 3600,
       };
     }

     @Delete(':key')
     @ApiOperation({ summary: 'Delete file from storage' })
     async deleteFile(@Param('key') key: string) {
       await this.storageService.deleteFile(key);

       return {
         message: 'File deleted successfully',
       };
     }
   }
   ```

9. **Update App Module** (`src/app.module.ts`):
   ```typescript
   import { StorageModule } from './storage/storage.module';

   @Module({
     imports: [
       // ... existing imports
       StorageModule,
     ],
   })
   export class AppModule {}
   ```

10. **Client-Side Upload Flow**:
    ```typescript
    // Frontend: Get upload URL
    const response = await fetch('/api/v1/storage/upload-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'my-essay.pdf',
        contentType: 'application/pdf',
        homeworkId: 'homework-123',
      }),
    });

    const { uploadUrl, key } = await response.json();

    // Upload file directly to R2 (no server bandwidth used!)
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: fileBlob,
    });

    // Save key to homework record
    await fetch(`/api/v1/homework/${homeworkId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        essayFileKey: key,
      }),
    });
    ```

**Cost Comparison (5GB storage, 200 students, 400 uploads/month)**:

| Storage Solution | Storage Cost | Egress Cost | Monthly Total | Annual Total |
|------------------|--------------|-------------|---------------|--------------|
| **Cloudflare R2** | **$0** | **$0** | **$0** | **$0** |
| AWS S3 | $0.115 | $0.225 | $0.34 | $4.08 |
| Railway Volumes | $1.25 | $0 | $1.25 | $15.00 |

**Savings**: $60-180/year by using Cloudflare R2

**Duration**: +3 hours

---

#### Task 8.3c: Railway Platform Cron for Homework Assignment
**Dependencies**: Task 8.3

**Why Railway Platform Cron?**
- **Built-in scheduler** (no extra services needed)
- **Pay-per-execution** (only charged for runtime, not 24/7)
- **5-minute minimum interval** (perfect for daily/weekly tasks)
- **Cost**: ~$0.50/month for daily 1-minute task

**Use Case**: Automatically assign weekly homework to all students every Monday at 8 AM

**Steps**:

1. **Create Cron Service** (`src/cron/homework-assignment.cron.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

   @Injectable()
   export class HomeworkAssignmentCron {
     constructor(
       private readonly prisma: PrismaService,
       @InjectPinoLogger(HomeworkAssignmentCron.name)
       private readonly logger: PinoLogger,
     ) {}

     /**
      * Assign weekly homework to all active students
      * Selects 10 words from their current reading level
      */
     async assignWeeklyHomework(): Promise<void> {
       this.logger.info('Starting weekly homework assignment');

       const students = await this.prisma.student.findMany({
         where: { active: true },
       });

       this.logger.info({ studentCount: students.length }, 'Found active students');

       const assignmentPromises = students.map(async (student) => {
         // Find words matching student's level
         const words = await this.prisma.word.findMany({
           where: {
             difficultyLevel: student.currentLevel,
           },
           take: 10,
           orderBy: {
             frequency: 'desc', // Prioritize high-frequency words
           },
         });

         if (words.length < 10) {
           this.logger.warn(
             { studentId: student.id, wordCount: words.length },
             'Not enough words for student level',
           );
           return null;
         }

         // Create homework assignment
         const homework = await this.prisma.homework.create({
           data: {
             studentId: student.id,
             dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
             status: 'ASSIGNED',
             assignedWords: {
               create: words.map((word) => ({
                 wordId: word.id,
                 completed: false,
               })),
             },
           },
           include: {
             assignedWords: true,
           },
         });

         this.logger.info(
           {
             studentId: student.id,
             homeworkId: homework.id,
             wordCount: homework.assignedWords.length,
           },
           'Homework assigned to student',
         );

         return homework;
       });

       const results = await Promise.allSettled(assignmentPromises);

       const successful = results.filter((r) => r.status === 'fulfilled').length;
       const failed = results.filter((r) => r.status === 'rejected').length;

       this.logger.info(
         { successful, failed, total: students.length },
         'Weekly homework assignment complete',
       );
     }
   }
   ```

2. **Create Cron Module** (`src/cron/cron.module.ts`):
   ```typescript
   import { Module } from '@nestjs/common';
   import { HomeworkAssignmentCron } from './homework-assignment.cron';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     providers: [HomeworkAssignmentCron],
     exports: [HomeworkAssignmentCron],
   })
   export class CronModule {}
   ```

3. **Create Cron Endpoint** (`src/cron/cron.controller.ts`):
   ```typescript
   import { Controller, Post, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
   import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
   import { ConfigService } from '@nestjs/config';
   import { HomeworkAssignmentCron } from './homework-assignment.cron';
   import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

   @ApiTags('Cron')
   @Controller('api/v1/cron')
   export class CronController {
     private readonly cronSecret: string;

     constructor(
       private readonly homeworkCron: HomeworkAssignmentCron,
       private readonly configService: ConfigService,
       @InjectPinoLogger(CronController.name)
       private readonly logger: PinoLogger,
     ) {
       this.cronSecret = this.configService.get<string>('CRON_SECRET');
     }

     @Post('assign-homework')
     @ApiOperation({ summary: 'Trigger weekly homework assignment (Railway cron only)' })
     @ApiHeader({ name: 'X-Cron-Secret', description: 'Cron secret for authentication' })
     async assignHomework(@Headers('x-cron-secret') secret: string) {
       // Verify cron secret to prevent unauthorized triggers
       if (secret !== this.cronSecret) {
         this.logger.warn({ providedSecret: secret }, 'Invalid cron secret');
         throw new UnauthorizedException('Invalid cron secret');
       }

       this.logger.info('Cron job triggered: Weekly homework assignment');

       await this.homeworkCron.assignWeeklyHomework();

       return {
         message: 'Weekly homework assigned successfully',
         timestamp: new Date().toISOString(),
       };
     }
   }
   ```

4. **Update App Module** (`src/app.module.ts`):
   ```typescript
   import { CronModule } from './cron/cron.module';
   import { CronController } from './cron/cron.controller';

   @Module({
     imports: [
       // ... existing imports
       CronModule,
     ],
     controllers: [
       // ... existing controllers
       CronController,
     ],
   })
   export class AppModule {}
   ```

5. **Add Cron Secret to Railway**:
   ```bash
   railway variables set CRON_SECRET=$(openssl rand -base64 32)

   # Get the secret value (needed for Railway cron config)
   railway variables get CRON_SECRET
   ```

6. **Configure Railway Platform Cron**:
   - Railway Dashboard → Your Project → Service
   - Click "Settings" tab
   - Scroll to "Cron Jobs" section
   - Click "Add Cron Job"
   - Configure:
     ```
     Name: Weekly Homework Assignment
     Schedule: 0 8 * * 1 (Every Monday at 8 AM)
     Command: curl -X POST https://your-app.railway.app/api/v1/cron/assign-homework \
              -H "X-Cron-Secret: YOUR_CRON_SECRET"
     ```
   - Click "Save"

7. **Alternative: NestJS Built-in Schedule** (if you need sub-5-minute intervals):
   ```bash
   npm install @nestjs/schedule
   ```

   Update `src/cron/homework-assignment.cron.ts`:
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { Cron, CronExpression } from '@nestjs/schedule';

   @Injectable()
   export class HomeworkAssignmentCron {
     // ... existing code

     @Cron(CronExpression.EVERY_MONDAY_AT_8AM)
     async handleWeeklyCron() {
       await this.assignWeeklyHomework();
     }
   }
   ```

   Update `src/app.module.ts`:
   ```typescript
   import { ScheduleModule } from '@nestjs/schedule';

   @Module({
     imports: [
       // ... existing imports
       ScheduleModule.forRoot(),
     ],
   })
   export class AppModule {}
   ```

   **Note**: NestJS schedule requires the app to run 24/7, increasing Railway costs. Use Railway platform cron for better cost efficiency.

**Cost Comparison**:

| Solution | Always-On Required | Monthly Cost | Best For |
|----------|-------------------|--------------|----------|
| **Railway Platform Cron** | ❌ No | **$0.50** | Daily/weekly tasks (5+ min intervals) |
| NestJS Schedule | ✅ Yes | $12-18 | Sub-5-minute intervals |
| EventBridge + Lambda (AWS) | ❌ No | $0.003 | AWS deployments only |

**Duration**: +2 hours

---

#### Task 8.3d: Updated Cost Estimates for 200 Students
**Dependencies**: Task 8.3, 8.3b, 8.3c

**Monthly Cost Breakdown (Railway Production)**:

| Component | Month 1-3 | Month 4-6 | Month 7-12 | Notes |
|-----------|-----------|-----------|------------|-------|
| Railway App (512MB) | $5 | $5 | $5 | Hobby plan |
| PostgreSQL (2GB) | $5 | $8 | $10 | Grows with data |
| Bandwidth (50GB) | $2 | $5 | $8 | 200 students |
| Cron Jobs (daily) | $0.50 | $0.50 | $0.50 | 1 min/day |
| **Cloudflare R2** | **$0** | **$0** | **$0** | Free tier (10GB) |
| **Total** | **$12.50** | **$18.50** | **$23.50** | **Very affordable** |

**Annual Cost Projection (200 students)**:
- Year 1: ~$220 (growing from $12 to $24/month)
- Year 2: ~$300 (stable at $25/month)
- **2-Year Total**: ~$520

**Comparison with Alternatives**:

| Platform | Setup Time | 2-Year Cost | Complexity |
|----------|------------|-------------|------------|
| **Railway** | **30 min** | **$520** | **Low** |
| Render | 45 min | $840 | Low |
| AWS App Runner | 4 hours | $720 | High |
| AWS Elastic Beanstalk | 8 hours | $960 | Very High |

**Storage Cost Savings with Cloudflare R2**:

| Scenario | Railway Volumes | AWS S3 | Cloudflare R2 | Savings |
|----------|----------------|--------|---------------|---------|
| 5GB storage, 200 students | $1.25/mo | $0.34/mo | **$0/mo** | **$15/year** |
| 10GB storage, 400 students | $2.50/mo | $0.68/mo | **$0/mo** | **$30/year** |
| 20GB storage, 1000 students | $5.00/mo | $1.36/mo | $0.25/mo | **$60/year** |

**Key Insights**:
- Railway is **6-10x cheaper** than AWS for 200 students
- Cloudflare R2 saves **$15-60/year** on file storage
- Total cost: **$25/month or less** for 200 students
- **Perfect fit** for small to medium-scale deployment

**When Railway Becomes Too Expensive** (Migration Triggers):
1. Monthly bill exceeds **$80** (400+ active students)
2. Database size exceeds **30GB** (years of data)
3. Bandwidth exceeds **500GB/month** (10K+ requests/day)
4. Need multi-region deployment or advanced scaling

**Duration**: N/A (analysis only)

---

#### Task 8.3e: Migration Strategy - Railway to AWS
**Dependencies**: Task 8.3d

**When to Migrate**:

| Metric | Railway Limit | AWS Recommended | Cost Impact |
|--------|---------------|-----------------|-------------|
| Monthly Cost | >$80 | $25-35 (App Runner) | 55% savings |
| Active Students | >1000 | Unlimited | Better pricing |
| Database Size | >30GB | Up to 1TB+ | Better I/O |
| Requests/Day | >50K | Millions | Auto-scaling |

**Migration Timeline**: 40-60 hours over 2 weeks

**Phase 1: AWS Infrastructure Setup (20 hours)**:
1. Create AWS account and configure IAM roles (3 hours)
2. Set up RDS PostgreSQL with db.t4g.micro (3 hours)
3. Configure S3 bucket (or continue with R2) (2 hours)
4. Create App Runner service with auto-deploy (4 hours)
5. Set up EventBridge + Lambda for cron jobs (3 hours)
6. Configure CloudWatch logging and alarms (3 hours)
7. Set up Parameter Store for secrets (2 hours)

**Phase 2: Data Migration (10 hours)**:
1. **Database Export from Railway**:
   ```bash
   railway run pg_dump $DATABASE_URL > railway-backup.sql
   ```

2. **Database Import to RDS**:
   ```bash
   psql -h your-rds-endpoint.amazonaws.com \
        -U postgres \
        -d learning_platform \
        -f railway-backup.sql
   ```

3. **File Migration** (if using S3 instead of R2):
   ```bash
   # If migrating from R2 to S3
   aws s3 sync r2://bucket s3://your-bucket --source-region auto
   ```

4. **Verify Data Integrity**:
   ```bash
   # Compare record counts
   railway run npx prisma db execute --stdin < count-records.sql
   aws rds-data execute-statement ... # Compare counts
   ```

**Phase 3: Application Deployment (8 hours)**:
1. Build Docker image and push to ECR (2 hours)
2. Deploy to App Runner with environment variables (2 hours)
3. Configure custom domain and SSL (1 hour)
4. Set up GitHub Actions for CI/CD (2 hours)
5. Smoke testing and verification (1 hour)

**Phase 4: Cutover & Verification (5 hours)**:
1. **Parallel Run** (2 days):
   - Run both Railway and AWS simultaneously
   - Route 10% traffic to AWS, monitor for errors
   - Gradually increase to 50%, then 100%

2. **DNS Cutover**:
   ```bash
   # Update DNS to point to AWS App Runner
   CNAME api.yourdomain.com → xxx.us-east-1.awsapprunner.com
   ```

3. **Monitor for 24 hours**:
   - Check error rates in CloudWatch
   - Verify cron jobs executing correctly
   - Monitor database performance
   - Check file upload/download success rate

4. **Decommission Railway**:
   ```bash
   # After 1 week of stable AWS operation
   railway down
   ```

**Phase 5: Cost Optimization (5 hours)**:
1. Right-size RDS instance (start with db.t4g.micro)
2. Enable RDS auto-scaling for storage
3. Set up CloudWatch cost alerts
4. Review and optimize Lambda memory allocation
5. Enable S3 Intelligent-Tiering (if using S3)

**Rollback Plan** (if migration fails):
1. Revert DNS to Railway (5 minutes)
2. Restore Railway database from backup (if needed)
3. Resume Railway service
4. Total rollback time: **15 minutes**

**Cost Comparison After Migration**:

| Component | Railway (1000 students) | AWS (1000 students) | Savings |
|-----------|-------------------------|---------------------|---------|
| Compute | $35 | $20 (App Runner) | -$15 |
| Database | $25 | $12 (db.t4g.micro) | -$13 |
| Storage (R2) | $0 | $0 (keep R2) | $0 |
| Bandwidth | $15 | $0 (included) | -$15 |
| Cron Jobs | $1 | $0.003 (Lambda) | -$1 |
| **Total** | **$76** | **$32** | **-$44/mo** |

**Annual Savings After Migration**: ~$528/year

**Break-Even Point**: Migration effort pays for itself in 2-3 months

**Recommended Migration Path**:
1. **Months 1-12**: Railway ($12-25/month, 200 students)
2. **Months 13-24**: Railway ($25-60/month, 500 students)
3. **Month 25+**: Migrate to AWS when bill >$80/month (1000+ students)

**Alternative: Stay on Railway If...**:
- Student count stays below 500
- Monthly bill stays below $60
- Team prefers simplicity over cost optimization
- No advanced features needed (multi-region, compliance)

**Reference**: See `AWS_DEPLOYMENT_REFERENCE.md` for complete AWS deployment guide with CloudFormation/Terraform templates.

**Duration**: 40-60 hours over 2 weeks

---

#### Task 8.4: Database Migration & Seeding
**Dependencies**: Task 8.2 or 8.3

**Steps**:

1. **Verify Migrations Applied**:

   **Render**:
   - Dashboard → Service → Logs
   - Look for: "Running migrations..." and "Migration complete"

   **Railway**:
   ```bash
   railway run npx prisma migrate status

   # Should show all migrations applied
   ```

2. **Seed Production Database** (Optional):
   ```bash
   # For Railway
   railway run npm run prisma:seed

   # For Render
   # SSH into container (Render Dashboard → Shell)
   npm run prisma:seed
   ```

3. **Create Admin User** (if needed):
   ```typescript
   // prisma/seed-production.ts
   import { PrismaClient } from '@prisma/client';
   import * as bcrypt from 'bcryptjs';

   const prisma = new PrismaClient();

   async function main() {
     const hashedPassword = await bcrypt.hash('SECURE_ADMIN_PASSWORD', 10);

     await prisma.student.upsert({
       where: { email: 'admin@yourdomain.com' },
       update: {},
       create: {
         username: 'admin',
         email: 'admin@yourdomain.com',
         password: hashedPassword,
         firstName: 'Admin',
         lastName: 'User',
         currentLevel: 'ADVANCED',
       },
     });

     console.log('✅ Admin user created');
   }

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

   Run:
   ```bash
   railway run ts-node prisma/seed-production.ts
   ```

4. **Backup Database**:

   **Railway**:
   ```bash
   # Get database URL
   DB_URL=$(railway variables get DATABASE_URL)

   # Create backup
   railway run pg_dump $DB_URL > backup-$(date +%Y%m%d).sql

   # Verify backup
   ls -lh backup-*.sql
   ```

**Duration**: 1 hour

---

#### Task 8.5: Monitoring & Logging Setup
**Dependencies**: Task 8.3

**Steps**:

1. **Verify Pino Logging**:

   Check logs are streaming correctly:
   ```bash
   # Railway
   railway logs --follow

   # Look for structured JSON logs:
   # {"level":30,"time":1234567890,"msg":"Login successful","studentId":"..."}
   ```

2. **Set Up Log Filtering**:

   Create log queries in Railway/Render dashboard:
   - **Error Logs**: Filter by `level: 50` (Pino error level)
   - **Auth Events**: Filter by `msg: "Login"` or `msg: "Registration"`
   - **API Errors**: Filter by `statusCode: 500` or `statusCode: 400`

3. **Configure Alerts** (Railway Pro plan):
   - Dashboard → Project → Settings → Notifications
   - Add Slack/Discord webhook
   - Alert triggers:
     - Deployment failure
     - Memory usage >90%
     - Application crash
     - Health check failure

4. **Performance Monitoring**:

   Monitor key metrics in Railway/Render dashboard:
   - **Response Time**: Target <200ms (p95)
   - **Memory Usage**: Should be stable, <512MB
   - **CPU Usage**: Should be <50% under normal load
   - **Database Connections**: Monitor connection pool usage

5. **Set Up External Monitoring** (Optional):

   **UptimeRobot** (Free tier - recommended):
   ```
   1. Visit https://uptimerobot.com
   2. Add New Monitor
   3. Type: HTTP(s)
   4. URL: https://your-app-url/api/v1/health
   5. Interval: 5 minutes
   6. Alert Contacts: Your email
   ```

   This will:
   - Ping health endpoint every 5 minutes
   - Alert you if site goes down
   - Provide uptime statistics

**Duration**: 2 hours

---

#### Task 8.6: Documentation & Handoff
**Dependencies**: All previous tasks

**Steps**:

1. **Update README.md**:
   ```markdown
   # Learning Platform API

   ## Production Deployment

   **Live API**: https://learning-platform-api.up.railway.app
   **API Documentation**: https://learning-platform-api.up.railway.app/api-docs
   **Status**: ✅ Deployed

   ## Quick Start

   ### Register a new student
   ```bash
   curl -X POST https://learning-platform-api.up.railway.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "john_doe",
       "email": "john@example.com",
       "password": "SecurePass123",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

   ### Login
   ```bash
   curl -X POST https://learning-platform-api.up.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "SecurePass123"
     }'
   ```

   ## Deployment Information

   - **Platform**: Railway
   - **Database**: PostgreSQL 15 (Railway)
   - **CI/CD**: GitHub Actions
   - **Monitoring**: Railway Dashboard + UptimeRobot
   - **Logs**: Pino (JSON structured)

   ## Environment Variables

   See `.env.production.example` for required environment variables.

   ## Deployment Commands

   ```bash
   # Deploy to Railway
   railway up

   # Check status
   railway status

   # View logs
   railway logs --follow

   # Rollback
   railway rollback
   ```
   ```

2. **Create DEPLOYMENT.md**:
   ```markdown
   # Deployment Guide

   ## Production Environment

   - **URL**: https://learning-platform-api.up.railway.app
   - **Dashboard**: https://railway.app/project/[project-id]
   - **Database**: PostgreSQL 15 (Railway-managed)
   - **Logs**: Railway Dashboard → Logs tab
   - **Metrics**: Railway Dashboard → Metrics tab

   ## Deployment Process

   ### Automatic Deployment (Recommended)

   Push to `main` branch triggers automatic deployment:
   ```bash
   git push origin main
   ```

   GitHub Actions will:
   1. Run tests
   2. Build application
   3. Deploy to Railway
   4. Run health check
   5. Notify team of status

   ### Manual Deployment

   ```bash
   railway up
   ```

   ## Rollback Procedure

   If deployment fails:

   1. **Via Railway Dashboard**:
      - Go to Deployments tab
      - Click "..." on last successful deployment
      - Click "Redeploy"

   2. **Via CLI**:
      ```bash
      railway rollback
      ```

   3. **Via Git**:
      ```bash
      git revert HEAD
      git push origin main
      ```

   ## Database Migrations

   Migrations run automatically on deployment via start command:
   ```
   npx prisma migrate deploy && npm run start:prod
   ```

   To run manually:
   ```bash
   railway run npx prisma migrate deploy
   ```

   ## Emergency Contacts

   - **Technical Lead**: [email]
   - **DevOps**: [email]
   - **Railway Support**: https://railway.app/help

   ## Monitoring & Alerts

   - **Uptime**: https://uptimerobot.com
   - **Logs**: Railway Dashboard
   - **Alerts**: Slack channel #deployments
   ```

3. **Create Operations Runbook**:
   Create `RUNBOOK.md` with common operational tasks:
   - How to check application health
   - How to restart the service
   - How to scale resources
   - How to investigate errors
   - How to restore from backup

4. **Team Handoff Checklist**:
   - [ ] Production URL shared with team
   - [ ] API documentation URL shared
   - [ ] Railway dashboard access granted to team
   - [ ] GitHub Actions workflows explained
   - [ ] Deployment process documented
   - [ ] Rollback procedure tested
   - [ ] Monitoring alerts configured
   - [ ] Team trained on Railway CLI
   - [ ] Emergency procedures documented

**Duration**: 2 hours

---

#### Task 8.7: Production Verification & Testing
**Dependencies**: All previous tasks

**Comprehensive Production Testing**:

1. **Health Check**:
   ```bash
   curl https://your-app-url/api/v1/health | jq

   # Verify:
   # - status: "healthy"
   # - database: "connected"
   # - uptime > 0
   ```

2. **API Documentation**:
   - Visit `https://your-app-url/api-docs`
   - Verify all endpoints listed
   - Test "Try it out" feature works

3. **Authentication Flow**:
   ```bash
   # 1. Register
   TOKEN=$(curl -s -X POST https://your-app-url/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "test_user",
       "email": "test@example.com",
       "password": "TestPass123",
       "firstName": "Test",
       "lastName": "User"
     }' | jq -r '.accessToken')

   # 2. Get Profile
   curl -s -H "Authorization: Bearer $TOKEN" \
     https://your-app-url/api/v1/auth/profile | jq

   # 3. Verify response contains user data
   ```

4. **Database Operations**:
   ```bash
   # Create content
   curl -X POST https://your-app-url/api/v1/content \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Content Item",
       "author": "Test Author",
       "description": "Production test",
       "publishedYear": 2024,
       "averageDifficulty": 50
     }' | jq

   # List content
   curl -H "Authorization: Bearer $TOKEN" \
     https://your-app-url/api/v1/content?page=1&limit=10 | jq
   ```

5. **Error Handling**:
   ```bash
   # Test invalid credentials
   curl -s -X POST https://your-app-url/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "wrong@example.com",
       "password": "wrongpassword"
     }' | jq

   # Should return 401 Unauthorized
   ```

6. **Rate Limiting**:
   ```bash
   # Send 150 requests rapidly (limit is 100/min)
   for i in {1..150}; do
     curl -s -o /dev/null -w "%{http_code}\n" \
       https://your-app-url/api/v1/health
   done

   # Should see some 429 (Too Many Requests) responses
   ```

7. **Performance Check**:
   ```bash
   # Measure response time
   time curl -s https://your-app-url/api/v1/health > /dev/null

   # Should be < 200ms for health endpoint
   ```

**Sign-Off Criteria**:
- [ ] Health endpoint returns 200 OK
- [ ] All API endpoints accessible via Swagger
- [ ] User registration works end-to-end
- [ ] User login returns valid JWT token
- [ ] Protected endpoints require authentication
- [ ] Database operations (CRUD) work correctly
- [ ] Rate limiting is active
- [ ] Error responses are properly formatted
- [ ] Logs are streaming to dashboard
- [ ] No critical errors in logs
- [ ] Response times < 200ms (p95)
- [ ] Memory usage stable
- [ ] Database migrations all applied

**Duration**: 2 hours

---

## Deployment Timeline Summary

**Total Deployment Time: 13-17 hours (spread over Week 6)**

| Day | Tasks | Duration |
|-----|-------|----------|
| **Day 1-2** | Choose platform, deploy to Render/Railway, configure env vars | 4-6 hours |
| **Day 3** | Database migration & seeding, verify data | 2 hours |
| **Day 4** | Set up monitoring, logging, alerts | 2-3 hours |
| **Day 5** | Documentation, runbooks, team handoff | 2 hours |
| **Day 6-7** | Production verification, load testing, buffer for issues | 3-4 hours |

---

## TECHNOLOGY STACK

### Backend Framework
- **Node.js 18+**: JavaScript runtime
- **TypeScript 5.3+**: Type-safe development
- **NestJS 10.x**: Progressive Node.js framework

### Database
- **PostgreSQL**: Relational database
- **Prisma 5.7**: ORM with type safety

### Authentication & Security
- **@nestjs/jwt**: JWT token generation
- **@nestjs/passport**: Authentication strategies
- **passport-jwt**: JWT passport strategy
- **bcryptjs**: Password hashing
- **helmet**: Security headers
- **@nestjs/throttler**: Rate limiting

### Validation
- **class-validator**: Decorator-based validation
- **class-transformer**: Object transformation

### Documentation
- **@nestjs/swagger**: Automatic OpenAPI generation
- **swagger-ui-express**: Interactive API docs

### Testing
- **Jest**: Test framework (included with NestJS)
- **@nestjs/testing**: NestJS testing utilities
- **supertest**: HTTP assertion library

### Configuration
- **@nestjs/config**: Configuration management

### Logging
- **nestjs-pino**: NestJS wrapper for Pino logger
- **pino-http**: HTTP logging middleware for Pino
- **pino-pretty** (dev): Pretty-printing for development

### Deployment & DevOps
- **Railway** (Recommended): Platform-as-a-Service for production deployment
- **Render**: Free tier for MVP testing, production-ready paid tiers
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **Docker**: Containerization for AWS/GCP deployment (optional)
- **AWS Elastic Beanstalk**: Enterprise-grade deployment platform (optional)

### Monitoring
- **Railway Dashboard**: Built-in metrics, logs, and deployment history
- **Render Dashboard**: Service metrics and log streaming
- **UptimeRobot** (Optional): External uptime monitoring and alerts
- **CloudWatch** (AWS): Log aggregation and metrics (if using AWS)

---

## PROJECT STRUCTURE

```
/learning-platform
├── src/
│   ├── auth/                       # Authentication module
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.spec.ts
│   │
│   ├── students/                   # Student module
│   │   ├── dto/
│   │   ├── students.controller.ts
│   │   ├── students.service.ts
│   │   └── students.module.ts
│   │
│   ├── content/                      # Content module
│   │   ├── dto/
│   │   ├── content.controller.ts
│   │   ├── content.service.ts
│   │   └── content.module.ts
│   │
│   ├── chapters/                   # Chapters module
│   ├── words/                      # Words module
│   ├── homework/                   # Homework module
│   ├── quizzes/                    # Quizzes module
│   ├── quiz-attempts/              # Quiz attempts module
│   ├── progress/                   # Progress tracking module
│   │
│   ├── prisma/                     # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── common/                     # Shared utilities
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │       └── pagination.util.ts
│   │
│   ├── config/                     # Configuration
│   │   └── configuration.ts
│   │
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts                     # Entry point
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Migration files
│   └── seed.ts                     # Database seeding
│
├── test/                           # E2E tests
│   ├── auth.e2e-spec.ts
│   ├── content.e2e-spec.ts
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│
├── .env                            # Environment variables
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json                   # NestJS CLI configuration
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

**NestJS Module Architecture**:
```
Module
├── Controllers (Handle HTTP requests)
├── Services (Business logic)
├── Repositories (optional - we use Prisma directly)
├── DTOs (Validation & transformation)
├── Guards (Authorization)
├── Interceptors (Transform responses)
└── Pipes (Validation)
```

---

## API ENDPOINTS SUMMARY

### Phase 1 Endpoints (~40 total)

All endpoints prefixed with `/api/v1`

#### Authentication (3 endpoints)
```
POST   /auth/register
POST   /auth/login
GET    /auth/profile
```

#### Students (2 endpoints)
```
GET    /students/:id
PATCH  /students/:id
```

#### Content (5 endpoints)
```
GET    /content?page=1&limit=20&difficulty=50&include=chapters
GET    /content/:id?include=chapters
POST   /content
PATCH  /content/:id
DELETE /content/:id
```

#### Chapters (5 endpoints)
```
GET    /chapters?contentId=xxx
GET    /chapters/:id?include=sentences
POST   /chapters
PATCH  /chapters/:id
DELETE /chapters/:id
```

#### Words (5 endpoints)
```
GET    /words?difficulty=50&page=1
GET    /words/:id?include=definitions,examples
POST   /words
PATCH  /words/:id
DELETE /words/:id
```

#### Homework (4 endpoints)
```
POST   /homework
GET    /homework/:studentId?status=ACTIVE&include=words
GET    /homework/:id?include=words.progress
PATCH  /homework-words/:id/complete
```

#### Quizzes (8 endpoints)
```
POST   /quizzes
GET    /quizzes?page=1
GET    /quizzes/:id?include=questions
POST   /quiz-attempts
GET    /quiz-attempts/:id
POST   /quiz-attempts/:id/answers
POST   /quiz-attempts/:id/complete
GET    /quiz-attempts/student/:studentId
```

#### Progress (4 endpoints)
```
GET    /progress/:studentId?status=LEARNING&include=word
PATCH  /progress/:studentId/words/:wordId
POST   /progress/:studentId/words/:wordId/track
GET    /progress/:studentId/review-queue
```

---

## TESTING STRATEGY

### Unit Tests
**Focus**: Services and business logic
**Mock**: PrismaService, external dependencies
**Tools**: Jest + @nestjs/testing

**Advantages with NestJS**:
- Built-in `Test.createTestingModule()` for DI
- Automatic mock creation
- Easy service isolation

**Example**:
```typescript
const module = await Test.createTestingModule({
  providers: [
    AuthService,
    { provide: PrismaService, useValue: mockPrisma },
    { provide: JwtService, useValue: mockJwt },
  ],
}).compile();
```

### Integration Tests
**Focus**: Controllers and HTTP layer
**Use**: Real database (test database)
**Tools**: Jest + Supertest + @nestjs/testing

**Example**:
```typescript
const app = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

const nestApp = app.createNestApplication();
await nestApp.init();

await request(nestApp.getHttpServer())
  .post('/api/v1/auth/register')
  .send(dto)
  .expect(201);
```

### E2E Tests
**Focus**: Complete user workflows
**Use**: Real database, all services

**Scenarios**:
1. Student registration → login → view homework → complete words
2. Create quiz → start attempt → submit answers → complete quiz
3. Track word → update progress → view review queue

### Coverage Goals
- **Services**: 80%+
- **Controllers**: 80%+
- **Overall**: 80%+

---

## POTENTIAL CHALLENGES & SOLUTIONS

### 1. Decorator Syntax Learning Curve
**Challenge**: Team unfamiliar with decorators, dependency injection
**Solution**:
- Allocate 1 week for NestJS fundamentals course
- Pair programming for first few modules
- Reference official NestJS documentation (excellent quality)

### 2. Over-Engineering Risk
**Challenge**: NestJS encourages many abstractions (guards, interceptors, pipes)
**Solution**:
- Start simple (controllers + services + DTOs)
- Add guards/interceptors only when needed
- Follow "You Aren't Gonna Need It" (YAGNI) principle

### 3. Testing Database Cleanup
**Challenge**: E2E tests can leave data in database
**Solution**:
- Use separate test database
- Implement `beforeEach` cleanup in test setup
- Consider transactions with rollback (more complex but cleaner)

### 4. Circular Dependencies
**Challenge**: NestJS modules can create circular dependencies
**Solution**:
- Use `forwardRef()` when necessary
- Restructure modules to avoid circular imports
- Move shared services to common module

### 5. Prisma + NestJS Integration
**Challenge**: Prisma types not auto-injected in NestJS
**Solution**:
- Create global PrismaModule with `@Global()` decorator
- Export PrismaService for use in all modules
- No need for repository pattern (Prisma already provides great API)

---

## DEVELOPMENT WORKFLOW

### Daily Development Cycle
1. Pull latest code
2. Run migrations: `npm run prisma:migrate`
3. Start dev server: `npm run start:dev` (hot-reload enabled)
4. Write feature (module → service → controller → DTO)
5. Write tests (unit + e2e)
6. Run tests: `npm test`
7. Check coverage: `npm run test:cov`
8. Lint: `npm run lint`
9. Format: `npm run format`
10. Commit changes (conventional commits)

### Git Commit Convention
```
feat(auth): add JWT authentication with refresh tokens
fix(content): correct pagination total count calculation
test(homework): add e2e tests for completion workflow
docs(api): update Swagger descriptions for quiz endpoints
refactor(progress): extract spaced repetition to utility
```

### Code Review Checklist
- [ ] Follows NestJS module structure
- [ ] DTOs have class-validator decorators
- [ ] Services use dependency injection
- [ ] Controllers have Swagger decorators (@ApiOperation, @ApiResponse)
- [ ] Guards applied where authentication needed
- [ ] Unit tests for services (80% coverage)
- [ ] E2E tests for critical endpoints
- [ ] No sensitive data in logs
- [ ] Prisma queries optimized (use `include` wisely)
- [ ] Error handling with proper HTTP exceptions

---

## WHY NESTJS?

### Benefits for This Project

1. **30-40% Faster Development**
   - Built-in validation, guards, interceptors
   - Automatic Swagger documentation
   - DI container eliminates boilerplate

2. **Perfect for DDD Architecture**
   - Modules map to bounded contexts
   - Clear separation of concerns
   - Dependency injection enforces clean architecture

3. **Superior Testing**
   - Built-in testing utilities
   - Easy mocking with DI
   - Realistic E2E testing setup

4. **Team Growth Ready**
   - Standard patterns across all modules
   - Excellent documentation
   - Strong typing with TypeScript

5. **GraphQL Migration Path**
   - Seamless @nestjs/graphql integration
   - Can run REST + GraphQL side-by-side
   - Code-first or schema-first approaches

6. **Production-Grade Logging**
   - Pino logger integration (5x faster than Winston)
   - Automatic request context via AsyncLocalStorage
   - Built-in PII redaction for student data
   - Structured JSON logging for CloudWatch/DataDog

### Trade-offs Accepted

1. **Learning Curve**: 1-2 weeks for team to become proficient
   - **Mitigation**: Excellent official docs, large community

2. **Opinionated Structure**: Must follow NestJS patterns
   - **Mitigation**: Patterns are industry best practices

3. **Larger Bundle**: ~50MB vs Express ~1.2MB
   - **Mitigation**: Not an issue for server-side applications

---

## NEXT STEPS AFTER PHASE 1

**Note**: Deployment is now included in Phase 1 (Milestone 8), so the MVP will already be live!

1. **User acceptance testing** with real students
   - Gather feedback from early users
   - Monitor error rates and performance metrics
   - Iterate on user experience

2. **Performance optimization** (database query analysis, caching)
   - Add Redis caching for frequently accessed data
   - Optimize N+1 queries
   - Implement database query indexing
   - Consider CDN for static assets

3. **Monitoring & Analytics Setup**
   - Set up error tracking (Sentry or similar)
   - Implement custom analytics dashboards
   - Monitor user behavior and API usage patterns
   - Track key metrics (active users, quiz completion rates)

4. **Phase 2 planning** (Advanced Features):
   - **Essay Feedback System** - See `ESSAY_FEEDBACK_FEATURE_PLAN.md` for detailed 6-week plan
     - Content-based essay assignments (Teacher, EssayAssignment, Essay models)
     - Word document upload and PDF conversion (Cloudflare R2 + LibreOffice)
     - External annotation workflow for teachers
     - Iterative feedback and revision cycles
     - Version tracking and side-by-side comparison
   - Spaced repetition refinement (SM-2 algorithm)
   - Email notifications (@nestjs/mailer + SendGrid) - *Partially implemented for essays*
   - Advanced quiz types (FILL_BLANK, USAGE, LISTENING)
   - Analytics dashboards with aggregations
   - GraphQL evaluation (@nestjs/graphql)
   - WebSockets for real-time quiz sessions (@nestjs/websockets)
   - Mobile app integration (React Native or Flutter)
   - Admin dashboard for teachers
   - Payment integration (Stripe) for premium features

5. **Scaling Strategy** (if user growth exceeds 5000 students):
   - Migrate from Railway to AWS Elastic Beanstalk
   - Implement horizontal scaling
   - Add read replicas for database
   - Consider microservices architecture for quiz engine

---

**Last Updated**: 2025-12-08
**Framework**: NestJS 10.x
**Status**: Ready for implementation
**Estimated Timeline**: 5-6 weeks (accelerated from 8 weeks with Express)
