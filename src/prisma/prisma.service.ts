import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    await this.ensureAdmin();
  }

  private async ensureAdmin() {
    const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const plain = process.env.ADMIN_PASSWORD ?? 'admin123';

    const existing = await this.user.findUnique({ where: { email } });
    if (existing) return; // ya existe, no tocar

    const password = await hash(plain, 12);
    await this.user.create({
      data: { email, password, role: 'ADMIN' },
    });
    console.log('✔ Admin creado al iniciar:', email);
  }
}
