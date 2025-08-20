import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DateModule } from './date/date.module';
import { ClientModule } from './client/client.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [AuthModule, DateModule, ClientModule, PaymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
