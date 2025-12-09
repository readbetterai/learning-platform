# Backend Architecture Plan
## English Learning Platform - High-Level System Design

**Last Updated**: December 9, 2025
**Current Phase**: Phase 1 - Foundation (Milestone 0 Complete)
**Status**: ✅ Infrastructure Ready - Authentication Implementation Next

---

## Implementation Status

### ✅ Completed (Milestone 0)
- **NestJS Framework**: TypeScript-based modular architecture
- **Database**: PostgreSQL 16 with Prisma ORM
- **Infrastructure**:
  - Pino structured logging with PII redaction
  - Helmet security middleware
  - CORS configuration
  - Global validation pipes (class-validator)
  - Swagger API documentation
- **Database Schema**: 21 tables including:
  - Student, Teacher models
  - Content, Chapter, Word models
  - Homework, Quiz models
  - Essay feedback models (EssayAssignment, Essay, EssaySubmission, TeacherFeedback)
- **Seed Data**: Test accounts and sample content loaded

### ⏳ In Progress
- None - Ready to start Milestone 1

### 📋 Upcoming (Phase 1)
- **Milestone 1**: Authentication & Authorization (JWT, Passport)
- **Milestone 2**: Student Management
- **Milestone 3**: Content Management
- **Milestone 4**: Homework System
- **Milestone 5**: Quiz System
- **Milestone 6**: Progress Tracking
- **Milestone 7**: Testing Infrastructure
- **Milestone 8**: Production Deployment

### 📅 Future (Phase 2)
- Essay Feedback System (see `ESSAY_FEEDBACK_FEATURE_PLAN.md`)

---

## 1. Architecture Pattern: Modular Monolith

**Approach**: Modular Monolith with Domain-Driven Design (DDD)

**Rationale**:
- Early-stage platform with well-defined but interconnected domains
- Simplifies deployment and development
- Clear module boundaries enable future microservices extraction if needed

**Architecture Layers**:
```
┌─────────────────────────────────────────┐
│         API Gateway Layer               │  (REST/GraphQL endpoints)
├─────────────────────────────────────────┤
│      Application Services Layer         │  (Use cases/workflows)
├─────────────────────────────────────────┤
│         Domain Services Layer           │  (Business logic)
├─────────────────────────────────────────┤
│      Repository/Data Access Layer       │  (Prisma ORM)
├─────────────────────────────────────────┤
│           Database Layer                │  (PostgreSQL)
└─────────────────────────────────────────┘
```

**Future Path**: Modules designed with clear boundaries for potential extraction of:
- Content Service (read-heavy)
- Progress Service (write-heavy)
- Quiz Service (mixed workload, real-time needs)

---

## 2. Key System Modules (Bounded Contexts)

### A. Content Management Module
- Content/Chapter/Sentence ingestion and storage (books, articles, videos, podcasts)
- Word dictionary management (definitions, examples)
- Content search and retrieval
- Difficulty scoring algorithms

### B. Student Management Module
- Authentication and authorization
- Student profiles and preferences
- Learning level tracking

### C. Learning Progress Module
- StudentWordProgress tracking (spaced repetition logic)
- Homework assignment and completion
- Progress analytics and reporting
- Learning path recommendations

### D. Assessment Module
- Quiz generation (adaptive to student level)
- Quiz attempt management (state: IN_PROGRESS, COMPLETED)
- Answer evaluation and scoring
- Question-level analytics (via QuizAttemptAnswer)

### E. Analytics & Insights Module
- Learning patterns analysis
- Performance dashboards
- Difficulty calibration
- Word mastery trends

### F. Notification Module
- Homework due dates
- Review reminders (nextReviewAt scheduling)
- Achievement notifications
- Essay feedback notifications

### G. Essay Management Module (Phase 2)
- Content-based essay assignments (linked to books, articles, videos, podcasts)
- Student essay submission with Word document upload
- Automatic .docx to PDF conversion
- Teacher review with external annotation workflow
- Iterative feedback and revision cycles
- Version tracking and side-by-side comparison
- File storage via Cloudflare R2
- Email notifications for feedback and submissions

---

## 3. API Design Philosophy

**REST-First Approach (MVP), GraphQL Migration Path (Future)**

### Rationale: Start Simple, Evolve When Needed

For the MVP phase, we'll use a **RESTful API** with pragmatic endpoint design:
- **Lower complexity**: Well-understood by most developers
- **Faster initial development**: No GraphQL schema/resolver overhead
- **Mature tooling**: OpenAPI/Swagger documentation, Postman, standard HTTP caching
- **Clear migration path**: REST endpoints can coexist with GraphQL during gradual adoption

**When to consider GraphQL migration**:
- Mobile app experiences significant over-fetching (>50% unused data)
- Frontend requires 4+ sequential API calls for common views
- Real-time features become core (quiz sessions, live progress updates)
- Team has capacity to maintain GraphQL infrastructure

---

### REST API Design for MVP

#### Core Principles
1. **Resource-oriented URLs**: `/students`, `/content`, `/quizzes`
2. **Nested resources for relationships**: `/homeworks/:id/words`
3. **Query parameters for filtering**: `?status=ACTIVE&sort=dueDate`
4. **Embedded resources to reduce roundtrips**: `?include=words,progress`

#### Example Endpoints

**Authentication & Students**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/students/:id
PATCH  /api/students/:id
GET    /api/students/:id/profile
```

**Content Management**
```
GET    /api/content?type=BOOK&difficulty=INTERMEDIATE&page=1
GET    /api/content/:id
GET    /api/content/:id/chapters
GET    /api/chapters/:id/sentences?include=words
GET    /api/words/:id?include=definitions,examples
POST   /api/words/:id/track          # Add to student's learning list
```

**Homework Workflow**
```
GET    /api/students/:id/homeworks?status=ACTIVE&include=words
GET    /api/homeworks/:id?include=words.progress
POST   /api/homeworks
PATCH  /api/homework-words/:id/complete
GET    /api/homework-words/:id/progress
```

**Quiz System**
```
POST   /api/quizzes                   # Create quiz (admin/teacher)
GET    /api/quizzes/:id?include=questions
POST   /api/quiz-attempts             # Start quiz
GET    /api/quiz-attempts/:id
POST   /api/quiz-attempts/:id/answers # Submit answer
POST   /api/quiz-attempts/:id/complete
GET    /api/students/:id/quiz-attempts?page=1&limit=20
```

**Progress Tracking**
```
GET    /api/students/:id/progress?status=LEARNING&include=word
PATCH  /api/student-word-progress/:id
GET    /api/students/:id/analytics?from=2025-01-01&to=2025-01-31
GET    /api/students/:id/review-queue  # Words due for review (nextReviewAt)
```

**File Uploads**
```
POST   /api/content/:id/cover-image   # Multipart form upload
POST   /api/content/import            # Bulk content/chapter import
```

**Essay Management (Phase 2)**
```
# Teacher endpoints
POST   /api/essays/assignments                      # Create content-based essay assignment
GET    /api/essays/submissions/:id/review           # Get submission for review
POST   /api/essays/submissions/:id/feedback         # Upload annotated PDF + feedback (multipart)
PATCH  /api/essays/:id/complete                     # Mark essay as complete

# Student endpoints
GET    /api/essays/assignments                      # Get available assignments
POST   /api/essays/submissions                      # Upload .docx essay (multipart)
GET    /api/essays/:id                              # Get essay with all versions
GET    /api/essays/:id/compare?version1=1&version2=2 # Compare two versions
```

#### Response Patterns

**Success Response with Embedded Data**:
```json
GET /api/homeworks/123?include=words.progress

{
  "id": "123",
  "studentId": "456",
  "title": "Week 1 Vocabulary",
  "dueDate": "2025-12-15T00:00:00Z",
  "status": "ACTIVE",
  "words": [
    {
      "id": "789",
      "word": "eloquent",
      "progress": {
        "status": "LEARNING",
        "correctCount": 2,
        "nextReviewAt": "2025-12-10T10:00:00Z"
      }
    }
  ]
}
```

**Pagination**:
```json
GET /api/students/123/quiz-attempts?page=2&limit=20

{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "links": {
    "first": "/api/students/123/quiz-attempts?page=1&limit=20",
    "prev": "/api/students/123/quiz-attempts?page=1&limit=20",
    "next": "/api/students/123/quiz-attempts?page=3&limit=20",
    "last": "/api/students/123/quiz-attempts?page=8&limit=20"
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid quiz answer format",
    "details": [
      { "field": "answer", "issue": "Required for MULTIPLE_CHOICE questions" }
    ]
  }
}
```

---

### Future GraphQL Migration Path

**Phase 2-3 Consideration**: If the following criteria are met:
- ✅ Mobile app performance suffers from over-fetching
- ✅ Complex dashboard queries require 5+ REST calls
- ✅ Real-time features become critical (quiz sessions, notifications)
- ✅ Team has GraphQL expertise or capacity to learn

**Incremental Adoption Strategy**:
1. **Pilot with one module**: Start with Student Progress queries (most complex)
2. **Coexistence period**: REST and GraphQL run side-by-side
3. **Gradual migration**: Move endpoints one domain at a time
4. **Deprecation timeline**: 6-12 months for REST sunset (if full migration)

**Example GraphQL Schema (Future Reference)**:
```graphql
type Query {
  student(id: ID!): Student
  content(id: ID!): Content
  quiz(id: ID!): Quiz
  myHomeworks(page: Int, limit: Int): HomeworkConnection
}

type Mutation {
  submitQuizAnswer(attemptId: ID!, questionId: ID!, answer: String!): AnswerResult
  completeHomeworkWord(homeworkWordId: ID!): HomeworkWord
  updateStudentProgress(wordId: ID!, result: ProgressInput!): StudentWordProgress
}

type Subscription {
  quizAttemptUpdated(attemptId: ID!): QuizAttempt
  homeworkDueReminder(studentId: ID!): Notification
}
```

**GraphQL Advantages (when complexity warrants)**:
- Single query for complex nested data
- Eliminates over-fetching (critical for mobile)
- Built-in real-time subscriptions
- Self-documenting schema with introspection

---

## 3.1. API Design Trade-offs: Why REST-First?

### Comparison Summary

| Criteria | REST (Chosen for MVP) | GraphQL | Hybrid |
|----------|----------------------|---------|--------|
| **Initial Complexity** | ✅ Low | ⚠️ Medium | ❌ High |
| **Development Speed** | ✅ Fast | ⚠️ Moderate | ❌ Slower |
| **Team Learning Curve** | ✅ Minimal | ⚠️ Significant | ❌ Steepest |
| **Over-fetching Issues** | ⚠️ Moderate | ✅ None | ✅ None |
| **Mobile Performance** | ⚠️ Acceptable | ✅ Optimal | ✅ Optimal |
| **Caching** | ✅ HTTP native | ❌ Complex | ⚠️ Mixed |
| **Real-time Support** | ❌ Add WebSockets | ✅ Built-in subscriptions | ✅ Built-in |
| **File Uploads** | ✅ Native | ⚠️ Requires multipart spec | ✅ Use REST |
| **Tooling Maturity** | ✅ Excellent | ✅ Good | ⚠️ Fragmented |
| **Documentation** | ✅ OpenAPI/Swagger | ✅ Schema introspection | ⚠️ Two systems |
| **Operational Overhead** | ✅ Low | ⚠️ Medium | ❌ High |

### Decision Rationale

**Why REST for MVP?**
1. **Faster to market**: No GraphQL schema/resolver boilerplate for 50+ endpoints
2. **Team efficiency**: Most developers already know REST patterns
3. **Good enough**: Over-fetching is acceptable for web dashboard (not bandwidth-constrained)
4. **Proven caching**: HTTP caching (CDN, browser) works out-of-the-box
5. **OpenAPI documentation**: Auto-generated docs with Swagger UI

**GraphQL Migration Triggers**:
- ✅ Mobile app launched (bandwidth becomes critical)
- ✅ Dashboard requires 5+ sequential calls (e.g., Student → Homeworks → Words → Progress → Analytics)
- ✅ Real-time quiz sessions become core feature
- ✅ Team comfortable with initial architecture, ready for next complexity level

**Avoided "Hybrid Trap"**: Starting with both GraphQL and REST would:
- Double the API surface area to maintain
- Split team focus across two paradigms
- Delay MVP delivery by 30-50%
- Provide marginal benefit until user base scales

### REST Optimization Strategies (to delay GraphQL need)

1. **Embedded Resource Loading**:
   ```
   GET /api/homeworks/123?include=words,words.progress,student

   # Returns homework with all nested data in one response
   # Reduces need for GraphQL-style nested queries
   ```

2. **Field Filtering** (Sparse Fieldsets):
   ```
   GET /api/students/123?fields=id,name,email

   # Only return requested fields (reduces payload)
   # Mitigates over-fetching without GraphQL
   ```

3. **Batch Endpoints** (for common patterns):
   ```
   POST /api/students/batch
   {
     "ids": ["1", "2", "3"],
     "include": "homeworks,progress"
   }

   # Fetch multiple students in one request
   # Prevents N+1 requests from frontend
   ```

4. **Response Compression**:
   - Enable gzip/brotli on API server
   - Reduces bandwidth for large payloads

5. **Aggressive HTTP Caching**:
   - `Cache-Control: max-age=3600` for immutable content (Content, Word definitions)
   - `ETag` for conditional requests
   - CDN caching for public endpoints

---

## 4. Core Workflows

### Student Learning Journey

#### A. Content Discovery & Assignment
1. Teacher/System assigns homework (creates Homework + HomeworkWord records)
2. Student receives notification with due date
3. Student views assigned words with definitions and example sentences
4. System tracks which words are completed (HomeworkWord.completed)

#### B. Active Learning Session
1. Student encounters word in content chapter context (book, article, video transcript, etc.)
2. System retrieves word from Sentence → WordInSentence junction
3. Display word with definitions and curated examples
4. Student marks understanding level
5. System updates StudentWordProgress (status: NEW → LEARNING)

#### C. Quiz Assessment Flow
1. System generates quiz based on:
   - Recent homework words
   - Words with status "LEARNING" or "REVIEWING"
   - Difficulty threshold matching student level
2. Student starts quiz (creates QuizAttempt with status "IN_PROGRESS")
3. For each question:
   - Record answer in QuizAttemptAnswer (with timeSpentMs, confidenceLevel)
   - Immediate or delayed feedback based on quiz type
4. On completion:
   - Calculate final score
   - Update QuizAttempt status to "COMPLETED"
   - Bulk update StudentWordProgress based on performance
   - Schedule next review dates (spaced repetition)

#### D. Spaced Repetition Review
1. Background job queries StudentWordProgress.nextReviewAt
2. Generate review notifications
3. Create adaptive quiz focusing on due words
4. Update intervals based on correct/incorrect counts

#### E. Progress Monitoring
1. Dashboard aggregates:
   - Words by status (NEW, LEARNING, REVIEWING, MASTERED)
   - Homework completion rates
   - Quiz performance trends
   - Content reading/viewing progress
2. Teachers view student analytics
3. System adjusts difficulty recommendations

#### F. Essay Writing & Feedback Workflow (Phase 2)
1. **Assignment Creation**:
   - Teacher selects Content item (book chapter, article, video, podcast)
   - Teacher creates EssayAssignment with prompt and due date
   - Students receive notification
2. **Student Submission**:
   - Student reads/views assigned Content
   - Student writes essay in Microsoft Word (offline)
   - Student uploads .docx file → System auto-converts to PDF
   - Creates EssaySubmission (version 1) with status "SUBMITTED"
3. **Teacher Review**:
   - Teacher downloads PDF from Cloudflare R2
   - Teacher annotates PDF using external tool (Adobe, Preview)
   - Teacher uploads annotated PDF + written feedback
   - System updates submission status to "FEEDBACK_RECEIVED"
   - Student receives email notification
4. **Revision Iteration**:
   - Student views annotated PDF and feedback
   - Student revises essay incorporating feedback
   - Student uploads revised .docx → System creates version 2
   - Teacher reviews version 2 (can compare with version 1 side-by-side)
   - Cycle repeats until teacher marks essay as "COMPLETED"
5. **Version Comparison**:
   - Teacher uses side-by-side PDF viewer to compare versions
   - System tracks improvement across iterations
   - All versions and feedback preserved for audit/grading

---

## 5. Data Flow Patterns

### Content Ingestion Pipeline
```
External Source → Content Parser → Validation →
Content/Chapter Creation → NLP Sentence Extraction →
Word Tokenization → Dictionary Lookup →
WordInSentence Junction Creation → Difficulty Scoring
```

### Student Progress Tracking (Event-Driven)
```
Student Action → Event Emitter →
Progress Calculation Service →
Database Update →
Analytics Aggregation →
Notification Service (if thresholds met)
```

### Quiz Delivery & Scoring
```
Quiz Request → Question Selection Algorithm →
Quiz Attempt Creation →
Question-by-Question Submission (QuizAttemptAnswer) →
Real-time Scoring → Progress Update →
Spaced Repetition Scheduler
```

### Key Patterns
- **CQRS-lite**: Separate read models for dashboards (denormalized views)
- **Event Sourcing (partial)**: QuizAttemptAnswer provides granular history
- **Batch Processing**: Background jobs for review scheduling, analytics aggregation
- **Caching**: Word definitions, content data (immutable data)

---

## 6. Scalability Considerations

### Database Optimization
- **Indexes**: Already well-indexed (studentId, wordId, status, nextReviewAt)
- **Partitioning**: QuizAttemptAnswer table by date (grows rapidly)
- **Archiving**: Old quiz attempts after 6-12 months
- **Read Replicas**: For analytics and reporting queries

### Compute Scaling
- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Background Workers**: Separate process pool for:
  - Spaced repetition scheduling
  - Analytics computation
  - Content processing (NLP-heavy)
- **Caching Layer**: Redis for:
  - Session management
  - Frequently accessed content (Word definitions, Content metadata)
  - Rate limiting
  - Leaderboard calculations

### Performance Hotspots
1. **StudentWordProgress Queries**: Large student base with thousands of words
   - Solution: Pagination, status-based filtering, pre-computed aggregates
2. **Quiz Generation**: Complex algorithm selecting appropriate questions
   - Solution: Pre-generate quiz pools, cache question sets
3. **Real-time Quiz Attempts**: Concurrent users taking quizzes
   - Solution: Optimistic locking, eventual consistency for non-critical updates
4. **Analytics Dashboards**: Heavy aggregation queries
   - Solution: Materialized views, daily pre-computed reports, time-series database for trends

### Future Service Extraction
When hitting limits, extract:
1. **Content Service**: Content/Chapter/Word (mostly read-heavy)
2. **Progress Service**: StudentWordProgress, Homework (write-heavy)
3. **Quiz Service**: Quiz/Attempt/Answer (mixed workload, real-time needs)

---

## 7. Integration Points

### Essential Integrations

#### A. Authentication & Authorization
- **Options**: Auth0, Firebase Auth, Clerk, or custom JWT
- **Features Needed**:
  - Student/Teacher role separation
  - Session management
  - Multi-device support
  - Password reset flows

#### B. Content Sources
- **Dictionary APIs**: Merriam-Webster, Oxford, WordNet for automated definitions
- **NLP Services**: AWS Comprehend, Google Natural Language for:
  - Sentence extraction from chapter text
  - Difficulty scoring
  - Part-of-speech tagging
- **Content Import**: Support for EPUB, PDF parsing for book ingestion

#### C. Analytics & Monitoring
- **Application Monitoring**: Sentry, DataDog, New Relic
- **User Analytics**: Mixpanel, Amplitude for learning behavior
- **Custom Dashboards**: Grafana for operational metrics

#### D. Communication
- **Email Service**: SendGrid, AWS SES for:
  - Homework assignments
  - Review reminders (based on nextReviewAt)
  - Weekly progress reports
  - Essay feedback notifications (Phase 2)
  - New submission alerts for teachers (Phase 2)
- **Push Notifications**: Firebase Cloud Messaging, OneSignal for mobile apps
- **SMS**: Twilio for critical reminders

#### E. Storage
- **Object Storage**:
  - **Cloudflare R2**: Primary storage for essay files (.docx, PDFs) - Phase 2
  - AWS S3 or Cloudinary: Cover images, audio pronunciations
- **CDN**: Cloudflare for essay file delivery and static content
- **File Processing**: LibreOffice (headless) for .docx to PDF conversion - Phase 2

#### F. Payment (Future)
- **Stripe**: Subscription management for premium features
- **PayPal**: Alternative payment method

#### G. Machine Learning (Advanced)
- **Custom Models**: TensorFlow/PyTorch for:
  - Personalized difficulty prediction
  - Optimal review interval calculation
  - Content recommendation
- **Deployment**: AWS SageMaker, Google Vertex AI

---

## 8. Implementation Priorities

### Phase 1 (MVP - Months 1-3) - REST API Foundation
1. **Core authentication and student management**
   - JWT-based auth with /api/auth/* endpoints
   - Student registration and profile management
   - Role-based access control (Student/Teacher/Admin)

2. **RESTful API design with OpenAPI/Swagger documentation**
   - Core CRUD endpoints for all models
   - Embedded resource loading (?include= pattern)
   - Pagination, filtering, sorting standards
   - Error handling conventions

3. **Content ingestion (manual upload of content/words)**
   - Content/Chapter/Word creation via REST endpoints
   - Multipart file upload for cover images and thumbnails
   - CSV bulk import for vocabulary lists

4. **Basic homework assignment workflow**
   - POST /api/homeworks with word assignments
   - GET /api/students/:id/homeworks?include=words
   - PATCH /api/homework-words/:id/complete

5. **Simple quiz generation and taking**
   - POST /api/quiz-attempts (start quiz)
   - POST /api/quiz-attempts/:id/answers (submit answers)
   - POST /api/quiz-attempts/:id/complete (finish quiz)

6. **Basic progress tracking (StudentWordProgress CRUD)**
   - GET /api/students/:id/progress?status=LEARNING
   - PATCH /api/student-word-progress/:id
   - GET /api/students/:id/review-queue (nextReviewAt-based)

### Phase 2 (Enhanced Features - Months 4-6)
1. **Spaced repetition algorithm implementation**
   - Background job for nextReviewAt calculation
   - Adaptive interval adjustment based on performance
   - Review notification system

2. **Advanced quiz types (FILL_BLANK, USAGE)**
   - Extended question type support
   - Answer validation logic for each type
   - Question difficulty calibration

3. **Analytics dashboards**
   - GET /api/students/:id/analytics endpoints
   - Pre-computed aggregations (daily batch jobs)
   - Performance trends and mastery reports

4. **Email notifications**
   - Homework due date reminders
   - Review queue notifications
   - Weekly progress summaries

5. **GraphQL evaluation and potential pilot**
   - **Criteria check**: Are we seeing >5 REST calls for common views?
   - **Pilot**: Implement GraphQL for Student Progress queries only
   - **Tooling**: Set up Apollo Server, GraphQL Playground
   - **Coexistence**: Run GraphQL alongside existing REST endpoints
   - **Decision**: Measure performance improvements before full migration

### Phase 3 (Scale & Intelligence - Months 7-12)
1. **NLP-powered content processing**
   - Automated sentence extraction from chapters
   - Difficulty scoring algorithms
   - Part-of-speech tagging for word analysis

2. **Adaptive learning algorithms**
   - Personalized quiz generation based on progress
   - Optimal review interval prediction (ML-based)
   - Content recommendation engine

3. **Performance optimizations**
   - Redis caching for frequently accessed content
   - Database read replicas for analytics queries
   - Query optimization (indexes, materialized views)
   - CDN for static content delivery

4. **Mobile app API optimizations**
   - **If GraphQL adopted**: Full migration for mobile endpoints
   - **If REST retained**: Response compression, field filtering
   - Offline sync strategies

5. **Background job infrastructure**
   - BullMQ for job queue management
   - Scheduled tasks: review scheduling, analytics aggregation
   - Event-driven progress updates

---

## 9. Technology Stack Suggestions

### Core Backend
- **Runtime**: Node.js (TypeScript) or Python (FastAPI)
- **API Framework**:
  - GraphQL: Apollo Server, Pothos (TypeScript), or Strawberry (Python)
  - REST: Express/Fastify (Node) or FastAPI (Python)
- **ORM**: Prisma (already chosen)
- **Database**: PostgreSQL (already chosen)

### Supporting Services
- **Caching**: Redis
- **Queue**: BullMQ (Node) or Celery (Python) for background jobs
- **Search**: Elasticsearch (if full-text search on book content needed)
- **Real-time**: WebSockets (Socket.io) for live quiz features

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes (scale) or Docker Compose (early stage)
- **CI/CD**: GitHub Actions, GitLab CI
- **Infrastructure**: AWS, Google Cloud, or DigitalOcean

---

## 10. Critical Success Factors

1. **Data Integrity**: The junction tables (WordInSentence, HomeworkWord, QuizAttemptAnswer) are crucial - ensure transactional consistency
2. **Performance**: Index optimization on high-query fields (already well done in schema)
3. **Extensibility**: Design for new question types without schema changes (JSON fields used wisely)
4. **Student Experience**: Fast API responses (<200ms for content retrieval, <500ms for mutations)
5. **Analytics Foundation**: QuizAttemptAnswer granularity enables powerful learning analytics
6. **Spaced Repetition**: Accurate nextReviewAt scheduling is core to learning effectiveness

---

## 11. Schema Strengths

The current Prisma schema demonstrates excellent design:
- ✅ Proper use of cascade deletes
- ✅ Comprehensive indexing strategy
- ✅ Separation of curated examples vs. book sentences
- ✅ Granular quiz tracking (QuizAttemptAnswer > deprecated JSON field)
- ✅ Spaced repetition fields (nextReviewAt, status)
- ✅ Metadata for analytics (timeSpentMs, confidenceLevel)

The architecture should leverage these strengths to build a robust, scalable learning platform.

---

**Last Updated**: 2025-12-07
