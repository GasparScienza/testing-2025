
// @ts-nocheck
import { Given, Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';
import { AppWorld } from './setup';

// Helpers cookies
function hasCookieNamed(setCookieHeader: string[] | undefined, name: string) {
  if (!setCookieHeader || setCookieHeader.length === 0) return false;
  const needle = `${name.toLowerCase()}=`;
  return setCookieHeader.some((c) => c.toLowerCase().startsWith(needle));
}
function headerCookies(res: any): string[] {
  const raw = (res.headers['set-cookie'] ?? []) as string[] | undefined;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}
function parseCookieParts(cookieStr: string) {
  const parts = cookieStr.split(';').map((s) => s.trim());
  const out: Record<string, string> = {};
  const [nv, ...attrs] = parts;
  const eq = nv.indexOf('=');
  out['__name'] = eq >= 0 ? nv.slice(0, eq) : nv;
  out['__value'] = eq >= 0 ? nv.slice(eq + 1) : '';
  for (const a of attrs) {
    const i = a.indexOf('=');
    if (i >= 0) out[a.slice(0, i).toLowerCase()] = a.slice(i + 1);
    else out[a.toLowerCase()] = 'true';
  }
  return out;
}
function cookieInvalidated(cookies: string[], name: string) {
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
    if (!Number.isNaN(d.valueOf())) expiresPast = d.getTime() <= Date.now();
  }
  return valueEmpty || maxAgeZero || expiresPast;
}

// GIVENs
Given('un payload válido de signup', function (this: AppWorld) {
  const rand = Date.now();
  const dni = 10000000 + (rand % 1000000); // 7-8 dígitos

  this.payload = {
    email: `user${rand}@mail.com`,
    password: 'S3gura.123',
    name: 'Jane',
    surname: 'Doe',
    address: 'Fake St 123',
    dni: String(dni),
    postalCode: '1000',
  };
});

Given(
  'un usuario existente con credenciales válidas',
  async function (this: AppWorld) {
    const rand = Date.now();
    const creds = { email: `user${rand}@mail.com`, password: 'S3gura.123' };
    this.creds = creds;
    const payload = {
      ...creds,
      name: 'Jane',
      surname: 'Doe',
      address: 'Fake',
      dni: 20000000 + (rand % 1000000),
      postalCode: '1000',
    };
    const res = await this.setupAgent.post('/auth/signup').send(payload);
    assert.ok(
      [200, 201].includes(res.status),
      `No se pudo crear usuario. Status=${res.status}`,
    );
  },
);

// WHENs
When('hago POST {string}', async function (this: AppWorld, path: string) {
  this.res = await this.agent.post(path).send(this.payload ?? {});
});
When(
  'hago POST {string} con credenciales',
  async function (this: AppWorld, path: string) {
    assert.ok(this.creds, 'No hay credenciales en el World');
    this.res = await this.agent.post(path).send(this.creds);
  },
);
When(
  'hago POST {string} con la cookie',
  async function (this: AppWorld, path: string) {
    this.res = await this.agent.post(path).send(this.payload ?? {});
  },
);

// THENs específicos auth
Then(
  'la respuesta setea cookie {string}',
  function (this: AppWorld, cookieName: string) {
    const setCookie = this.res.headers['set-cookie'] as string[] | undefined;
    assert.ok(
      hasCookieNamed(setCookie, cookieName),
      `No se encontró cookie ${cookieName}`,
    );
  },
);

Then('el body no expone campos sensibles', function (this: AppWorld) {
  const body = this.res.body;
  const text = (
    typeof body === 'string' ? body : JSON.stringify(body ?? {})
  ).toLowerCase();
  assert.ok(!text.includes('password'), 'Expone "password"');
  assert.ok(!text.includes('passwordhash'), 'Expone "passwordHash"');
});

Then(
  'recibo {int} y cookie {string}',
  function (this: AppWorld, code: number, cookieName: string) {
    if (this.res.status !== code) {
      throw new Error(
        `Status=${this.res.status}, body=${JSON.stringify(this.res.body)}`,
      );
    }
    const cookies = headerCookies(this.res);
    if (!hasCookieNamed(cookies, cookieName))
      throw new Error(`No se encontró cookie ${cookieName}`);
  },
);

Then(
  'la cookie {string} se invalida',
  function (this: AppWorld, cookieName: string) {
    const cookies = headerCookies(this.res);
    if (cookies.length > 0) {
      if (!cookieInvalidated(cookies, cookieName)) {
        throw new Error(`Cookie ${cookieName} no se invalidó`);
      }
    }
  },
);

Then(
  'acceder a {string} devuelve {int}',
  async function (this: AppWorld, path: string, status: number) {
    const res = await this.agent.get(path);
    if (res.status !== status) {
      throw new Error(`GET ${path} -> ${res.status} (esperado ${status})`);
    }
  },
);
