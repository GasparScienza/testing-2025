import { Module } from '@nestjs/common';
import { DateService } from './date.service';
import { DateController } from './date.controller';
import { BullModule } from '@nestjs/bullmq';
import { DATE_QUEUE, DateQueue } from './date.queue';
import { DateProcessor } from './date.processor';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: DATE_QUEUE,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 5,
        backoff: { type: 'exponential', delay: 500 },
      },
    }),
  ],
  controllers: [DateController],
  providers: [DateQueue, DateProcessor, DateService, PrismaService],
  exports: [DateQueue],
})
export class DateModule {}
