import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      whitelist: true,
      // transform: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://localhost:4200',
      'https://localhost:3000',
    ], // dominios permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // permite cabeceras personalizadas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // habilita métodos
    credentials: true, // permite cookies o cabeceras de autenticación
  });

  const config = new DocumentBuilder()
    .setTitle('VetCare')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
