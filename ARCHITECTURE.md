# Backend Architecture Plan
## English Learning Platform - High-Level System Design

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
- Book/Chapter/Sentence ingestion and storage
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

---

## 3. API Design Philosophy

**Hybrid Approach: GraphQL (Primary) + REST**

### GraphQL for:
- Student dashboards (complex nested queries: Student → Homework → Words → Progress)
- Content browsing (Book → Chapters → Sentences → Words)
- Progress reports (multi-level aggregations)
- Quiz taking interface (QuizAttempt with questions and answers)

**Advantages**:
- Schema perfectly suits GraphQL's relationship traversal
- Reduces over-fetching (mobile app friendly)
- Single query for complex student progress views
- Real-time subscriptions for quiz sessions

### REST for:
- Authentication/Authorization (POST /auth/login, /auth/register)
- File uploads (cover images, bulk content imports)
- Webhooks (external integrations)
- Simple CRUD operations (administrative tasks)

### Example GraphQL Schema Structure:
```graphql
type Query {
  student(id: ID!): Student
  book(id: ID!): Book
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

---

## 4. Core Workflows

### Student Learning Journey

#### A. Content Discovery & Assignment
1. Teacher/System assigns homework (creates Homework + HomeworkWord records)
2. Student receives notification with due date
3. Student views assigned words with definitions and example sentences
4. System tracks which words are completed (HomeworkWord.completed)

#### B. Active Learning Session
1. Student encounters word in book chapter context
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
   - Book reading progress
2. Teachers view student analytics
3. System adjusts difficulty recommendations

---

## 5. Data Flow Patterns

### Content Ingestion Pipeline
```
External Source → Content Parser → Validation →
Book/Chapter Creation → NLP Sentence Extraction →
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
- **Caching**: Word definitions, book content (immutable data)

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
  - Frequently accessed content (Word definitions, Book metadata)
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
1. **Content Service**: Book/Chapter/Word (mostly read-heavy)
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
- **Push Notifications**: Firebase Cloud Messaging, OneSignal for mobile apps
- **SMS**: Twilio for critical reminders

#### E. Storage
- **Object Storage**: AWS S3, Cloudinary for cover images, audio pronunciations
- **CDN**: CloudFront, Cloudflare for static content delivery

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

### Phase 1 (MVP - Months 1-3)
1. Core authentication and student management
2. Content ingestion (manual upload of books/words)
3. Basic homework assignment workflow
4. Simple quiz generation and taking
5. Basic progress tracking (StudentWordProgress CRUD)

### Phase 2 (Enhanced Features - Months 4-6)
1. Spaced repetition algorithm implementation
2. Advanced quiz types (FILL_BLANK, USAGE)
3. Analytics dashboards
4. Email notifications
5. GraphQL optimization for complex queries

### Phase 3 (Scale & Intelligence - Months 7-12)
1. NLP-powered content processing
2. Adaptive learning algorithms
3. Performance optimizations (caching, read replicas)
4. Mobile app API optimizations
5. Background job infrastructure

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
