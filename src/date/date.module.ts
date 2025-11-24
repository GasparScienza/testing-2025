import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateController } from './date.controller';
import { DateProcessor } from './date.processor';
import { DATE_QUEUE, DateQueue } from './date.queue';
import { DateService } from './date.service';

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
