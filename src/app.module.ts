import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DateModule } from './date/date.module';
import { ClientModule } from './client/client.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './auth/guards/role.guard';
import { BullModule } from '@nestjs/bullmq';
import { validationSchema } from './config/validation.schema';
import { PetModule } from './pet/pet.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppLoggingService } from './utils/logging.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100
        }
      ]
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: await configService.get('REDIS_HOST'),
          port: await configService.get('REDIS_PORT'),
          password: await configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DateModule,
    ClientModule,
    PaymentModule,
    PrismaModule,
    PetModule,
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
    AppLoggingService
  ],
})
export class AppModule { }
