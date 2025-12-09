# ESSAY FEEDBACK ITERATION FEATURE - IMPLEMENTATION PLAN
## English Learning Platform - Content-Based Essay Writing & Review System

**Status**: Phase 2 Enhancement - Ready to Start After Phase 1 Completion
**Dependencies**: Phase 1 foundation (Student, Content, Auth modules)
**Duration**: 6 weeks
**Stack**: NestJS + Prisma + PostgreSQL + Cloudflare R2 + LibreOffice (PDF conversion)
**Architecture**: Extends existing Modular Monolith with new Essay Management Module
**API Style**: RESTful (consistent with Phase 1)

**Last Updated**: December 9, 2025

---

## IMPLEMENTATION STATUS

### ✅ Foundation Completed (December 9, 2025)
- **Database Schema**: All essay models created and migrated
  - Teacher model
  - EssayAssignment model (with Content relation)
  - Essay model
  - EssaySubmission model (with version tracking)
  - TeacherFeedback model
- **Seed Data**: Test data loaded including:
  - Teacher account: `teacher@test.com` / `password123`
  - Sample essay assignment: "Character Analysis: The Great Gatsby"
  - Essay with 2 versions (v1 with feedback, v2 awaiting review)
  - Teacher feedback for version 1
- **Infrastructure Ready**:
  - NestJS framework configured
  - Prisma ORM with PostgreSQL 16
  - File paths planned for Cloudflare R2 storage

### ⏳ Waiting for Phase 1 Completion
Before implementing essay features, Phase 1 must complete:
- Milestone 1: Authentication & Authorization (JWT, Passport)
- Milestone 2: Student Management
- Milestone 3: Content Management (required for essay-content linking)

### 📋 Ready to Implement (After Phase 1)
Once Phase 1 completes (estimated Week 5-6), essay implementation can begin following the milestones below.

---

## TABLE OF CONTENTS

1. [Feature Overview](#feature-overview)
2. [Database Schema](#database-schema)
3. [Implementation Timeline](#implementation-timeline)
4. [Milestone Breakdown](#milestone-breakdown)
5. [API Endpoints](#api-endpoints)
6. [File Storage Architecture](#file-storage-architecture)
7. [Integration with Existing Modules](#integration-with-existing-modules)
8. [Testing Strategy](#testing-strategy)

---

## FEATURE OVERVIEW

### Goals
- Enable content-based essay assignments (linked to books, articles, videos, podcasts)
- Support iterative writing and feedback cycles
- Simple external annotation workflow for teachers
- Version tracking and comparison for student progress
- Unlimited revision iterations with manual completion

### User Workflows

#### Teacher Workflow
1. **Assign Essay**: Select Content item (book chapter, article, video) → Create assignment with prompt and due date
2. **Review Submission**: Download student's PDF → Annotate in external tool (Adobe, Preview, etc.) → Upload annotated PDF + written feedback
3. **Compare Versions**: View side-by-side comparison of version N and N-1 to see student improvements
4. **Complete Essay**: Mark essay as complete when satisfied with final version

#### Student Workflow
1. **Receive Assignment**: View essay prompt linked to specific Content
2. **Write Essay**: Compose in Microsoft Word (offline/online)
3. **Submit Version**: Upload .docx file → System converts to PDF automatically
4. **Receive Feedback**: View annotated PDF and teacher comments
5. **Revise**: Incorporate feedback → Submit new version (repeat until complete)

### Key Features
- **Content-Based**: Every essay is tied to a Content item (book, article, video, podcast)
- **Simple File Handling**: Word upload only (no rich text editor complexity)
- **External Annotation**: Teachers use familiar tools (no built-in annotator)
- **Version Tracking**: Unlimited iterations with full history
- **Side-by-Side Comparison**: Compare any two versions to see improvements

---

## DATABASE SCHEMA

### New Models

```prisma
// Teacher role (extends Student pattern)
model Teacher {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  password     String   // Hashed with bcrypt
  firstName    String
  lastName     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  assignments  EssayAssignment[]
  feedback     TeacherFeedback[]

  @@index([email])
  @@index([username])
}

// Essay assignment based on Content
model EssayAssignment {
  id          String   @id @default(cuid())
  contentId   String   // Foreign key to Content (book, article, video, podcast)
  teacherId   String   // Teacher who created the assignment
  title       String
  prompt      String   @db.Text // Essay prompt/instructions
  dueDate     DateTime?
  maxVersions Int?     // Optional limit on revisions (null = unlimited)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  content     Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  essays      Essay[]

  @@index([contentId])
  @@index([teacherId])
  @@index([dueDate])
}

// Student's essay instance
model Essay {
  id           String   @id @default(cuid())
  assignmentId String
  studentId    String   // Foreign key to Student
  status       String   @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED
  completedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  assignment   EssayAssignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student      Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  submissions  EssaySubmission[]

  @@unique([assignmentId, studentId]) // One essay per student per assignment
  @@index([studentId])
  @@index([status])
}

// Individual submission version
model EssaySubmission {
  id              String   @id @default(cuid())
  essayId         String
  versionNumber   Int      // 1, 2, 3, ...
  originalDocxUrl String   // Cloudflare R2 URL to .docx file
  pdfUrl          String   // Cloudflare R2 URL to auto-generated PDF
  annotatedPdfUrl String?  // Cloudflare R2 URL to teacher's annotated PDF
  status          String   @default("SUBMITTED") // SUBMITTED, UNDER_REVIEW, FEEDBACK_RECEIVED
  submittedAt     DateTime @default(now())

  // Relations
  essay           Essay             @relation(fields: [essayId], references: [id], onDelete: Cascade)
  feedback        TeacherFeedback[]

  @@unique([essayId, versionNumber]) // Unique version number per essay
  @@index([essayId])
  @@index([status])
}

// Teacher feedback on submission
model TeacherFeedback {
  id           String   @id @default(cuid())
  submissionId String
  teacherId    String
  feedbackText String   @db.Text // Written feedback
  createdAt    DateTime @default(now())

  // Relations
  submission   EssaySubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  teacher      Teacher         @relation(fields: [teacherId], references: [id])

  @@index([submissionId])
  @@index([teacherId])
}
```

### Schema Updates to Existing Models

```prisma
// Update Student model to add essay relation
model Student {
  // ... existing fields ...
  essays Essay[]
}

// Update Content model to add essay assignment relation
model Content {
  // ... existing fields ...
  essayAssignments EssayAssignment[]
}
```

---

## IMPLEMENTATION TIMELINE

### Week 1: Database & Backend Foundation
- **Milestone 1**: Database schema migration
  - Add Teacher, EssayAssignment, Essay, EssaySubmission, TeacherFeedback models
  - Update Student and Content models with relations
  - Create Prisma migration and seed data

### Week 2: File Upload & PDF Conversion
- **Milestone 2**: File storage service
  - Set up Cloudflare R2 integration
  - Implement file upload service (Multer)
  - Implement .docx to PDF conversion (LibreOffice headless)
  - Create signed URL generation for secure downloads

### Week 3: Student Submission Flow
- **Milestone 3**: Student essay endpoints and UI
  - REST API for essay assignments, submissions, version history
  - Word file upload endpoint
  - Automatic PDF conversion on upload
  - Version incrementing logic

### Week 4: Teacher Review Flow
- **Milestone 4**: Teacher feedback endpoints
  - REST API for downloading PDFs for review
  - Annotated PDF upload endpoint
  - Feedback submission with status updates
  - Notification system (email alerts)

### Week 5: Version Comparison
- **Milestone 5**: Comparison features
  - Side-by-side PDF viewer endpoint
  - Version navigation API
  - Metadata and status tracking

### Week 6: Testing & Polish
- **Milestone 6**: Integration and testing
  - Unit tests for services
  - Integration tests for API endpoints
  - E2E tests for full workflow
  - Performance testing (large file uploads)
  - Security review (file validation, permissions)

---

## MILESTONE BREAKDOWN

### MILESTONE 1: Database Schema Migration (Week 1)

#### Task 1.1: Update Prisma Schema
**Duration**: 2 hours

**Steps**:
1. Add Teacher, EssayAssignment, Essay, EssaySubmission, TeacherFeedback models to `prisma/schema.prisma`
2. Update Student model with `essays Essay[]` relation
3. Update Content model with `essayAssignments EssayAssignment[]` relation
4. Review cascade delete behavior and indexes

**Files to Update**:
- `/prisma/schema.prisma`

---

#### Task 1.2: Create Migration
**Duration**: 1 hour

**Steps**:
1. Generate Prisma migration:
   ```bash
   npx prisma migrate dev --name add_essay_feedback_system
   ```
2. Review generated SQL migration
3. Apply migration to development database
4. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

**Files Created**:
- `/prisma/migrations/YYYYMMDDHHMMSS_add_essay_feedback_system/migration.sql`

---

#### Task 1.3: Seed Data for Testing
**Duration**: 2 hours

**Steps**:
1. Update `prisma/seed.ts` to include:
   - Sample teacher user
   - Sample essay assignment linked to existing content
   - Sample essay with 2-3 submission versions
   - Sample teacher feedback

**Example Seed**:
```typescript
// Create teacher
const teacher = await prisma.teacher.create({
  data: {
    username: 'teacher_jane',
    email: 'teacher@test.com',
    password: await bcrypt.hash('password123', 10),
    firstName: 'Jane',
    lastName: 'Smith',
  },
});

// Create essay assignment on existing content
const assignment = await prisma.essayAssignment.create({
  data: {
    contentId: content.id, // From existing seed content
    teacherId: teacher.id,
    title: 'Character Analysis Essay',
    prompt: 'Analyze the protagonist\'s character development in Chapter 1.',
    dueDate: new Date('2025-12-31'),
  },
});

// Create student essay
const essay = await prisma.essay.create({
  data: {
    assignmentId: assignment.id,
    studentId: student.id, // From existing seed student
    status: 'IN_PROGRESS',
  },
});

// Create submission version 1
await prisma.essaySubmission.create({
  data: {
    essayId: essay.id,
    versionNumber: 1,
    originalDocxUrl: 'https://r2.example.com/essays/essay1/v1/original.docx',
    pdfUrl: 'https://r2.example.com/essays/essay1/v1/submission.pdf',
    annotatedPdfUrl: 'https://r2.example.com/essays/essay1/v1/feedback.pdf',
    status: 'FEEDBACK_RECEIVED',
  },
});
```

**Files to Update**:
- `/prisma/seed.ts`

**Testing**:
```bash
npm run prisma:seed
npx prisma studio  # Verify data in Prisma Studio
```

**Duration**: ~5 hours total

---

### MILESTONE 2: File Upload & PDF Conversion (Week 2)

#### Task 2.1: Cloudflare R2 Setup
**Duration**: 3 hours

**Steps**:
1. **Install Cloudflare S3-compatible SDK**:
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Add environment variables** to `.env`:
   ```env
   # Cloudflare R2
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=learning-platform-essays
   R2_PUBLIC_URL=https://essays.yourdomain.com
   ```

3. **Update configuration** (`src/config/configuration.ts`):
   ```typescript
   export default () => ({
     // ... existing config ...
     r2: {
       accountId: process.env.R2_ACCOUNT_ID,
       accessKeyId: process.env.R2_ACCESS_KEY_ID,
       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
       bucketName: process.env.R2_BUCKET_NAME,
       publicUrl: process.env.R2_PUBLIC_URL,
     },
   });
   ```

4. **Create R2 Service** (`src/common/services/r2.service.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   @Injectable()
   export class R2Service {
     private s3Client: S3Client;
     private bucketName: string;
     private publicUrl: string;

     constructor(private configService: ConfigService) {
       const accountId = this.configService.get<string>('r2.accountId');
       this.bucketName = this.configService.get<string>('r2.bucketName');
       this.publicUrl = this.configService.get<string>('r2.publicUrl');

       this.s3Client = new S3Client({
         region: 'auto',
         endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
         credentials: {
           accessKeyId: this.configService.get<string>('r2.accessKeyId'),
           secretAccessKey: this.configService.get<string>('r2.secretAccessKey'),
         },
       });
     }

     async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
       const command = new PutObjectCommand({
         Bucket: this.bucketName,
         Key: key,
         Body: file,
         ContentType: contentType,
       });

       await this.s3Client.send(command);
       return `${this.publicUrl}/${key}`;
     }

     async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
       const command = new GetObjectCommand({
         Bucket: this.bucketName,
         Key: key,
       });

       return getSignedUrl(this.s3Client, command, { expiresIn });
     }

     async deleteFile(key: string): Promise<void> {
       const command = new DeleteObjectCommand({
         Bucket: this.bucketName,
         Key: key,
       });

       await this.s3Client.send(command);
     }
   }
   ```

5. **Create R2 Module** (`src/common/r2/r2.module.ts`):
   ```typescript
   import { Global, Module } from '@nestjs/common';
   import { R2Service } from './r2.service';

   @Global()
   @Module({
     providers: [R2Service],
     exports: [R2Service],
   })
   export class R2Module {}
   ```

6. **Import R2Module in AppModule**:
   ```typescript
   import { R2Module } from './common/r2/r2.module';

   @Module({
     imports: [
       // ... existing imports ...
       R2Module,
     ],
   })
   export class AppModule {}
   ```

**Files Created**:
- `/src/common/r2/r2.service.ts`
- `/src/common/r2/r2.module.ts`

**Files Updated**:
- `/src/config/configuration.ts`
- `/src/app.module.ts`
- `/.env`

---

#### Task 2.2: PDF Conversion Service
**Duration**: 4 hours

**Steps**:
1. **Install dependencies**:
   ```bash
   # Install LibreOffice (system dependency)
   # macOS: brew install libreoffice
   # Ubuntu: sudo apt-get install libreoffice
   # Docker: Add to Dockerfile
   ```

2. **Create PDF Conversion Service** (`src/common/pdf/pdf-conversion.service.ts`):
   ```typescript
   import { Injectable, InternalServerErrorException } from '@nestjs/common';
   import { exec } from 'child_process';
   import { promisify } from 'util';
   import { writeFile, unlink, mkdir } from 'fs/promises';
   import { existsSync } from 'fs';
   import { join } from 'path';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

   const execAsync = promisify(exec);

   @Injectable()
   export class PdfConversionService {
     private readonly tempDir = join(process.cwd(), 'temp');

     constructor(
       @InjectPinoLogger(PdfConversionService.name)
       private readonly logger: PinoLogger,
     ) {
       // Ensure temp directory exists
       if (!existsSync(this.tempDir)) {
         mkdir(this.tempDir, { recursive: true });
       }
     }

     async convertDocxToPdf(docxBuffer: Buffer, filename: string): Promise<Buffer> {
       const timestamp = Date.now();
       const inputPath = join(this.tempDir, `${timestamp}-${filename}`);
       const outputDir = this.tempDir;

       try {
         this.logger.info({ filename }, 'Starting DOCX to PDF conversion');

         // Write buffer to temp file
         await writeFile(inputPath, docxBuffer);

         // Convert using LibreOffice
         const command = `libreoffice --headless --convert-to pdf --outdir ${outputDir} ${inputPath}`;
         const { stdout, stderr } = await execAsync(command);

         if (stderr && !stderr.includes('Warning')) {
           this.logger.warn({ stderr }, 'LibreOffice conversion warning');
         }

         // Read generated PDF
         const pdfFilename = filename.replace(/\.docx?$/i, '.pdf');
         const pdfPath = join(outputDir, pdfFilename);

         if (!existsSync(pdfPath)) {
           throw new Error('PDF conversion failed - output file not found');
         }

         const pdfBuffer = await require('fs/promises').readFile(pdfPath);

         // Cleanup temp files
         await unlink(inputPath);
         await unlink(pdfPath);

         this.logger.info({ filename, pdfSize: pdfBuffer.length }, 'PDF conversion successful');

         return pdfBuffer;
       } catch (error) {
         this.logger.error({ error: error.message, filename }, 'PDF conversion failed');

         // Cleanup on error
         try {
           if (existsSync(inputPath)) await unlink(inputPath);
         } catch {}

         throw new InternalServerErrorException('Failed to convert document to PDF');
       }
     }
   }
   ```

3. **Create PDF Module** (`src/common/pdf/pdf.module.ts`):
   ```typescript
   import { Global, Module } from '@nestjs/common';
   import { PdfConversionService } from './pdf-conversion.service';

   @Global()
   @Module({
     providers: [PdfConversionService],
     exports: [PdfConversionService],
   })
   export class PdfModule {}
   ```

4. **Import PdfModule in AppModule**:
   ```typescript
   import { PdfModule } from './common/pdf/pdf.module';

   @Module({
     imports: [
       // ... existing imports ...
       PdfModule,
     ],
   })
   export class AppModule {}
   ```

**Files Created**:
- `/src/common/pdf/pdf-conversion.service.ts`
- `/src/common/pdf/pdf.module.ts`

**Files Updated**:
- `/src/app.module.ts`

**Testing**:
```typescript
// Unit test
const docxBuffer = await readFile('test.docx');
const pdfBuffer = await pdfConversionService.convertDocxToPdf(docxBuffer, 'test.docx');
expect(pdfBuffer).toBeDefined();
expect(pdfBuffer.length).toBeGreaterThan(0);
```

---

#### Task 2.3: File Upload Service
**Duration**: 3 hours

**Steps**:
1. **Install Multer**:
   ```bash
   npm install --save multer
   npm install --save-dev @types/multer
   ```

2. **Create File Upload Service** (`src/essays/services/file-upload.service.ts`):
   ```typescript
   import { Injectable, BadRequestException } from '@nestjs/common';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import { R2Service } from '../../common/r2/r2.service';
   import { PdfConversionService } from '../../common/pdf/pdf-conversion.service';

   @Injectable()
   export class FileUploadService {
     constructor(
       private r2Service: R2Service,
       private pdfConversionService: PdfConversionService,
       @InjectPinoLogger(FileUploadService.name)
       private readonly logger: PinoLogger,
     ) {}

     async uploadEssaySubmission(
       essayId: string,
       versionNumber: number,
       file: Express.Multer.File,
     ): Promise<{ docxUrl: string; pdfUrl: string }> {
       this.logger.info({ essayId, versionNumber, filename: file.originalname }, 'Uploading essay submission');

       // Validate file type
       if (!file.originalname.match(/\.(docx|doc)$/i)) {
         throw new BadRequestException('Only Word documents (.docx, .doc) are allowed');
       }

       // Validate file size (10MB max)
       const maxSize = 10 * 1024 * 1024; // 10MB
       if (file.size > maxSize) {
         throw new BadRequestException('File size must not exceed 10MB');
       }

       try {
         // Upload original .docx
         const docxKey = `essays/${essayId}/v${versionNumber}/original.docx`;
         const docxUrl = await this.r2Service.uploadFile(
           docxKey,
           file.buffer,
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         );

         this.logger.info({ essayId, versionNumber, docxUrl }, 'Original DOCX uploaded');

         // Convert to PDF
         const pdfBuffer = await this.pdfConversionService.convertDocxToPdf(file.buffer, file.originalname);

         // Upload PDF
         const pdfKey = `essays/${essayId}/v${versionNumber}/submission.pdf`;
         const pdfUrl = await this.r2Service.uploadFile(pdfKey, pdfBuffer, 'application/pdf');

         this.logger.info({ essayId, versionNumber, pdfUrl }, 'PDF uploaded successfully');

         return { docxUrl, pdfUrl };
       } catch (error) {
         this.logger.error({ error: error.message, essayId, versionNumber }, 'File upload failed');
         throw error;
       }
     }

     async uploadAnnotatedPdf(
       essayId: string,
       versionNumber: number,
       file: Express.Multer.File,
     ): Promise<string> {
       this.logger.info({ essayId, versionNumber, filename: file.originalname }, 'Uploading annotated PDF');

       // Validate file type
       if (!file.originalname.match(/\.pdf$/i)) {
         throw new BadRequestException('Only PDF files are allowed for annotations');
       }

       // Validate file size (15MB max for annotated PDFs)
       const maxSize = 15 * 1024 * 1024; // 15MB
       if (file.size > maxSize) {
         throw new BadRequestException('File size must not exceed 15MB');
       }

       try {
         const pdfKey = `essays/${essayId}/v${versionNumber}/feedback.pdf`;
         const pdfUrl = await this.r2Service.uploadFile(pdfKey, file.buffer, 'application/pdf');

         this.logger.info({ essayId, versionNumber, pdfUrl }, 'Annotated PDF uploaded successfully');

         return pdfUrl;
       } catch (error) {
         this.logger.error({ error: error.message, essayId, versionNumber }, 'Annotated PDF upload failed');
         throw error;
       }
     }
   }
   ```

**Files Created**:
- `/src/essays/services/file-upload.service.ts`

**Duration**: ~10 hours total

---

### MILESTONE 3: Student Submission Flow (Week 3)

#### Task 3.1: Essays Module Setup
**Duration**: 2 hours

**Steps**:
1. **Generate Essays Module**:
   ```bash
   nest g module essays
   nest g service essays
   nest g controller essays
   ```

2. **Import dependencies in EssaysModule**:
   ```typescript
   import { Module } from '@nestjs/common';
   import { EssaysService } from './essays.service';
   import { EssaysController } from './essays.controller';
   import { FileUploadService } from './services/file-upload.service';

   @Module({
     controllers: [EssaysController],
     providers: [EssaysService, FileUploadService],
   })
   export class EssaysModule {}
   ```

---

#### Task 3.2: Essay Assignment DTOs and Endpoints
**Duration**: 4 hours

**Steps**:
1. **Create DTOs** (`src/essays/dto/`):

   **create-assignment.dto.ts**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';

   export class CreateAssignmentDto {
     @ApiProperty({ example: 'content-id-123' })
     @IsString()
     contentId: string;

     @ApiProperty({ example: 'Character Analysis Essay' })
     @IsString()
     title: string;

     @ApiProperty({ example: 'Analyze the protagonist\'s development in Chapter 1.' })
     @IsString()
     prompt: string;

     @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
     @IsDateString()
     @IsOptional()
     dueDate?: string;

     @ApiProperty({ example: 3, required: false })
     @IsInt()
     @IsOptional()
     maxVersions?: number;
   }
   ```

   **submit-essay.dto.ts**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString } from 'class-validator';

   export class SubmitEssayDto {
     @ApiProperty({ example: 'assignment-id-123' })
     @IsString()
     assignmentId: string;
   }
   ```

   **submit-feedback.dto.ts**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   import { IsString } from 'class-validator';

   export class SubmitFeedbackDto {
     @ApiProperty({ example: 'Great improvement! Consider adding more examples.' })
     @IsString()
     feedbackText: string;
   }
   ```

2. **Create Essays Service** (`src/essays/essays.service.ts`):
   ```typescript
   import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
   import { PrismaService } from '../prisma/prisma.service';
   import { FileUploadService } from './services/file-upload.service';
   import { CreateAssignmentDto } from './dto/create-assignment.dto';
   import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

   @Injectable()
   export class EssaysService {
     constructor(
       private prisma: PrismaService,
       private fileUploadService: FileUploadService,
       @InjectPinoLogger(EssaysService.name)
       private readonly logger: PinoLogger,
     ) {}

     // Teacher: Create assignment
     async createAssignment(teacherId: string, dto: CreateAssignmentDto) {
       this.logger.info({ teacherId, contentId: dto.contentId }, 'Creating essay assignment');

       // Verify content exists
       const content = await this.prisma.content.findUnique({
         where: { id: dto.contentId },
       });

       if (!content) {
         throw new NotFoundException('Content not found');
       }

       const assignment = await this.prisma.essayAssignment.create({
         data: {
           ...dto,
           teacherId,
         },
         include: {
           content: true,
           teacher: {
             select: { id: true, firstName: true, lastName: true, email: true },
           },
         },
       });

       this.logger.info({ assignmentId: assignment.id }, 'Essay assignment created');

       return assignment;
     }

     // Student: Get assignments
     async getAssignmentsForStudent(studentId: string) {
       this.logger.debug({ studentId }, 'Fetching assignments for student');

       // For now, return all assignments (in production, filter by class/cohort)
       const assignments = await this.prisma.essayAssignment.findMany({
         include: {
           content: true,
           teacher: {
             select: { id: true, firstName: true, lastName: true },
           },
           essays: {
             where: { studentId },
             select: { id: true, status: true },
           },
         },
         orderBy: { dueDate: 'asc' },
       });

       return assignments;
     }

     // Student: Submit new version
     async submitEssayVersion(
       studentId: string,
       assignmentId: string,
       file: Express.Multer.File,
     ) {
       this.logger.info({ studentId, assignmentId, filename: file.originalname }, 'Submitting essay version');

       // Find or create essay
       let essay = await this.prisma.essay.findUnique({
         where: {
           assignmentId_studentId: {
             assignmentId,
             studentId,
           },
         },
         include: {
           submissions: {
             orderBy: { versionNumber: 'desc' },
             take: 1,
           },
           assignment: true,
         },
       });

       if (!essay) {
         essay = await this.prisma.essay.create({
           data: {
             assignmentId,
             studentId,
             status: 'IN_PROGRESS',
           },
           include: {
             submissions: true,
             assignment: true,
           },
         });
       }

       // Check if essay is completed
       if (essay.status === 'COMPLETED') {
         throw new BadRequestException('Essay is already marked as complete');
       }

       // Check max versions limit
       if (essay.assignment.maxVersions && essay.submissions.length >= essay.assignment.maxVersions) {
         throw new BadRequestException(`Maximum ${essay.assignment.maxVersions} versions allowed`);
       }

       // Calculate next version number
       const nextVersion = essay.submissions.length > 0 ? essay.submissions[0].versionNumber + 1 : 1;

       // Upload files
       const { docxUrl, pdfUrl } = await this.fileUploadService.uploadEssaySubmission(
         essay.id,
         nextVersion,
         file,
       );

       // Create submission
       const submission = await this.prisma.essaySubmission.create({
         data: {
           essayId: essay.id,
           versionNumber: nextVersion,
           originalDocxUrl: docxUrl,
           pdfUrl,
           status: 'SUBMITTED',
         },
       });

       this.logger.info({ submissionId: submission.id, versionNumber: nextVersion }, 'Essay version submitted');

       return submission;
     }

     // Student: Get essay with all versions
     async getEssayWithVersions(essayId: string, studentId: string) {
       this.logger.debug({ essayId, studentId }, 'Fetching essay with versions');

       const essay = await this.prisma.essay.findUnique({
         where: { id: essayId },
         include: {
           assignment: {
             include: {
               content: true,
               teacher: {
                 select: { id: true, firstName: true, lastName: true },
               },
             },
           },
           submissions: {
             include: {
               feedback: {
                 include: {
                   teacher: {
                     select: { id: true, firstName: true, lastName: true },
                   },
                 },
               },
             },
             orderBy: { versionNumber: 'asc' },
           },
         },
       });

       if (!essay) {
         throw new NotFoundException('Essay not found');
       }

       // Authorization check
       if (essay.studentId !== studentId) {
         throw new ForbiddenException('You can only access your own essays');
       }

       return essay;
     }

     // Teacher: Get submission for review
     async getSubmissionForReview(submissionId: string, teacherId: string) {
       this.logger.debug({ submissionId, teacherId }, 'Fetching submission for review');

       const submission = await this.prisma.essaySubmission.findUnique({
         where: { id: submissionId },
         include: {
           essay: {
             include: {
               student: {
                 select: { id: true, firstName: true, lastName: true, email: true },
               },
               assignment: {
                 include: {
                   content: true,
                 },
               },
             },
           },
           feedback: true,
         },
       });

       if (!submission) {
         throw new NotFoundException('Submission not found');
       }

       // Authorization: Verify teacher owns assignment
       if (submission.essay.assignment.teacherId !== teacherId) {
         throw new ForbiddenException('You can only review essays from your assignments');
       }

       return submission;
     }

     // Teacher: Submit feedback
     async submitFeedback(
       submissionId: string,
       teacherId: string,
       dto: SubmitFeedbackDto,
       annotatedPdfFile?: Express.Multer.File,
     ) {
       this.logger.info({ submissionId, teacherId }, 'Submitting feedback');

       const submission = await this.prisma.essaySubmission.findUnique({
         where: { id: submissionId },
         include: {
           essay: {
             include: {
               assignment: true,
             },
           },
         },
       });

       if (!submission) {
         throw new NotFoundException('Submission not found');
       }

       // Authorization
       if (submission.essay.assignment.teacherId !== teacherId) {
         throw new ForbiddenException('You can only provide feedback on your assignments');
       }

       // Upload annotated PDF if provided
       let annotatedPdfUrl: string | undefined;
       if (annotatedPdfFile) {
         annotatedPdfUrl = await this.fileUploadService.uploadAnnotatedPdf(
           submission.essayId,
           submission.versionNumber,
           annotatedPdfFile,
         );

         // Update submission with annotated PDF URL
         await this.prisma.essaySubmission.update({
           where: { id: submissionId },
           data: {
             annotatedPdfUrl,
             status: 'FEEDBACK_RECEIVED',
           },
         });
       } else {
         // Update status even without annotated PDF
         await this.prisma.essaySubmission.update({
           where: { id: submissionId },
           data: { status: 'FEEDBACK_RECEIVED' },
         });
       }

       // Create feedback record
       const feedback = await this.prisma.teacherFeedback.create({
         data: {
           submissionId,
           teacherId,
           feedbackText: dto.feedbackText,
         },
         include: {
           teacher: {
             select: { id: true, firstName: true, lastName: true },
           },
         },
       });

       this.logger.info({ feedbackId: feedback.id, submissionId }, 'Feedback submitted');

       return feedback;
     }

     // Teacher: Mark essay as complete
     async markEssayComplete(essayId: string, teacherId: string) {
       this.logger.info({ essayId, teacherId }, 'Marking essay as complete');

       const essay = await this.prisma.essay.findUnique({
         where: { id: essayId },
         include: {
           assignment: true,
         },
       });

       if (!essay) {
         throw new NotFoundException('Essay not found');
       }

       // Authorization
       if (essay.assignment.teacherId !== teacherId) {
         throw new ForbiddenException('You can only complete essays from your assignments');
       }

       const updated = await this.prisma.essay.update({
         where: { id: essayId },
         data: {
           status: 'COMPLETED',
           completedAt: new Date(),
         },
       });

       this.logger.info({ essayId }, 'Essay marked as complete');

       return updated;
     }
   }
   ```

3. **Create Essays Controller** (`src/essays/essays.controller.ts`):
   ```typescript
   import {
     Controller,
     Get,
     Post,
     Patch,
     Body,
     Param,
     UseGuards,
     Request,
     UseInterceptors,
     UploadedFile,
     BadRequestException,
   } from '@nestjs/common';
   import { FileInterceptor } from '@nestjs/platform-express';
   import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
   import { EssaysService } from './essays.service';
   import { CreateAssignmentDto } from './dto/create-assignment.dto';
   import { SubmitEssayDto } from './dto/submit-essay.dto';
   import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

   @ApiTags('Essays')
   @Controller('essays')
   @UseGuards(JwtAuthGuard)
   @ApiBearerAuth()
   export class EssaysController {
     constructor(private essaysService: EssaysService) {}

     // Teacher endpoints
     @Post('assignments')
     @ApiOperation({ summary: 'Create essay assignment (Teacher only)' })
     @ApiResponse({ status: 201, description: 'Assignment created successfully' })
     createAssignment(@Request() req, @Body() dto: CreateAssignmentDto) {
       // TODO: Add teacher role guard
       const teacherId = req.user.id; // Assumes teacher uses same auth
       return this.essaysService.createAssignment(teacherId, dto);
     }

     @Patch(':essayId/complete')
     @ApiOperation({ summary: 'Mark essay as complete (Teacher only)' })
     @ApiResponse({ status: 200, description: 'Essay marked as complete' })
     markComplete(@Param('essayId') essayId: string, @Request() req) {
       const teacherId = req.user.id;
       return this.essaysService.markEssayComplete(essayId, teacherId);
     }

     @Get('submissions/:submissionId/review')
     @ApiOperation({ summary: 'Get submission for review (Teacher only)' })
     @ApiResponse({ status: 200, description: 'Submission retrieved' })
     getSubmissionForReview(@Param('submissionId') submissionId: string, @Request() req) {
       const teacherId = req.user.id;
       return this.essaysService.getSubmissionForReview(submissionId, teacherId);
     }

     @Post('submissions/:submissionId/feedback')
     @UseInterceptors(FileInterceptor('annotatedPdf'))
     @ApiConsumes('multipart/form-data')
     @ApiOperation({ summary: 'Submit feedback with optional annotated PDF (Teacher only)' })
     @ApiBody({
       schema: {
         type: 'object',
         properties: {
           feedbackText: { type: 'string' },
           annotatedPdf: { type: 'string', format: 'binary' },
         },
       },
     })
     @ApiResponse({ status: 201, description: 'Feedback submitted' })
     submitFeedback(
       @Param('submissionId') submissionId: string,
       @Body() dto: SubmitFeedbackDto,
       @UploadedFile() file: Express.Multer.File,
       @Request() req,
     ) {
       const teacherId = req.user.id;
       return this.essaysService.submitFeedback(submissionId, teacherId, dto, file);
     }

     // Student endpoints
     @Get('assignments')
     @ApiOperation({ summary: 'Get all assignments (Student)' })
     @ApiResponse({ status: 200, description: 'Assignments retrieved' })
     getAssignments(@Request() req) {
       const studentId = req.user.id;
       return this.essaysService.getAssignmentsForStudent(studentId);
     }

     @Post('submissions')
     @UseInterceptors(FileInterceptor('file'))
     @ApiConsumes('multipart/form-data')
     @ApiOperation({ summary: 'Submit essay version (Student)' })
     @ApiBody({
       schema: {
         type: 'object',
         properties: {
           assignmentId: { type: 'string' },
           file: { type: 'string', format: 'binary' },
         },
       },
     })
     @ApiResponse({ status: 201, description: 'Essay version submitted' })
     submitEssay(
       @Body('assignmentId') assignmentId: string,
       @UploadedFile() file: Express.Multer.File,
       @Request() req,
     ) {
       if (!file) {
         throw new BadRequestException('File is required');
       }

       const studentId = req.user.id;
       return this.essaysService.submitEssayVersion(studentId, assignmentId, file);
     }

     @Get(':essayId')
     @ApiOperation({ summary: 'Get essay with all versions (Student)' })
     @ApiResponse({ status: 200, description: 'Essay retrieved' })
     getEssay(@Param('essayId') essayId: string, @Request() req) {
       const studentId = req.user.id;
       return this.essaysService.getEssayWithVersions(essayId, studentId);
     }
   }
   ```

**Files Created**:
- `/src/essays/dto/create-assignment.dto.ts`
- `/src/essays/dto/submit-essay.dto.ts`
- `/src/essays/dto/submit-feedback.dto.ts`
- `/src/essays/essays.service.ts` (updated)
- `/src/essays/essays.controller.ts` (updated)

**Duration**: ~6 hours total

---

### MILESTONE 4: Teacher Review Flow (Week 4)

#### Task 4.1: Email Notifications
**Duration**: 4 hours

**Steps**:
1. **Install SendGrid or AWS SES**:
   ```bash
   npm install @sendgrid/mail
   # or
   npm install @aws-sdk/client-ses
   ```

2. **Create Email Service** (`src/common/email/email.service.ts`):
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import * as sgMail from '@sendgrid/mail';
   import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

   @Injectable()
   export class EmailService {
     constructor(
       private configService: ConfigService,
       @InjectPinoLogger(EmailService.name)
       private readonly logger: PinoLogger,
     ) {
       const apiKey = this.configService.get<string>('email.sendgridApiKey');
       sgMail.setApiKey(apiKey);
     }

     async sendFeedbackNotification(studentEmail: string, studentName: string, assignmentTitle: string) {
       const msg = {
         to: studentEmail,
         from: this.configService.get<string>('email.fromAddress'),
         subject: `New Feedback: ${assignmentTitle}`,
         html: `
           <p>Hi ${studentName},</p>
           <p>Your teacher has provided feedback on your essay: <strong>${assignmentTitle}</strong>.</p>
           <p>Log in to view your feedback and submit a revised version.</p>
         `,
       };

       try {
         await sgMail.send(msg);
         this.logger.info({ studentEmail }, 'Feedback notification sent');
       } catch (error) {
         this.logger.error({ error: error.message, studentEmail }, 'Failed to send feedback notification');
       }
     }

     async sendNewSubmissionNotification(teacherEmail: string, teacherName: string, studentName: string, assignmentTitle: string) {
       const msg = {
         to: teacherEmail,
         from: this.configService.get<string>('email.fromAddress'),
         subject: `New Essay Submission: ${assignmentTitle}`,
         html: `
           <p>Hi ${teacherName},</p>
           <p><strong>${studentName}</strong> has submitted a new version of their essay: <strong>${assignmentTitle}</strong>.</p>
           <p>Log in to review and provide feedback.</p>
         `,
       };

       try {
         await sgMail.send(msg);
         this.logger.info({ teacherEmail }, 'New submission notification sent');
       } catch (error) {
         this.logger.error({ error: error.message, teacherEmail }, 'Failed to send submission notification');
       }
     }
   }
   ```

3. **Integrate into EssaysService**:
   - Call `emailService.sendNewSubmissionNotification()` after student submits
   - Call `emailService.sendFeedbackNotification()` after teacher submits feedback

**Files Created**:
- `/src/common/email/email.service.ts`
- `/src/common/email/email.module.ts`

---

### MILESTONE 5: Version Comparison (Week 5)

#### Task 5.1: Version Comparison Endpoint
**Duration**: 3 hours

**Steps**:
1. **Add endpoint to EssaysController**:
   ```typescript
   @Get(':essayId/compare')
   @ApiOperation({ summary: 'Compare two versions side-by-side' })
   @ApiQuery({ name: 'version1', required: true, type: Number })
   @ApiQuery({ name: 'version2', required: true, type: Number })
   @ApiResponse({ status: 200, description: 'Versions retrieved for comparison' })
   async compareVersions(
     @Param('essayId') essayId: string,
     @Query('version1') version1: number,
     @Query('version2') version2: number,
     @Request() req,
   ) {
     const studentId = req.user.id;
     return this.essaysService.compareVersions(essayId, version1, version2, studentId);
   }
   ```

2. **Add service method**:
   ```typescript
   async compareVersions(essayId: string, version1: number, version2: number, studentId: string) {
     const essay = await this.prisma.essay.findUnique({
       where: { id: essayId },
       include: {
         assignment: {
           include: { content: true },
         },
         submissions: {
           where: {
             versionNumber: {
               in: [version1, version2],
             },
           },
           include: {
             feedback: true,
           },
         },
       },
     });

     if (!essay) {
       throw new NotFoundException('Essay not found');
     }

     if (essay.studentId !== studentId) {
       throw new ForbiddenException('You can only compare your own essay versions');
     }

     if (essay.submissions.length !== 2) {
       throw new NotFoundException('One or both versions not found');
     }

     return {
       essay: {
         id: essay.id,
         assignment: essay.assignment,
       },
       version1: essay.submissions.find(s => s.versionNumber === version1),
       version2: essay.submissions.find(s => s.versionNumber === version2),
     };
   }
   ```

**Duration**: ~3 hours

---

### MILESTONE 6: Testing & Polish (Week 6)

#### Task 6.1: Unit Tests
**Duration**: 8 hours

**Test Coverage**:
- EssaysService: createAssignment, submitEssayVersion, submitFeedback
- FileUploadService: uploadEssaySubmission, uploadAnnotatedPdf
- PdfConversionService: convertDocxToPdf
- R2Service: uploadFile, getSignedDownloadUrl

**Example Test**:
```typescript
describe('EssaysService', () => {
  let service: EssaysService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EssaysService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FileUploadService,
          useValue: mockFileUploadService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EssaysService>(EssaysService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create assignment', async () => {
    const dto = {
      contentId: 'content-1',
      title: 'Test Essay',
      prompt: 'Write about...',
    };

    const result = await service.createAssignment('teacher-1', dto);
    expect(result).toBeDefined();
    expect(result.title).toBe('Test Essay');
  });
});
```

---

#### Task 6.2: Integration Tests
**Duration**: 6 hours

**Test Scenarios**:
- Full workflow: Create assignment → Submit essay → Provide feedback → Submit revision
- Authorization: Students can't access other students' essays
- File upload: DOCX upload and PDF conversion
- Validation: File type, file size limits

---

#### Task 6.3: E2E Tests
**Duration**: 4 hours

**Test Scenarios**:
- Student completes full iteration cycle
- Teacher reviews and provides feedback
- Version comparison works correctly

---

## API ENDPOINTS

### Teacher Endpoints

```
POST   /api/v1/essays/assignments
       Body: { contentId, title, prompt, dueDate?, maxVersions? }
       Response: EssayAssignment

GET    /api/v1/essays/submissions/:submissionId/review
       Response: EssaySubmission with student info and assignment details

POST   /api/v1/essays/submissions/:submissionId/feedback
       Body (multipart): { feedbackText, annotatedPdf (file) }
       Response: TeacherFeedback

PATCH  /api/v1/essays/:essayId/complete
       Response: Essay (status: COMPLETED)
```

### Student Endpoints

```
GET    /api/v1/essays/assignments
       Response: EssayAssignment[] (with content and teacher info)

POST   /api/v1/essays/submissions
       Body (multipart): { assignmentId, file (docx) }
       Response: EssaySubmission

GET    /api/v1/essays/:essayId
       Response: Essay with all submissions and feedback

GET    /api/v1/essays/:essayId/compare?version1=1&version2=2
       Response: { version1: EssaySubmission, version2: EssaySubmission }
```

---

## FILE STORAGE ARCHITECTURE

### Cloudflare R2 Bucket Structure

```
learning-platform-essays/
├── essays/
│   ├── {essayId}/
│   │   ├── v1/
│   │   │   ├── original.docx          # Student's Word file
│   │   │   ├── submission.pdf         # Auto-generated PDF
│   │   │   └── feedback.pdf           # Teacher's annotated PDF
│   │   ├── v2/
│   │   │   ├── original.docx
│   │   │   ├── submission.pdf
│   │   │   └── feedback.pdf
│   │   └── v3/
│   │       └── ...
```

### File URLs

- **Public URLs**: `https://essays.yourdomain.com/essays/{essayId}/v{version}/submission.pdf`
- **Signed URLs**: Generated on-demand with 1-hour expiration for downloads
- **CORS**: Configured for domain whitelist

---

## INTEGRATION WITH EXISTING MODULES

### Content Module Integration
- **EssayAssignment** has foreign key to **Content**
- Teachers select Content when creating assignments
- Students see content details (title, author, type) on assignment page
- Essays are organized by content in teacher dashboard

### Student Module Integration
- **Essay** has foreign key to **Student**
- Students see their essays in profile dashboard
- Progress tracking: Number of essays completed
- Statistics: Average revision count, completion rate

### Authentication Integration
- Reuse existing JWT authentication
- Add **Teacher** model with same auth pattern
- Role-based guards: `@UseGuards(JwtAuthGuard, TeacherRoleGuard)`
- Authorization checks in service layer

---

## TESTING STRATEGY

### Unit Tests (80% coverage target)
- All service methods
- File upload validation
- PDF conversion logic
- Authorization checks

### Integration Tests
- API endpoints with mocked database
- File upload flow
- Email notification triggers

### E2E Tests
- Full workflow from assignment to completion
- Multi-version submission cycle
- Teacher review and feedback flow

### Performance Tests
- Large file upload (10MB docx)
- PDF conversion time (<30 seconds)
- Concurrent uploads (10+ students)

---

## SECURITY CONSIDERATIONS

### File Upload Security
- **File Type Validation**: Only .docx and .pdf allowed
- **File Size Limits**: 10MB for .docx, 15MB for annotated PDFs
- **Virus Scanning**: Consider ClamAV integration for production
- **Filename Sanitization**: Use UUID-based filenames

### Access Control
- **Student Authorization**: Can only access own essays
- **Teacher Authorization**: Can only access own assignments
- **Signed URLs**: 1-hour expiration for downloads
- **CORS**: Whitelist allowed origins

### Data Privacy
- **PII Redaction**: Don't log email addresses in essay content
- **Secure Deletion**: Cascade delete files from R2 when essay deleted
- **Audit Logging**: Track all file uploads and feedback submissions

---

## FUTURE ENHANCEMENTS (Post-MVP)

### Phase 3+ Potential Features
- **Plagiarism Detection**: Integrate Turnitin or Copyleaks API
- **AI Writing Assistant**: Suggest improvements using GPT-4
- **Grading Rubrics**: Structured scoring criteria
- **Peer Review**: Student-to-student feedback
- **Version Diff Highlighting**: Text-level change detection
- **Timeline View**: Visual history of all versions
- **Batch Download**: Export all versions as ZIP
- **Analytics Dashboard**: Teacher insights on student progress

---

**Last Updated**: 2025-12-08
**Document Owner**: Engineering Team
**Status**: Ready for Implementation
