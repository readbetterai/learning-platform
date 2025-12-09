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

  console.log('✅ Created student:', student.username);

  // Create test teacher
  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      username: 'testteacher',
      email: 'teacher@test.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
    },
  });

  console.log('✅ Created teacher:', teacher.username);

  // Create sample content (book)
  const content = await prisma.content.create({
    data: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      contentType: 'BOOK',
      description: 'A classic American novel about the Jazz Age',
      publishedYear: 1925,
      averageDifficulty: 65,
    },
  });

  console.log('✅ Created content:', content.title);

  // Create sample chapter
  const chapter = await prisma.chapter.create({
    data: {
      contentId: content.id,
      chapterNumber: 1,
      title: 'Chapter 1: Introduction',
      content: 'In my younger and more vulnerable years...',
      wordCount: 200,
    },
  });

  console.log('✅ Created chapter:', chapter.title);

  // Create sample words
  const word1 = await prisma.word.create({
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

  const word2 = await prisma.word.create({
    data: {
      word: 'vulnerable',
      difficultyScore: 55,
      definitions: {
        create: {
          definition: 'Exposed to the possibility of being attacked or harmed',
        },
      },
      exampleSentences: {
        create: {
          sentence: 'The young child felt vulnerable in the new environment.',
        },
      },
    },
  });

  console.log('✅ Created words:', word1.word, word2.word);

  // Create essay assignment based on content
  const essayAssignment = await prisma.essayAssignment.create({
    data: {
      contentId: content.id,
      teacherId: teacher.id,
      title: 'Character Analysis: The Great Gatsby',
      prompt:
        'Analyze the character development of Jay Gatsby in Chapter 1. Discuss how Fitzgerald introduces the protagonist and what initial impressions the reader forms. Support your analysis with specific textual evidence.',
      dueDate: new Date('2025-12-31'),
      maxVersions: null, // Unlimited revisions
    },
  });

  console.log('✅ Created essay assignment:', essayAssignment.title);

  // Create student essay with two versions
  const essay = await prisma.essay.create({
    data: {
      assignmentId: essayAssignment.id,
      studentId: student.id,
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Created essay for student');

  // Create version 1 (initial submission)
  const submission1 = await prisma.essaySubmission.create({
    data: {
      essayId: essay.id,
      versionNumber: 1,
      originalDocxUrl: 'https://r2.example.com/essays/essay1/v1/original.docx',
      pdfUrl: 'https://r2.example.com/essays/essay1/v1/submission.pdf',
      annotatedPdfUrl: 'https://r2.example.com/essays/essay1/v1/feedback.pdf',
      status: 'FEEDBACK_RECEIVED',
    },
  });

  console.log('✅ Created essay submission version 1');

  // Create teacher feedback for version 1
  const feedback1 = await prisma.teacherFeedback.create({
    data: {
      submissionId: submission1.id,
      teacherId: teacher.id,
      feedbackText:
        'Good start! Your introduction effectively sets up your argument. However, you need to provide more specific textual evidence to support your claims. In paragraph 2, you mention Gatsby\'s "mysterious nature" but don\'t quote directly from the text. Please revise and add 2-3 direct quotes from Chapter 1 to strengthen your analysis. Also, consider discussing the narrator\'s perspective and how it shapes our understanding of Gatsby.',
    },
  });

  console.log('✅ Created teacher feedback for version 1');

  // Create version 2 (revised submission)
  const submission2 = await prisma.essaySubmission.create({
    data: {
      essayId: essay.id,
      versionNumber: 2,
      originalDocxUrl: 'https://r2.example.com/essays/essay1/v2/original.docx',
      pdfUrl: 'https://r2.example.com/essays/essay1/v2/submission.pdf',
      status: 'SUBMITTED',
    },
  });

  console.log('✅ Created essay submission version 2');

  // Create sample homework
  const homework = await prisma.homework.create({
    data: {
      studentId: student.id,
      dueDate: new Date('2025-12-15'),
      status: 'ASSIGNED',
      assignedWords: {
        create: [
          {
            wordId: word1.id,
            completed: false,
          },
          {
            wordId: word2.id,
            completed: false,
          },
        ],
      },
    },
  });

  console.log('✅ Created homework assignment');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 1 Student:', student.email);
  console.log('  - 1 Teacher:', teacher.email);
  console.log('  - 1 Content (Book):', content.title);
  console.log('  - 1 Chapter');
  console.log('  - 2 Words:', word1.word, ',', word2.word);
  console.log('  - 1 Essay Assignment:', essayAssignment.title);
  console.log('  - 1 Essay with 2 versions (v1 has feedback, v2 awaiting review)');
  console.log('  - 1 Homework assignment');
  console.log('\n🔐 Login credentials:');
  console.log('  Student: student@test.com / password123');
  console.log('  Teacher: teacher@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
