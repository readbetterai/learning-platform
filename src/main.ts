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
