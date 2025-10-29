// @ts-nocheck
import { After, Before, setWorldConstructor, World } from '@cucumber/cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Settings } from 'luxon';
import * as supertest from 'supertest';
import { AppModule } from '../../src/app.module';

import { Given } from '@cucumber/cucumber';
import * as cookieParser from 'cookie-parser';
// 👇 OJO: el paquete debe coincidir con tu app (bullmq)
import { BullExplorer, BullRegistrar, getQueueToken } from '@nestjs/bullmq';
import { fn as mockFn } from 'jest-mock';

export class AppWorld extends World {
  app!: INestApplication;
  agent!: supertest.SuperAgentTest; // mantiene cookies
  setupAgent!: supertest.SuperAgentTest; // para crear usuarios de prueba
  res!: supertest.Response;
  payload: any;
  queueMock = { add: mockFn().mockResolvedValue({ id: 'job-xyz' }) };
}
setWorldConstructor(AppWorld);

Before(async function (this: AppWorld) {
  // Reloj/zona deterministas
  Settings.now = () => new Date('2025-10-26T12:00:00.000Z').getTime();
  Settings.defaultZone = 'America/Argentina/Buenos_Aires';
  if (!process.env.SECRET_JWT) process.env.SECRET_JWT = 'test-secret';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    // No levantes Workers (sin Redis en tests)
    .overrideProvider(BullExplorer)
    .useValue({
      register: () => undefined,
      registerWorkers: () => undefined,
      handleProcessor: () => undefined,
    })
    .overrideProvider(BullRegistrar)
    .useValue({ onModuleInit: () => undefined })
    // Mock de la queue "date"
    .overrideProvider(getQueueToken('date'))
    .useValue(this.queueMock)
    .compile();

  this.app = moduleRef.createNestApplication();
  this.app.use(cookieParser());
  this.app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await this.app.init();

  const http = this.app.getHttpServer();
  this.agent = supertest.agent(http);
  this.setupAgent = supertest.agent(http);
});

After(async function (this: AppWorld) {
  if (this.app) await this.app.close();
});

Given('la app Nest inicializada (integration)', function () {
  // No-op: la app ya se inicializa en el Before del setup
});

Given('la ValidationPipe global activa', function () {
  // No-op: ya se configura en el Before del setup
});
