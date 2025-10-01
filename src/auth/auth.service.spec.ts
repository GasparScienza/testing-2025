// test/auth-login.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

const prisma = new PrismaClient();
const TEST_EMAIL = 'login@test.com';
const TEST_PASS = 'supersecret';

describe('Auth e2e - /auth/login', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(async () => {
    const hashed = await bcrypt.hash(TEST_PASS, 12);
    // borrar si ya existe
    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
    // crear usuario
    await prisma.user.create({
      data: {
        email: TEST_EMAIL.toLowerCase().trim(),
        password: hashed,
        role: 'USER',
        client: {
          create: {
            name: 'Test',
            surname: 'User',
            address: 'Somewhere 123',
            postalCode: '1000',
            dni: BigInt(String(12345678)),
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('devuelve 200, set-cookie y { success: true } con credenciales válidas', async () => {
    const res = await request(app.getHttpServer() as import('http').Server)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS })
      .expect(201);

    expect(res.body).toEqual({ success: true });
    const rawCookies = res.headers['set-cookie'];
    const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];

    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies.join(';')).toContain('token=');
  });

  it('devuelve 401 con contraseña inválida', async () => {
    await request(app.getHttpServer() as import('http').Server)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'mala' })
      .expect(401);
  });

  it('devuelve 401 si el usuario no existe', async () => {
    await request(app.getHttpServer() as import('http').Server)
      .post('/auth/login')
      .send({ email: 'no@existe.com', password: TEST_PASS })
      .expect(401);
  });
});
