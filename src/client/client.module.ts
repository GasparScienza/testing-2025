import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, JwtService],
})
export class ClientModule {}
