import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DateModule } from './date/date.module';
import { ClientModule } from './client/client.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './auth/guards/role.guard';
import { validationSchema } from 'config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    AuthModule,
    DateModule,
    ClientModule,
    PaymentModule,
    PrismaModule,
  ],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
