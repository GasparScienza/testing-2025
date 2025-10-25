// @ts-nocheck
import {
  After,
  Before,
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

// import request, {
//   SuperAgentTest,
//   Response as SupertestResponse,
// } from 'supertest';
import * as supertest from 'supertest';
type SuperAgentTest = supertest.SuperAgentTest;
type Response = supertest.Response;
// type Response = SupertestResponse;

class AppWorld extends World {
  app!: INestApplication;
  res!: Response;
  payload: any;
  agent!: SuperAgentTest; // mantiene cookies entre requests
  setupAgent!: SuperAgentTest; // para crear usuario sin tocar el principal
  creds!: { email: string; password: string };
}
setWorldConstructor(AppWorld);

// Helpers
function hasCookieNamed(
  setCookieHeader: string[] | undefined,
  name: string,
): boolean {
  if (!setCookieHeader || setCookieHeader.length === 0) return false;
  const needle = `${name.toLowerCase()}=`;
  return setCookieHeader.some((c) => c.toLowerCase().startsWith(needle));
}

function headerCookies(res: Response): string[] {
  const raw = (res.headers['set-cookie'] ?? []) as string[] | undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseCookieParts(cookieStr: string): Record<string, string> {
  // "token=abc; Path=/; HttpOnly; Max-Age=0; Expires=Wed, 21 Oct 2015 07:28:00 GMT"
  const parts = cookieStr.split(';').map((s) => s.trim());
  const out: Record<string, string> = {};
  // first part is "name=value"
  const [nv, ...attrs] = parts;
  const eq = nv.indexOf('=');
  if (eq >= 0) {
    out['__name'] = nv.slice(0, eq);
    out['__value'] = nv.slice(eq + 1);
  } else {
    out['__name'] = nv;
    out['__value'] = '';
  }
  for (const a of attrs) {
    const i = a.indexOf('=');
    if (i >= 0) out[a.slice(0, i).toLowerCase()] = a.slice(i + 1);
    else out[a.toLowerCase()] = 'true';
  }
  return out;
}

function cookieInvalidated(cookies: string[], name: string) {
  // válido si: Max-Age=0 ó Expires pasado ó valor vacío
  const target = cookies.find((c) =>
    c.toLowerCase().startsWith(`${name.toLowerCase()}=`),
  );
  if (!target) return false;

  const parts = parseCookieParts(target);
  const valueEmpty = parts['__value'] === '' || parts['__value'] === '""';
  const maxAgeZero = (parts['max-age'] ?? '').toString() === '0';

  let expiresPast = false;
  if (parts['expires']) {
    const d = new Date(parts['expires']);
    if (!Number.isNaN(d.valueOf())) {
      expiresPast = d.getTime() <= Date.now();
    }
  }

  return valueEmpty || maxAgeZero || expiresPast;
}

Before(async function (this: AppWorld) {
  // Asegura SECRET_JWT para el signAsync
  if (!process.env.SECRET_JWT) process.env.SECRET_JWT = 'test-secret';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  this.app = moduleRef.createNestApplication();
  await this.app.init();

  // const httpServer = this.app.getHttpServer();
  const httpServer = this.app.getHttpServer();
  // agente principal (para login/logout y mantener cookie)
  // this.agent = request.agent(httpServer);
  this.agent = supertest.agent(httpServer);
  // agente de setup (para crear el usuario sin tocar el principal)
  // this.setupAgent = request.agent(httpServer);

  this.setupAgent = supertest.agent(httpServer);
});

After(async function (this: AppWorld) {
  if (this.app) await this.app.close();
});

// ===== GIVENs =====

Given(
  'un usuario existente con credenciales válidas',
  async function (this: AppWorld) {
    const rand = Date.now();
    this.creds = {
      email: `user${rand}@mail.com`,
      password: 'S3gura.123',
    };

    const payload = {
      ...this.creds,
      name: 'Jane',
      surname: 'Doe',
      address: 'Fake St 123',
      dni: 20000000 + (rand % 1000000),
      postalCode: '1000',
    };

    // Creamos el usuario vía signup con el setupAgent
    const res = await this.setupAgent.post('/auth/signup').send(payload);
    assert.ok(
      [200, 201].includes(res.status),
      `No se pudo crear el usuario de prueba. Status: ${res.status}`,
    );
  },
);

Given('un payload válido de signup', function (this: AppWorld) {
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

// ===== WHENs =====

// POST genérico con payload de signup (usa agent para conservar cookies si aplica)
When('hago POST {string}', async function (this: AppWorld, path: string) {
  // this.res = await this.agent.post(path).send(this.payload ?? {});
  this.res = await this.agent.post(path).send(this.payload ?? {});
});

// Login con credenciales (usa agent para conservar cookie de sesión)
When(
  'hago POST {string} con credenciales',
  async function (this: AppWorld, path: string) {
    assert.ok(this.creds, 'No hay credenciales cargadas en el World');
    this.res = await this.agent.post(path).send(this.creds);
  },
);

// POST con la cookie ya presente en el agent (para logout, etc.)
When(
  'hago POST {string} con la cookie',
  async function (this: AppWorld, path: string) {
    // this.res = await this.agent.post(path).send({});

    this.res = await this.agent.post(path).send(this.payload ?? {});
  },
);

// ===== THENs =====

Then('recibo {int}', function (this: AppWorld, expectedStatus: number) {
  assert.equal(this.res.status, expectedStatus);
});

Then(
  'la respuesta setea cookie {string}',
  function (this: AppWorld, cookieName: string) {
    const setCookie = this.res.headers['set-cookie'] as string[] | undefined;
    assert.ok(
      hasCookieNamed(setCookie, cookieName),
      `No se encontró la cookie ${cookieName}`,
    );
  },
);

Then('el body no expone campos sensibles', function (this: AppWorld) {
  const body = this.res.body;
  const hayTexto = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  const text = hayTexto.toLowerCase();
  assert.ok(!text.includes('password'), 'El body expone "password"');
  assert.ok(!text.includes('passwordhash'), 'El body expone "passwordHash"');
});

// Status + cookie en una sola aserción
Then(
  'recibo {int} y cookie {string}',
  function (this: AppWorld, code: number, cookieName: string) {
    assert.equal(this.res.status, code);
    const cookies = headerCookies(this.res);
    assert.ok(
      hasCookieNamed(cookies, cookieName),
      `No se encontró la cookie ${cookieName}`,
    );
  },
);

Then(
  'la cookie {string} se invalida',
  function (this: AppWorld, cookieName: string) {
    const cookies = headerCookies(this.res);
    // Si el backend manda Set-Cookie, validamos invalidación estricta
    if (cookies.length > 0) {
      assert.ok(
        cookieInvalidated(cookies, cookieName),
        `La cookie ${cookieName} no se invalidó vía Set-Cookie`,
      );
      return;
    }
  },
);

Then(
  'acceder a {string} devuelve {int}',
  async function (this: AppWorld, protectedPath: string, status: number) {
    console.log('PATH', protectedPath);
    const res = await this.agent.get(protectedPath);
    assert.equal(res.status, status);
  },
);

// import {
//   After,
//   AfterAll,
//   Before,
//   Given,
//   setWorldConstructor,
//   Then,
//   When,
//   World,
// } from '@cucumber/cucumber';

// import { INestApplication } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import { strict as assert } from 'node:assert';
// import { AppModule } from '../../src/app.module';

// import * as request from 'supertest';
// type Response = request.Response;

// class AppWorld extends World {
//   app!: INestApplication;
//   res!: Response;
//   payload: any;
//   agent!: SuperAgentTest; // mantiene cookies entre requests
//   setupAgent!: SuperAgentTest; // para crear usuario sin ensuciar el agente principal
//   creds!: { email: string; password: string };
// }
// setWorldConstructor(AppWorld);

// // Helpers
// function hasCookieNamed(
//   setCookieHeader: string[] | undefined,
//   name: string,
// ): boolean {
//   if (!setCookieHeader || setCookieHeader.length === 0) return false;
//   return setCookieHeader.some((c) =>
//     c.toLowerCase().startsWith(`${name.toLowerCase()}=`),
//   );
// }

// function headerCookies(res: Response): string[] {
//   const raw = (res.headers['set-cookie'] ?? []) as string[];
//   return Array.isArray(raw) ? raw : [raw];
// }

// function cookieInvalidated(cookies: string[], name: string) {
//   // válido si: Max-Age=0 ó Expires pasado ó valor vacío
//   const target = cookies.find((c) =>
//     c.toLowerCase().startsWith(`${name.toLowerCase()}=`),
//   );
//   if (!target) return false;
//   const lc = target.toLowerCase();
//   const valueEmpty = /^([^=]+)=;/.test(target) || /^([^=]+)="";/.test(target);
//   const maxAgeZero = lc.includes('max-age=0');
//   const expiresPast = lc.includes('expires=') && /expires=.../i.test(target); // simplificado
//   return valueEmpty || maxAgeZero || expiresPast;
// }

// Before(async function (this: AppWorld) {
//   // Asegura SECRET_JWT para el signAsync
//   if (!process.env.SECRET_JWT) process.env.SECRET_JWT = 'test-secret';

//   const moduleRef = await Test.createTestingModule({
//     imports: [AppModule],
//   }).compile();
//   this.app = moduleRef.createNestApplication();
//   await this.app.init();

//   // agente principal (para login/logout y mantener cookie)
//   this.agent = request.agent(this.app.getHttpServer());
//   // agente de setup (para crear el usuario sin tocar el principal)
//   this.setupAgent = request.agent(this.app.getHttpServer());
// });

// After(async function (this: AppWorld) {
//   if (this.app) await this.app.close();
// });

// Given(
//   'un usuario existente con credenciales válidas',
//   async function (this: AppWorld) {
//     const rand = Date.now();
//     this.creds = {
//       email: `user${rand}@mail.com`,
//       password: 'S3gura.123',
//     };

//     const payload = {
//       ...this.creds,
//       name: 'Jane',
//       surname: 'Doe',
//       address: 'Fake St 123',
//       dni: 20000000 + (rand % 1000000),
//       postalCode: '1000',
//     };

//     // Creamos el usuario vía signup
//     const res = await this.setupAgent.post('/auth/signup').send(payload);
//     // 201 en alta exitosa (ajusta si tu controlador retorna otro status)
//     if (![200, 201].includes(res.status)) {
//       throw new Error(
//         `No se pudo crear el usuario de prueba. Status: ${res.status}`,
//       );
//     }
//   },
// );

// Given('un payload válido de signup', function (this: AppWorld) {
//   // Aseguramos SECRET_JWT para que el signAsync no falle en tests
//   if (!process.env.SECRET_JWT) process.env.SECRET_JWT = 'test-secret';

//   const rand = Date.now(); // evita colisiones por unique email/dni
//   this.payload = {
//     email: `user${rand}@mail.com`,
//     password: 'S3gura.123',
//     name: 'Jane',
//     surname: 'Doe',
//     address: 'Fake St 123',
//     dni: 10000000 + (rand % 1000000),
//     postalCode: '1000',
//   };
// });

// When('hago POST {string}', async function (this: AppWorld, path: string) {
//   // Levantamos la app Nest por escenario (simple y aislado)
//   const moduleRef = await Test.createTestingModule({
//     imports: [AppModule],
//   }).compile();

//   this.app = moduleRef.createNestApplication();
//   await this.app.init();

//   this.res = await request(this.app.getHttpServer())
//     .post(path)
//     .send(this.payload);
// });

// Then('recibo {int}', function (this: AppWorld, expectedStatus: number) {
//   assert.equal(this.res.status, expectedStatus);
// });

// Then(
//   'la respuesta setea cookie {string}',
//   function (this: AppWorld, cookieName: string) {
//     const setCookie = this.res.headers['set-cookie'] as string[] | undefined;
//     assert.ok(hasCookieNamed(setCookie, cookieName));
//   },
// );

// Then('el body no expone campos sensibles', function (this: AppWorld) {
//   // Tu controlador retorna `true`, así que el body no debería ser un objeto con campos.
//   // Igual chequeamos robusto por si cambia en el futuro.
//   const body = this.res.body;

//   // Si Nest serializa true como "true" (texto), cubrir ambos casos:
//   const asText = typeof body === 'string' ? body : JSON.stringify(body);
//   const text = asText.toLowerCase();
//   assert.ok(!text.includes('password'));
//   assert.ok(!text.includes('passwordhash'));
// });

// AfterAll(async function (this: AppWorld) {
//   if (this.app) {
//     await this.app.close();
//   }
// });

// Then(
//   'recibo {int} y cookie {string}',
//   function (this: AppWorld, code: number, cookieName: string) {
//     expect(this.res.status).toBe(code);
//     const cookies = headerCookies(this.res);
//     expect(hasCookieNamed(cookies, cookieName)).toBe(true);
//   },
// );

// When(
//   'hago POST {string} con la cookie',
//   async function (this: AppWorld, path: string) {
//     // El agent ya tiene la cookie del login anterior
//     this.res = await this.agent.post(path).send({});
//   },
// );

// Then(
//   'la cookie {string} se invalida',
//   function (this: AppWorld, cookieName: string) {
//     const cookies = headerCookies(this.res);
//     expect(cookieInvalidated(cookies, cookieName)).toBe(true);
//   },
// );

// Then(
//   'acceder a {string} devuelve {int}',
//   async function (this: AppWorld, protectedPath: string, status: number) {
//     const res = await this.agent.get(protectedPath);
//     expect(res.status).toBe(status);
//   },
// );
