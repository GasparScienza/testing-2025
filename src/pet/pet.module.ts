import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

@Module({
  controllers: [PetController],
  providers: [PetService, PrismaService, JwtService],
})
export class PetModule {}
