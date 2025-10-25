// @ts-nocheck
import {
  AfterAll,
  Given,
  setWorldConstructor,
  Then,
  When,
  World,
} from '@cucumber/cucumber';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { strict as assert } from 'node:assert';
import { AppModule } from '../../src/app.module';

import * as request from 'supertest';
type Response = request.Response;

class AppWorld extends World {
  app!: INestApplication;
  res!: Response;
  payload: any;
}
setWorldConstructor(AppWorld);

// Helpers
function hasCookieNamed(
  setCookieHeader: string[] | undefined,
  name: string,
): boolean {
  if (!setCookieHeader || setCookieHeader.length === 0) return false;
  return setCookieHeader.some((c) =>
    c.toLowerCase().startsWith(`${name.toLowerCase()}=`),
  );
}

Given('un payload válido de signup', function (this: AppWorld) {
  // Aseguramos SECRET_JWT para que el signAsync no falle en tests
  if (!process.env.SECRET_JWT) process.env.SECRET_JWT = 'test-secret';

  const rand = Date.now(); // evita colisiones por unique email/dni
  this.payload = {
    email: `user${rand}@mail.com`,
    password: 'S3gura.123',
    name: 'Jane',
    surname: 'Doe',
    address: 'Fake St 123',
    dni: 10000000 + (rand % 1000000),
    postalCode: '1000',
  };
});

When('hago POST {string}', async function (this: AppWorld, path: string) {
  // Levantamos la app Nest por escenario (simple y aislado)
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  this.app = moduleRef.createNestApplication();
  await this.app.init();

  this.res = await request(this.app.getHttpServer())
    .post(path)
    .send(this.payload);
});

Then('recibo {int}', function (this: AppWorld, expectedStatus: number) {
  assert.equal(this.res.status, expectedStatus);
});

Then(
  'la respuesta setea cookie {string}',
  function (this: AppWorld, cookieName: string) {
    const setCookie = this.res.headers['set-cookie'] as string[] | undefined;
    assert.ok(hasCookieNamed(setCookie, cookieName));
  },
);

Then('el body no expone campos sensibles', function (this: AppWorld) {
  // Tu controlador retorna `true`, así que el body no debería ser un objeto con campos.
  // Igual chequeamos robusto por si cambia en el futuro.
  const body = this.res.body;

  // Si Nest serializa true como "true" (texto), cubrir ambos casos:
  const asText = typeof body === 'string' ? body : JSON.stringify(body);
  const text = asText.toLowerCase();
  assert.ok(!text.includes('password'));
  assert.ok(!text.includes('passwordhash'));
});

AfterAll(async function (this: AppWorld) {
  if (this.app) {
    await this.app.close();
  }
});
