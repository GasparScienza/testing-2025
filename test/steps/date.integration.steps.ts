// // @ts-nocheck
// import { Given, Then, When } from '@cucumber/cucumber';
// import { strict as assert } from 'node:assert';

// // type SuperAgentTest = supertest.SuperAgentTest;
// // type Response = supertest.Response;

// // class DateWorld extends World {
// //   app!: INestApplication;
// //   agent!: SuperAgentTest;
// //   res!: Response;
// //   payload: any;
// //   // queueMock = { add: jest.fn().mockResolvedValue({ id: 'job-xyz' }) };

// //   queueMock = { add: mockFn().mockResolvedValue({ id: 'job-xyz' }) };
// // }
// // setWorldConstructor(DateWorld);

// // ===== GIVENs =====

// Given('la app Nest inicializada (integration)', function () {
//   /* noop */
// });

// Given('la ValidationPipe global activa', function () {
//   /* ya está */
// });

// Given(
//   'un payload válido de turno para {string} de {string} a {string} en {string}',
//   function (
//     this: DateWorld,
//     day: string,
//     start: string,
//     end: string,
//     tz: string,
//   ) {
//     this.payload = { day, startTime: start, endTime: end, timezone: tz };
//   },
// );

// // ===== WHENs =====

// When(
//   'hago POST {string} con el payload',
//   async function (this: DateWorld, path: string) {
//     // simula cookie de auth si usás un guard
//     this.res = await this.agent
//       .post(path)
//       .set('Content-Type', 'application/json')
//       .set('Cookie', 'token=fake.jwt.token')
//       .send(this.payload ?? {});
//   },
// );

// // ===== THENs =====

// Then('recibo {int}', function (this: DateWorld, expected: number) {
//   assert.equal(
//     this.res.status,
//     expected,
//     `Status real: ${this.res.status} - body: ${JSON.stringify(this.res.body)}`,
//   );
// });

// Then(
//   'el body tiene propiedad {string}',
//   function (this: DateWorld, prop: string) {
//     assert.ok(
//       this.res.body && prop in this.res.body,
//       `El body no contiene "${prop}": ${JSON.stringify(this.res.body)}`,
//     );
//   },
// );

// Then(
//   'la queue {string} recibió un job {string}',
//   function (qname: string, job: string) {
//     const calls = this.queueMock.add.mock.calls;
//     assert.equal(
//       calls.length,
//       1,
//       `Se esperaban 1 llamada, hubo ${calls.length}`,
//     );
//     const [jobName, payload, opts] = calls[0];

//     assert.equal(jobName, job);
//     assert.equal(payload.day, this.payload.day);
//     assert.equal(payload.startTime, this.payload.startTime);
//     assert.equal(payload.endTime, this.payload.endTime);
//     assert.ok(opts && typeof opts === 'object', 'Faltan opciones del job');
//   },
// );

// Then(
//   'el mensaje de error contiene {string}',
//   function (this: DateWorld, frag: string) {
//     const msg = Array.isArray(this.res.body?.message)
//       ? this.res.body.message.join(' | ')
//       : String(this.res.body?.message ?? '');
//     assert.ok(
//       msg.includes(frag),
//       `Mensaje no contiene "${frag}". Mensaje: ${msg}`,
//     );
//   },
// );

// @ts-nocheck
import { Given, Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { AppWorld } from './setup';

Given(
  'un payload válido de turno para {string} de {string} a {string} en {string}',
  function (
    this: AppWorld,
    day: string,
    start: string,
    end: string,
    tz: string,
  ) {
    this.payload = { day, startTime: start, endTime: end, timezone: tz };
  },
);

// WHENs
When(
  'hago POST {string} con el payload',
  async function (this: AppWorld, path: string) {
    this.res = await this.agent
      .post(path)
      .set('Content-Type', 'application/json')
      .set('Cookie', 'token=fake.jwt.token') // si tu guard mira la cookie
      .send(this.payload ?? {});
  },
);

// THENs
Then(
  'la queue {string} recibió un job {string}',
  function (this: AppWorld, _qname: string, job: string) {
    const calls = this.queueMock.add.mock.calls;
    assert.equal(
      calls.length,
      1,
      `Se esperaban 1 llamada, hubo ${calls.length}`,
    );
    const [jobName, payload, opts] = calls[0];
    assert.equal(jobName, job);
    assert.equal(payload.day, this.payload.day);
    assert.equal(payload.startTime, this.payload.startTime);
    assert.equal(payload.endTime, this.payload.endTime);
    assert.ok(opts && typeof opts === 'object', 'Faltan opciones del job');
  },
);
