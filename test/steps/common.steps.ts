// @ts-nocheck
import { Given, Then } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { AppWorld } from './setup';

// No-op: la app ya se inicializa en el Before del setup
Given('la app Nest inicializada', function () {});

// Igual con este, si lo usás en tus features
Given('la ValidationPipe global activa', function () {});

Then('recibo {int}', function (this: AppWorld, expected: number) {
  assert.equal(
    this.res.status,
    expected,
    `Status=${this.res.status}; body=${JSON.stringify(this.res.body)}`,
  );
});

Then(
  'el body tiene propiedad {string}',
  function (this: AppWorld, prop: string) {
    assert.ok(
      this.res.body && prop in this.res.body,
      `Falta "${prop}" en body`,
    );
  },
);

Then(
  'el mensaje de error contiene {string}',
  function (this: AppWorld, frag: string) {
    const msg = Array.isArray(this.res.body?.message)
      ? this.res.body.message.join(' | ')
      : String(this.res.body?.message ?? '');
    assert.ok(msg.includes(frag), `Mensaje no contiene "${frag}". Msg: ${msg}`);
  },
);

Given('tengo un usuario autenticado', async function (this: AppWorld) {
  const rand = Date.now();
  const creds = { email: `user${rand}@mail.com`, password: 'S3gura.123' };
  const payload = {
    ...creds,
    name: 'Jane',
    surname: 'Doe',
    address: 'Fake St 123',
    dni: `${10000000 + (rand % 1000000)}`,
    postalCode: '1000',
  };

  const s1 = await this.setupAgent.post('/auth/signup').send(payload);

  // ✅ si el usuario ya existe, aceptamos 400 y seguimos al login
  if (s1.status !== 201 && s1.status !== 400) {
    throw new Error(`signup falló con status=${s1.status}: ${s1.text}`);
  }

  // ahora login
  const s2 = await this.agent.post('/auth/login').send(creds);
  assert.equal(s2.status, 200, `login falló: ${s2.status}; body=${s2.text}`);
});
