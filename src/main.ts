import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './utils/bigint.interceptor';
import { AppLoggingService } from './utils/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logging = app.get(AppLoggingService);
  app.useLogger(logging);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new BigIntInterceptor());

  app.enableCors({
    origin: [
      'http://localhost',
      'https://localhost',
      'http://localhost:4200',
      'http://localhost:3000',
      'https://localhost:4200',
      'https://localhost:3000',
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('VetCare')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
  logging.log(`Application started on port ${process.env.PORT || 3000}`);
}
bootstrap();
