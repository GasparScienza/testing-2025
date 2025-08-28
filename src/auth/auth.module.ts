import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './guards/role.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.getOrThrow<string>('SECRET_JWT'),
        signOptions: { expiresIn: '900s' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, ConfigService, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
