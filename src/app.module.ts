import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  ignore: 'pid,hostname',
                  singleLine: false,
                },
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
            'email',
          ],
          censor: '[REDACTED]',
          remove: false,
        },
        customProps: (req) => ({
          userId: (req as any).user?.id,
          studentId: (req as any).user?.studentId,
        }),
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 300 && res.statusCode < 400) return 'info';
          return 'info';
        },
        serializers: {
          req: (req) => ({
            id: (req as any).id,
            method: req.method,
            url: req.url,
            query: (req as any).query,
            params: (req as any).params,
            userId: (req as any).user?.id,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
